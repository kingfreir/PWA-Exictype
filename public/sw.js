var staticCacheName = 'exictype-v1';
var allCaches = [
  staticCacheName
];
var hostname = 'http://localhost:3000';

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      cache.addAll(['/',
      '/chat',
      'sw.js',
      'login.js',
      'bundle.js',
      'imgs/icon.png',
      'manifest.json',
      'config',
      'w3.css'
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
    }else if(requestUrl.pathname.startsWith('/socket.io')){
      event.respondWith(queueSocket(event));
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
  var payload = event.data ? event.data.text():'no payload';
  const title = "Exictype";
  const options = {
    body: payload,
  }
  event.waitUntil(
    self.registration.showNotification(title,options)
  );
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

function send_unsent(){
  var request = self.indexedDB.open('msg-database');
  var db;

  request.onsuccess = function(event){
    db = request.result;

    var trans = db.transaction('unsent','readonly');

    var store = trans.objectStore('unsent');
    var index = store.index('id');

    index.openCursor().onsuccess = function(event){
      var cursor = event.target.result;
      if(cursor){

      }else{

      }
    }
  }
}

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
              console.log(res);
              if(res[0]!=undefined){
                self.registration.showNotification("Exictype",{
                  body:"You have new messages!"
                });
              }
            });
          });
        }
      }
    }
}

function queueSocket(event){
  
  return fetch(event.request);
}
