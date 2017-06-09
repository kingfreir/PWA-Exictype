var staticCacheName = 'exictype-v1';
var allCaches = [
  staticCacheName
];
var hostname = 'http://localhost:3000';

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      cache.addAll(['/',
      'sw.js',
      'bundle.js',
      'manifest.json',
      'config.json',
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
  var requestUrl = new URL(event.request.url);

  if(requestUrl.origin === location.origin){
    if(requestUrl.pathname.startsWith('/redis/messages')){
      event.respondWith(fetch(event.request));
      return;
    }
  }
  event.respondWith(
    caches.match(event.request).then(function(response){
    return response || fetch(event.request);
  }).catch(function(err){
    console.log('failed to fetch');
    return;
  }));
});

//push event are sent by server
self.addEventListener('push',function(event){
  const title = "New push";
  const options = {
    body: 'working'
  }
  event.waitUntil(self.registration.showNotification(title,options));
});

/*
self.addEventListener('periodicsync',function(event){
    if(event.tag == 'database_sync'){
      event.waitUntil(dbSync());
    }else{
      event.registration.unregister();
    }
});
*/

self.addEventListener('sync',function(event){
  if(event.tag == 'database_sync'){
    event.waitUntil(dbSync());
  }
});

function dbSync() {
    var request = self.indexedDB.open('msg-database');
    var db;

    request.onsuccess = function(event){
      db = request.result;

      var trans = db.transaction('received','readonly');

      var store = trans.objectStore('received');
      var index = store.index('rid');

      index.openCursor(null,'prev').onsuccess = function(event){
        var cursor = event.target.result;
        if(cursor){
          var url = new URL('../redis/messages?rid='+cursor.value.rid,hostname);
          fetch(url).then(function(response){
            response.json().then(function(res){
                //test res for content
                self.registration.showNotification("Exictype",{
                  body:"You have new messages!"
                });
            });
          });
        }
      }
    }
}
