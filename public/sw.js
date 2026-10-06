// Retire the legacy offline worker: shared financial data must not be cached.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
 await Promise.all((await caches.keys()).map(key => caches.delete(key)));
 await self.registration.unregister();
 const clients = await self.clients.matchAll({type:'window'});
 for (const client of clients) await client.navigate(client.url);
})()));
