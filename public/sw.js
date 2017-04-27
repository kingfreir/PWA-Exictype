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

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open("exictype-v2").then(function(cache){
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
