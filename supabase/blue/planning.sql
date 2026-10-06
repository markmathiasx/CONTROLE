-- Additive MMSVH planning migration. Existing finances, passwords and sessions remain intact.
create table if not exists blue_private.budgets (
 category text primary key check(length(category) between 1 and 60),
 limit_cents bigint not null check(limit_cents between 1 and 100000000)
);
create table if not exists blue_private.bills (
 id uuid primary key, group_id uuid not null, title text not null check(length(title) between 1 and 200),
 amount_cents bigint not null check(amount_cents between 1 and 100000000),
 category text not null check(length(category) between 1 and 60), due_date date not null, due_day integer not null check(due_day between 1 and 31),
 kind text not null check(kind in ('expense','income')), repeat_monthly boolean not null default false,
 installment_index integer not null check(installment_index>0), installment_count integer not null check(installment_count between 1 and 60),
 user_id uuid not null references public.profiles(id), paid_entry_id uuid references public.gastos(id) on delete set null,
 paid_at timestamptz, unique(group_id,due_date)
);
create table if not exists blue_private.goals (
 id uuid primary key, title text not null check(length(title) between 1 and 200),
 target_cents bigint not null check(target_cents between 1 and 100000000),
 saved_cents bigint not null default 0 check(saved_cents>=0 and saved_cents<=target_cents),
 target_date date not null, user_id uuid not null references public.profiles(id)
);
alter table blue_private.budgets enable row level security;
alter table blue_private.bills enable row level security;
alter table blue_private.goals enable row level security;
create table if not exists blue_private.goal_deposits (
 id uuid primary key, goal_id uuid not null references blue_private.goals(id) on delete cascade,
 amount_cents bigint not null check(amount_cents>0), user_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
alter table blue_private.goal_deposits enable row level security;
revoke all on blue_private.goal_deposits from public,anon,authenticated;
grant all on blue_private.goal_deposits to service_role;
revoke all on blue_private.budgets,blue_private.bills,blue_private.goals from public,anon,authenticated;
grant all on blue_private.budgets,blue_private.bills,blue_private.goals to service_role;
create index if not exists mmsvh_bill_due on blue_private.bills(due_date) where paid_entry_id is null;
-- Keep the proven house/authentication core and compose new server-only operations.
do $$ begin
 if to_regprocedure('public.blue_rpc_core(text,jsonb,text)') is null then
  alter function public.blue_rpc(text,jsonb,text) rename to blue_rpc_core;
 end if;
end $$;
create or replace function public.blue_rpc(action text,payload jsonb default '{}'::jsonb,session_token text default '')
returns jsonb language plpgsql security invoker set search_path=blue_private,public,extensions,pg_catalog as $$
declare
 actor public.profiles%rowtype; bill blue_private.bills%rowtype; goal blue_private.goals%rowtype;
 result jsonb; record_id uuid; amount bigint; owner_id uuid; parts integer; i integer; next_date date; first_date date; entry_id uuid;
begin
 if action not in ('budget_save','budget_delete','bill_save','bill_delete','bill_pay','goal_save','goal_delete','goal_deposit','data') then
  return public.blue_rpc_core(action,payload,session_token);
 end if;
 select u.* into actor from public.profiles u join blue_private.sessions s on s.user_id=u.id
 where s.token_hash=encode(digest(session_token,'sha256'),'hex') and s.expires_at>now() and u.active and not u.first_login;
 if actor.id is null then return jsonb_build_object('ok',false,'status',401,'error','Sua sessão expirou. Entre novamente.'); end if;
 if action='data' then
  result:=public.blue_rpc_core(action,payload,session_token);
  if actor.role='viewer' then return result || jsonb_build_object('planning',jsonb_build_object('budgets','[]'::jsonb,'bills','[]'::jsonb,'goals','[]'::jsonb)); end if;
  return result || jsonb_build_object('planning',jsonb_build_object(
   'budgets',coalesce((select jsonb_agg(to_jsonb(b) order by category) from budgets b),'[]'::jsonb),
   'bills',coalesce((select jsonb_agg(to_jsonb(b) order by due_date,id) from bills b),'[]'::jsonb),
   'goals',coalesce((select jsonb_agg(to_jsonb(g) order by target_date,id) from goals g),'[]'::jsonb)));
 end if;
 if actor.role='viewer' then return jsonb_build_object('ok',false,'status',403,'error','Seu perfil permite somente leitura.'); end if;
 if action like 'budget_%' then
  if actor.username<>'mark' then return jsonb_build_object('ok',false,'status',403,'error','Somente Mark pode definir os limites compartilhados.'); end if;
  if action='budget_delete' then delete from budgets where category=payload->>'category';
  else insert into budgets values(payload->>'category',(payload->>'limit_cents')::bigint)
   on conflict(category) do update set limit_cents=excluded.limit_cents;
  end if;
 else
  record_id:=(payload->>'id')::uuid;
  if record_id is null then return jsonb_build_object('ok',false,'status',400,'error','Identificador obrigatório.'); end if;
  -- Serializes ownership changes, retries and generated recurring transactions.
  perform pg_advisory_xact_lock(hashtextextended(record_id::text,0));
  if action like 'bill_%' then
   select * into bill from bills where id=record_id for update; owner_id:=bill.user_id;
  else select * into goal from goals where id=record_id for update; owner_id:=goal.user_id; end if;
  if owner_id is not null and owner_id<>actor.id and actor.username<>'mark' then
   return jsonb_build_object('ok',false,'status',403,'error','Você só pode alterar seus próprios registros.');
  end if;
  if action='bill_save' then
   if bill.id is not null then return jsonb_build_object('ok',true); end if;
   amount:=(payload->>'amount_cents')::bigint; parts:=coalesce((payload->>'installments')::integer,1); first_date:=(payload->>'due_date')::date;
   if parts not between 1 and 60 or amount not between parts and 100000000 or first_date is null then
    return jsonb_build_object('ok',false,'status',400,'error','Informe valor, vencimento e de 1 a 60 parcelas.');
   end if;
   if parts>1 and coalesce((payload->>'repeat_monthly')::boolean,false) then return jsonb_build_object('ok',false,'status',400,'error','Escolha parcelamento ou repetição mensal.'); end if;
   for i in 0..parts-1 loop
    next_date:=(date_trunc('month',first_date)+make_interval(months=>i))::date;
    next_date:=next_date+(least(extract(day from first_date)::integer,extract(day from (next_date+interval '1 month - 1 day'))::integer)-1);
    insert into bills(id,group_id,title,amount_cents,category,due_date,due_day,kind,repeat_monthly,installment_index,installment_count,user_id)
    values(case when i=0 then record_id else gen_random_uuid() end,record_id,trim(payload->>'title'),amount/parts+case when i<amount%parts then 1 else 0 end,
     payload->>'category',next_date,extract(day from first_date)::integer,payload->>'kind',coalesce((payload->>'repeat_monthly')::boolean,false),i+1,parts,actor.id);
   end loop;
  elsif action='bill_delete' then
   if bill.paid_entry_id is not null then return jsonb_build_object('ok',false,'status',400,'error','Conta paga: edite o lançamento em Movimentações.'); end if;
   delete from bills where id=record_id;
  elsif action='bill_pay' then
   if bill.id is null then return jsonb_build_object('ok',false,'status',404,'error','Conta não encontrada.'); end if;
   if bill.paid_entry_id is not null then return jsonb_build_object('ok',true); end if;
   if (payload->>'date')::date > (now() at time zone 'America/Sao_Paulo')::date then return jsonb_build_object('ok',false,'status',400,'error','A baixa deve ter data de hoje ou anterior.'); end if;
   entry_id:=gen_random_uuid();
   insert into public.gastos(id,description,amount_cents,category,date,user_id,kind)
   values(entry_id,bill.title||case when bill.installment_count>1 then ' ('||bill.installment_index||'/'||bill.installment_count||')' else '' end,bill.amount_cents,bill.category,(payload->>'date')::date,actor.id,bill.kind);
   update bills set paid_entry_id=entry_id,paid_at=now() where id=record_id;
   if bill.repeat_monthly then
    next_date:=(date_trunc('month',bill.due_date)+interval '1 month')::date;
    next_date:=next_date+(least(bill.due_day,extract(day from(next_date+interval '1 month - 1 day'))::integer)-1);
    insert into bills(id,group_id,title,amount_cents,category,due_date,due_day,kind,repeat_monthly,installment_index,installment_count,user_id)
    values(gen_random_uuid(),bill.group_id,bill.title,bill.amount_cents,bill.category,next_date,bill.due_day,bill.kind,true,bill.installment_index+1,1,bill.user_id)
    on conflict(group_id,due_date) do nothing;
   end if;
  elsif action='goal_save' then
   insert into goals(id,title,target_cents,saved_cents,target_date,user_id)
   values(record_id,trim(payload->>'title'),(payload->>'target_cents')::bigint,0,(payload->>'target_date')::date,actor.id)
   on conflict(id) do update set title=excluded.title,target_cents=excluded.target_cents,target_date=excluded.target_date;
  elsif action='goal_delete' then delete from goals where id=record_id;
  elsif action='goal_deposit' then
   amount:=(payload->>'amount_cents')::bigint;
   if exists(select 1 from goal_deposits where id=(payload->>'deposit_id')::uuid and goal_id=goal.id and amount_cents=amount) then return jsonb_build_object('ok',true); end if;
   if goal.id is null or amount<=0 or amount is null or goal.saved_cents+amount>goal.target_cents then return jsonb_build_object('ok',false,'status',400,'error','Informe um aporte positivo dentro do valor restante da meta.'); end if;
   insert into goal_deposits(id,goal_id,amount_cents,user_id) values((payload->>'deposit_id')::uuid,goal.id,amount,actor.id);
   update goals set saved_cents=saved_cents+amount where id=record_id;
  end if;
 end if;
 insert into audit(user_id,action,record_id) values(actor.id,action,coalesce(record_id::text,payload->>'category'));
 return jsonb_build_object('ok',true);
exception when unique_violation then return jsonb_build_object('ok',false,'status',409,'error','Operação já registrada. Atualize os dados.');
when check_violation or not_null_violation or invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
 return jsonb_build_object('ok',false,'status',400,'error','Confira os valores, as datas e os campos obrigatórios.');
end $$;
revoke all on function public.blue_rpc(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.blue_rpc(text,jsonb,text) to service_role;
