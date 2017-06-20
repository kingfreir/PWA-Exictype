var staticCacheName = 'exictype-v1';
var allCaches = [
  staticCacheName
];

self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      cache.addAll([
      '/',
      '/chat',
      'sw.js',
      'login.js',
      'bundle.js',
      'imgs/icon.png',
      'imgs/icon-4x.png',
      'manifest.json',
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
    if(requestUrl.pathname.startsWith('/socket.io')){
      //this does nothing;just a template
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

importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');

firebase.initializeApp({
  'messagingSenderId': "334941391422"
});
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  // Customize notification here
  const notificationTitle = 'Exictype';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/imgs/icon.png'
  };

  return self.registration.showNotification(notificationTitle,
      notificationOptions);
});


//push event are sent by server
self.addEventListener('push',function(event){
  var payload = event.data ? event.data.text():'no payload';
  const title = "Exictype";
  const options = {
    body:JSON.parse(payload).notification.body,
    icon:'imgs/icon.png'
  };
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
  }else if(event.tag == 'unsent_sync'){
    event.waitUntil(send_unsent());
  }else if(event.tag == 'socket_sync'){
    //unnecessary
  }
});

function send_unsent(){
  var request = self.indexedDB.open('msg-database');
  var db;

  request.onsuccess = function(event){
    db = request.result;
    var trans = db.transaction('unsent','readwrite');
    var store = trans.objectStore('unsent');
    var count = store.count();

    count.onsuccess = function(){
      var result = count.result;
      if(result>0){
        cursorSend(store);
      }
    }
  }
}

function cursorSend(store){
  var index = store.index('send_date');
  var requests = new Array();

  index.openCursor().onsuccess = function(event){
    var cursor = event.target.result;
    if(cursor){
      var request = new Request('/redis/messages',{
        method:'POST',
        headers:{
          'Content-type':'application/json'
        },
        body:JSON.stringify(cursor.value)
      });
      requests.push(request);
      cursor.delete();
      cursor.continue();
    }else{
      requests.forEach(function(request){
        fetch(request).then(function(res){
          //if(res.ok) //delete unsent
        })
      })
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
          fetch('/redis/messages?rid='+cursor.value.rid)
          .then(function(response){
            response.json().then(function(res){
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
