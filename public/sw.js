var staticCacheName = 'exictype-v1';
var allCaches = [
  staticCacheName
];

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      cache.addAll(['/',
      'sw.js',
      'bundle.js',
      'index.css',
      'index.html'
    ]);
    }).catch(function(error){
      console.log(error);
    }));
});

//delete previous caches after activation of current service worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('exictype-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch',function(event){
  console.log(event);

  event.respondWith(
    caches.match(event.request).then(function(response){
    return response || fetch(event.request);
  }).catch(function(err){
    console.log('failed to fetch');
    return;
  }));
});
