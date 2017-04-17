self.addEventListener('fetch',function(event){
  console.log(event);
  event.respondWith(
    caches.match(event.request).then(function(response){
    return response || fetch(event.request);
  }));
});

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open("exictype-v2.1").then(function(cache){
      cache.addAll(['/',
      'sw.js',
      'app.js',
      '/socket.io/socket.io.js',
      'index.css',
      'index.html'
    ]);
    }).catch(function(error){
      console.log(error);
    }));
});
