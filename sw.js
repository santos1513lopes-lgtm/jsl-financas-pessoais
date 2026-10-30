const CACHE='jsl-shell-v2-3-json';
const FILES=['./','./index.html','./assets/style.css?v=2.3.0','./assets/core.js?v=2.3.0','./assets/vault.js?v=2.3.0','./assets/auth.js?v=2.3.0','./assets/app.js?v=2.3.0','./assets/icon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jsl-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin)return;if(!FILES.some(p=>new URL(p,self.registration.scope).href===url.href))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});
