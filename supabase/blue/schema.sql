-- Controle Blue v2: independent relational tables; existing workspace data is preserved.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists blue_private;
revoke all on schema blue_private from public, anon, authenticated;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete restrict, username text unique not null check(username in ('mark','andressa','sidney')),
 email text unique not null, name text not null, nome text generated always as (name) stored, role text not null check(role in ('admin','user','viewer')), active boolean not null default true,
 activation_hash text, activation_expires timestamptz, is_first_login boolean not null default true, first_login boolean generated always as (is_first_login) stored,
 check(username <> 'mark' or (role='admin' and active))
);
create table if not exists blue_private.sessions (
 token_hash text primary key, user_id uuid not null references public.profiles(id), expires_at timestamptz not null
);
create table if not exists blue_private.rate_limits (key text primary key, attempts integer not null, reset_at timestamptz not null);
create table if not exists public.casa_controle (
 id boolean primary key default true check(id), total_cents bigint not null check(total_cents>0),
 installment_cents bigint not null check(installment_cents>0), opening_paid_cents bigint not null check(opening_paid_cents>=0),
 opening_installments integer not null check(opening_installments>=0), due_day integer not null check(due_day between 1 and 28),
 valor_total numeric generated always as (total_cents::numeric/100) stored, valor_parcela numeric generated always as (installment_cents::numeric/100) stored, meses_pagos integer not null default 2, data_inicio date,
 check(opening_paid_cents<=total_cents)
);
create table if not exists public.gastos (
 id uuid primary key, description text not null check(length(description) between 1 and 200), amount_cents bigint not null check(amount_cents between 1 and 100000000),
 category text not null check(length(category) between 1 and 60), date date not null, user_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('expense','income')), created_at timestamptz not null default now()
);
create table if not exists public.casa_pagamentos (
 id uuid primary key, amount_cents bigint not null check(amount_cents between 1 and 100000000), date date not null,
 valor numeric generated always as (amount_cents::numeric/100) stored, data_pagamento date generated always as (date) stored, mes_referencia text not null default '', criado_por uuid generated always as (user_id) stored,
 note text not null default '' check(length(note)<=200), user_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table if not exists blue_private.audit (
 id bigint generated always as identity primary key, user_id uuid references public.profiles(id), action text not null,
 record_id text, created_at timestamptz not null default now()
);
create index if not exists blue_entries_date on public.gastos(date);
create index if not exists blue_payments_date on public.casa_pagamentos(date);
create index if not exists blue_sessions_user on blue_private.sessions(user_id);
alter table public.profiles enable row level security;
alter table blue_private.sessions enable row level security;
alter table blue_private.rate_limits enable row level security;
alter table public.casa_controle enable row level security;
alter table public.gastos enable row level security;
alter table public.casa_pagamentos enable row level security;
alter table blue_private.audit enable row level security;
insert into public.casa_controle(id,total_cents,installment_cents,opening_paid_cents,opening_installments,due_day) values(true,8000000,150000,300000,2,10) on conflict(id) do nothing;
create table if not exists blue_private.credential_jobs(user_id uuid primary key references public.profiles(id),lease_hash text not null,expires_at timestamptz not null);
alter table blue_private.credential_jobs enable row level security;
grant usage on schema blue_private,extensions to service_role;
grant all on all tables in schema blue_private to service_role;
grant usage,select on all sequences in schema blue_private to service_role;
grant all on public.profiles,public.casa_controle,public.casa_pagamentos,public.gastos to service_role;
-- RPC is server-only: service_role is required. Browser receives only an opaque HttpOnly session. Each action verifies a random database session and fresh RBAC.
-- Authentication necessarily precedes a session; activation requires a single-use 256-bit token.
create or replace function public.blue_rpc(action text, payload jsonb default '{}'::jsonb, session_token text default '')
returns jsonb language plpgsql security invoker set search_path = blue_private, public, extensions, pg_catalog as $$
declare
 actor public.profiles%rowtype; target public.profiles%rowtype; cfg public.casa_controle%rowtype;
 secret text; digest_token text; login_name text; pass text; rate_key text; count_attempts integer;
 lease_value text;
 record_id uuid; owner_id uuid; amount bigint; payment_sum bigint; result jsonb;
begin
 if action='auth_lookup' then
  login_name:=lower(trim(coalesce(payload->>'username','')));
  if login_name not in ('mark','andressa','sidney') then return jsonb_build_object('ok',false,'status',401,'error','Dados de acesso inválidos.'); end if;
  rate_key:='auth:'||login_name;
  delete from rate_limits where reset_at<now();
  insert into rate_limits values(rate_key,1,now()+interval '15 minutes') on conflict(key) do update set attempts=rate_limits.attempts+1 returning attempts into count_attempts;
  if count_attempts>15 then return jsonb_build_object('ok',false,'status',429,'error','Muitas tentativas. Aguarde 15 minutos.'); end if;
  select * into actor from profiles where username=login_name and active;
  if actor.id is null then return jsonb_build_object('ok',false,'status',401,'error','Dados de acesso inválidos.'); end if;
  return jsonb_build_object('ok',true,'id',actor.id,'email',actor.email,'first_login',actor.first_login);
 end if;
 if action='activation_check' then
  select * into actor from profiles where username=lower(payload->>'username') and active for update;
  if actor.id is null or not actor.first_login or actor.activation_hash is null or actor.activation_expires<now() or actor.activation_hash<>encode(digest(coalesce(payload->>'activation',''),'sha256'),'hex') then
   return jsonb_build_object('ok',false,'status',401,'error','Convite inválido ou expirado. Peça um novo ao Mark.');
  end if;
  lease_value:=encode(gen_random_bytes(32),'hex');
  delete from credential_jobs where user_id=actor.id and expires_at<now();
  insert into credential_jobs values(actor.id,encode(digest(lease_value,'sha256'),'hex'),now()+interval '2 minutes');
  return jsonb_build_object('ok',true,'id',actor.id,'lease',lease_value);
 end if;
 if action in ('session_issue','activation_commit') then
  select * into actor from profiles where id=(payload->>'verified_user_id')::uuid and active for update;
  if actor.id is null then return jsonb_build_object('ok',false,'status',401,'error','Conta indisponível.'); end if;
  if action='activation_commit' then
   if not exists(select 1 from credential_jobs where user_id=actor.id and lease_hash=encode(digest(coalesce(payload->>'lease',''),'sha256'),'hex') and expires_at>now()) then return jsonb_build_object('ok',false,'status',409,'error','Ativação expirada. Tente novamente.'); end if;
   delete from credential_jobs where user_id=actor.id;
   delete from sessions where user_id=actor.id;
   if not actor.first_login then return jsonb_build_object('ok',false,'status',409,'error','Conta já ativada.'); end if;
   update profiles set is_first_login=false,activation_hash=null,activation_expires=null where id=actor.id;
   actor.first_login:=false;
  end if;
  secret:=encode(gen_random_bytes(32),'hex');
  insert into sessions values(encode(digest(secret,'sha256'),'hex'),actor.id,now()+interval '30 days');
  delete from sessions where expires_at<now();
  delete from rate_limits where key='auth:'||actor.username;
  return jsonb_build_object('ok',true,'token',secret,'needsSetup',actor.first_login);
 end if;
 if action='setup_check' then
  select u.* into actor from profiles u join sessions s on s.user_id=u.id where s.token_hash=encode(digest(session_token,'sha256'),'hex') and s.expires_at>now() and u.active and u.first_login;
  if actor.id is null then return jsonb_build_object('ok',false,'status',401,'error','Ativação necessária.'); end if;
  lease_value:=encode(gen_random_bytes(32),'hex');
  delete from credential_jobs where user_id=actor.id and expires_at<now();
  insert into credential_jobs values(actor.id,encode(digest(lease_value,'sha256'),'hex'),now()+interval '2 minutes');
  return jsonb_build_object('ok',true,'id',actor.id,'lease',lease_value);
 end if;
 if action='session' then
  select u.* into actor from profiles u join sessions s on s.user_id=u.id where s.token_hash=encode(digest(session_token,'sha256'),'hex') and s.expires_at>now() and u.active;
  if actor.id is null then return jsonb_build_object('ok',false,'status',401); end if;
  return jsonb_build_object('ok',true,'id',actor.id,'username',actor.username,'role',actor.role,'first_login',actor.first_login);
 end if;
 if action='credential_release' then
  delete from credential_jobs where user_id=(payload->>'verified_user_id')::uuid and lease_hash=encode(digest(coalesce(payload->>'lease',''),'sha256'),'hex');
  return jsonb_build_object('ok',true);
 end if;
 digest_token:=encode(digest(session_token,'sha256'),'hex');
 select u.* into actor from profiles u join sessions s on s.user_id=u.id where s.token_hash=digest_token and s.expires_at>now() and u.active and not u.first_login;
 if actor.id is null then return jsonb_build_object('ok',false,'status',401,'error','Sua sessão expirou. Entre novamente.'); end if;
 if action='reset_commit' then
  if actor.username<>'mark' then return jsonb_build_object('ok',false,'status',403,'error','Somente Mark.'); end if;
  if not exists(select 1 from credential_jobs where user_id=(payload->>'verified_user_id')::uuid and lease_hash=encode(digest(coalesce(payload->>'lease',''),'sha256'),'hex') and expires_at>now()) then return jsonb_build_object('ok',false,'status',409,'error','Troca expirada. Tente novamente.'); end if;
  delete from credential_jobs where user_id=(payload->>'verified_user_id')::uuid;
  delete from sessions where user_id=(payload->>'verified_user_id')::uuid;
  insert into audit(user_id,action,record_id) values(actor.id,'reset_password',payload->>'verified_user_id');
  return jsonb_build_object('ok',true);
 end if;
 if action='logout' then delete from sessions where token_hash=digest_token; return jsonb_build_object('ok',true); end if;
 if action='data' then
  return jsonb_build_object('ok',true,'user',jsonb_build_object('id',actor.id,'username',actor.username,'name',actor.name,'role',actor.role,'active',actor.active,'first_login',actor.first_login),
   'users',(select jsonb_agg(jsonb_build_object('id',id,'username',username,'name',name,'role',role,'active',active,'first_login',first_login) order by username) from profiles),
   'entries',case when actor.role='viewer' then '[]'::jsonb else coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('username',u.name) order by e.date desc,e.created_at desc) from gastos e join profiles u on u.id=e.user_id),'[]'::jsonb) end,
   'payments',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('username',u.name) order by p.date desc,p.created_at desc) from casa_pagamentos p join profiles u on u.id=p.user_id),'[]'::jsonb),
   'settings',(select to_jsonb(s)-'id' from casa_controle s));
 end if;
 if action in ('user','settings','invite') and actor.username<>'mark' then return jsonb_build_object('ok',false,'status',403,'error','Somente Mark pode administrar o sistema.'); end if;
 if action='invite' then
  select * into target from profiles where username=lower(payload->>'username') for update;
  if target.id is null or not target.first_login then return jsonb_build_object('ok',false,'status',400,'error','Essa conta já foi ativada. Use a troca de senha.'); end if;
  secret:=encode(gen_random_bytes(32),'hex');
  update profiles set activation_hash=encode(digest(secret,'sha256'),'hex'),activation_expires=now()+interval '7 days' where id=target.id;
  insert into audit(user_id,action,record_id) values(actor.id,action,target.id::text);
  return jsonb_build_object('ok',true,'activation',secret,'username',target.username);
 end if;
 if action='user' or action='reset_check' then
  select * into target from profiles where username=lower(payload->>'username') for update;
  if target.id is null then return jsonb_build_object('ok',false,'status',404,'error','Usuário não encontrado.'); end if;
  if action='reset_check' then
   if actor.username<>'mark' then return jsonb_build_object('ok',false,'status',403,'error','Somente Mark.'); end if;
   if target.first_login then return jsonb_build_object('ok',false,'status',400,'error','Use o convite de ativação.'); end if;
   lease_value:=encode(gen_random_bytes(32),'hex');
   delete from credential_jobs where user_id=target.id and expires_at<now();
   insert into credential_jobs values(target.id,encode(digest(lease_value,'sha256'),'hex'),now()+interval '2 minutes');
   delete from sessions where user_id=target.id and token_hash<>digest_token;
   return jsonb_build_object('ok',true,'id',target.id,'lease',lease_value);
  end if;
  if target.username='mark' and ((payload ? 'role' and payload->>'role'<>'admin') or (payload ? 'active' and not (payload->>'active')::boolean)) then
   return jsonb_build_object('ok',false,'status',400,'error','Mark deve permanecer administrador ativo.');
  end if;
  update profiles set role=coalesce(payload->>'role',role),active=coalesce((payload->>'active')::boolean,active) where id=target.id;
  delete from sessions where user_id=target.id;
 elsif action='settings' then
  select * into cfg from casa_controle where id for update;
  select coalesce(sum(amount_cents),0) into payment_sum from casa_pagamentos;
  if (payload->>'total_cents')::bigint < cfg.opening_paid_cents+payment_sum then return jsonb_build_object('ok',false,'status',400,'error','O valor da casa não pode ser menor que o total pago.'); end if;
  update casa_controle set total_cents=(payload->>'total_cents')::bigint,installment_cents=(payload->>'installment_cents')::bigint,meses_pagos=opening_installments+floor(payment_sum::numeric/(payload->>'installment_cents')::bigint)::integer,due_day=(payload->>'due_day')::integer where id;
 elsif action in ('entry_save','entry_delete','payment_save','payment_delete') then
  if actor.role='viewer' then return jsonb_build_object('ok',false,'status',403,'error','Seu perfil permite somente leitura.'); end if;
  record_id:=(payload->>'id')::uuid;
  if record_id is null then return jsonb_build_object('ok',false,'status',400,'error','Identificador obrigatório.'); end if;
  -- One global lock serializes all house writes (including casa_controle and deletions), preventing overpayment races.
  select * into cfg from casa_controle where id for update;
  if action like 'entry_%' then select user_id into owner_id from gastos where id=record_id for update;
  else select user_id into owner_id from casa_pagamentos where id=record_id for update; end if;
  if actor.role<>'admin' and owner_id is not null and owner_id<>actor.id then return jsonb_build_object('ok',false,'status',403,'error','Você só pode alterar seus próprios lançamentos.'); end if;
  if action='entry_delete' then delete from gastos where id=record_id;
  elsif action='payment_delete' then delete from casa_pagamentos where id=record_id;
  else
   amount:=(payload->>'amount_cents')::bigint;
   if amount is null or amount<1 or amount>100000000 or (payload->>'amount_cents') !~ '^[0-9]+$' then return jsonb_build_object('ok',false,'status',400,'error','Valor inválido.'); end if;
   if coalesce(payload->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or (payload->>'date')::date>(now() at time zone 'America/Sao_Paulo')::date then return jsonb_build_object('ok',false,'status',400,'error','Informe uma data válida, sem pagamentos futuros.'); end if;
   if action='entry_save' then
    insert into gastos(id,description,amount_cents,category,date,user_id,kind) values(record_id,trim(payload->>'description'),amount,payload->>'category',(payload->>'date')::date,coalesce(owner_id,actor.id),payload->>'kind')
    on conflict(id) do update set description=excluded.description,amount_cents=excluded.amount_cents,category=excluded.category,date=excluded.date,kind=excluded.kind;
   else
    select coalesce(sum(amount_cents),0) into payment_sum from casa_pagamentos where id<>record_id;
    if cfg.opening_paid_cents+payment_sum+amount>cfg.total_cents then return jsonb_build_object('ok',false,'status',400,'error','O pagamento ultrapassa o saldo devedor.'); end if;
    insert into casa_pagamentos(id,amount_cents,date,user_id,note) values(record_id,amount,(payload->>'date')::date,coalesce(owner_id,actor.id),coalesce(payload->>'note',''))
    on conflict(id) do update set amount_cents=excluded.amount_cents,date=excluded.date,note=excluded.note;
   end if;
  end if;
 else return jsonb_build_object('ok',false,'status',404,'error','Operação não encontrada.');
 end if;
 insert into audit(user_id,action,record_id) values(actor.id,action,coalesce(record_id::text,target.id::text));
 return jsonb_build_object('ok',true);
exception when unique_violation then return jsonb_build_object('ok',false,'status',409,'error','Uma operação já está em andamento. Aguarde e tente novamente.');
when invalid_text_representation or check_violation or not_null_violation or datetime_field_overflow then
 return jsonb_build_object('ok',false,'status',400,'error','Revise os campos informados.');
end;
$$;
revoke all on function public.blue_rpc(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.blue_rpc(text,jsonb,text) to service_role;

-- Only a trusted auth-admin provisioning flow may create these profiles. Public signup is disabled.
-- DB constraints reserve Mark's administrator role; non-Mark accounts cannot become administrators.
alter table public.profiles add constraint blue_fixed_roles check((username='mark' and role='admin') or (username<>'mark' and role in ('user','viewer')));
create or replace function blue_private.current_role()
returns text language sql stable security definer set search_path=public,pg_catalog as $$
 select role from public.profiles where id=(select auth.uid()) and active and not first_login;
$$;
revoke all on function blue_private.current_role() from public,anon;
grant usage on schema blue_private to authenticated;
grant execute on function blue_private.current_role() to authenticated;
revoke all on public.profiles,public.casa_controle,public.casa_pagamentos,public.gastos from anon,authenticated;
grant select(id,username,name,nome,role,active,first_login,is_first_login) on public.profiles to authenticated;
grant select on public.casa_controle,public.casa_pagamentos,public.gastos to authenticated;
create policy blue_profiles_read on public.profiles for select to authenticated using(blue_private.current_role() is not null);
create policy blue_house_read on public.casa_controle for select to authenticated using(blue_private.current_role() is not null);
create policy blue_payments_read on public.casa_pagamentos for select to authenticated using(blue_private.current_role() is not null);
create policy blue_entries_read on public.gastos for select to authenticated using(blue_private.current_role() in ('admin','user'));
-- Writes go through the transactional, session-checked RPC only. These RLS predicates are defense in depth.
create policy blue_payments_insert on public.casa_pagamentos for insert to authenticated with check(blue_private.current_role() in ('admin','user') and criado_por=auth.uid());
create policy blue_entries_insert on public.gastos for insert to authenticated with check(blue_private.current_role() in ('admin','user') and user_id=auth.uid());
-- Recompute months-equivalent paid and reference month after all payment mutations.
create or replace function blue_private.payment_reference() returns trigger language plpgsql set search_path=public,pg_catalog as $$
 begin new.mes_referencia:=to_char(new.date,'YYYY-MM'); return new; end;
$$;
create trigger blue_payment_reference before insert or update on public.casa_pagamentos for each row execute function blue_private.payment_reference();
create or replace function blue_private.update_paid_months() returns trigger language plpgsql set search_path=public,pg_catalog as $$
 begin update public.casa_controle set meses_pagos=opening_installments+floor(coalesce((select sum(amount_cents) from public.casa_pagamentos),0)::numeric/installment_cents)::integer where id; return null; end;
$$;
create trigger blue_paid_months after insert or update or delete on public.casa_pagamentos for each statement execute function blue_private.update_paid_months();
revoke all on function blue_private.payment_reference(),blue_private.update_paid_months() from public,anon,authenticated;
