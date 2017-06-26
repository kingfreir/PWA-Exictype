/**Service Worker*/

/**The Cache name: Remember to update the name whenever changes
 * to the cache files are made.
 */
var staticCacheName = 'exictype-v2';
var allCaches = [
  staticCacheName
];

/**Install event
 * On install we open up a new cache and add all the required
 * files to generate the website behaviour when offline.
 */
self.addEventListener('install',function(event){
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      cache.addAll([
      '/',
      '/chat',
      'sw.js',
      'index.js',
      'bundle.js',
      '/imgs/icon.png',
      '/imgs/icon-4x.png',
      'manifest.json',
      'w3.css'
    ]);
    }).catch(function(error){
      console.log(error);
    }));
});

/**Activation event
 * On activation we delete the older cache by checking the cache name
 * for a version different from the latest one.
 */
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

/**Message event
 * Triggers activation of this SW during update.
 * This SW will only take control after a page reload however so
 * that is handled on the SW Controller (see sw-controller.js)
 */
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

/**Fetch event
 * The main objective of the SW is on the fetch event.
 * All url fetchs are returned with a cached response if possible.
 * Below is also a template for a custom fetch behaviour, whenever we
 * wish to do more than just respond with the cached response.
 */
self.addEventListener('fetch',function(event){
  var requestUrl = new URL(event.request.url);

  if(requestUrl.origin === location.origin){
    if(requestUrl.pathname.startsWith('/socket.io')){

      /**Inside the respondWith we can place a function that
       * can inspect the event, decide to either fetch from network
       * for updates or return the cached response.
       * This can be useful for checking if a user has updated his avatar,
       * so that we can fetch the new one, store it on cache, and respondWith
       * with the new avatar instead of the old cached one.
       */
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

/**Push event
 * After registering this SW with firebase, all push messages are
 * handled here. It loads our personal icon and retrieves the push
 * message content. Then it is shown to our user through a notification.
 */
self.addEventListener('push',function(event){
  var payload = event.data ? JSON.parse(event.data.text()):'no payload';

  const title = payload.notification.title;
  const options = {
    body:payload.notification.body,
    icon:'imgs/icon.png',
    click_action:payload.notification.click_action
  };
  event.waitUntil(
    self.registration.showNotification(title,options)
  );
});

/**PeriodicSync event
 * A useful event that has now deprecated.
 * Allowed for sporadic updates.

self.addEventListener('periodicsync',function(event){
    if(event.tag == 'database_sync'){
      event.waitUntil(dbSync());
    }else{
      event.registration.unregister();
    }
});
*/

/**Sync event
 * One-off Background sync. When device is able to connect to the
 * internet, the registered events are triggered once.
 * One registration is required per Sync.
 * The sync tag is checked and runs the corresponding function.
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

/**Checks if there are unsent messages to send on send_unsent sync event*/
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

/**Iterates the IndexedDB and sends an array of unsent messages to the server*/
function cursorSend(store){
  var index = store.index('send_date');
  var messages = new Array();

  index.openCursor().onsuccess = function(event){
    var cursor = event.target.result;
    if(cursor){
      messages.push(cursor.value);
      cursor.continue();
    }else{
      var request = new Request('/redis/messages/bulk',{
        method:'POST',
        headers:{
          'Content-type':'application/json'
        },
        body:JSON.stringify({message_array:messages})
      });
      fetch(request).then(function(res){
        if(res.ok) delete_unsent();
      })
    }
  }
}

/**If the unsent messages were sent successfully they are deleted
 * from the database.
 */
function delete_unsent(){
    var request = self.indexedDB.open('msg-database');
    var db;

    request.onsuccess = function(event){
      db = request.result;
      var trans = db.transaction('unsent','readwrite');
      var store = trans.objectStore('unsent');

      store.clear();

      store.onsuccess = function(event){
        console.log('unsent cleared');
      }
    }
}

/**When the database_sync sync event is triggered it checks the Redis ID
 * of the latest stored message on the database and fetches new messages.
 * If the returned array is not empty notifies the user that new messages
 * have been received.
 * Note: no new messages are added to the database at this stage.
 * That is handled during the socket.io 'connect' event.
 */
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
