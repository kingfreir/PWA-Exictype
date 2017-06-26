/**Service Worker Controller:
 * Handles registration of the service worker, and update process.
 * Notifies the user when an update is ready, allowing for postponing the update
 * to the next time it loads the page.
 */
var $ = require('jquery');

/**Registers the SW. This process includes checking if we're updating
 * the SW and tracks the new SW installation.
 */
exports._registerSW = function(){
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    if(!navigator.serviceWorker.controller)return;
    if(reg.waiting)_updateReady(reg.waiting);
    if(reg.installing)_trackInstall(reg.installing);
    reg.addEventListener('updatefound',function(){
      _trackInstall(reg.installing);
    })
  });

  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}

/**Adds an event listener to the SW so that it can warn the page when
 * intallation is complete.
 * @param {ServiceWorkerRegistration} worker - The SW registration*/
_trackInstall = function(worker){
  console.log('tracking installation')
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      _updateReady(worker);
    }
  });
}

/**Notifies the user that an Update is ready and upon approval tells the SW
 * to activate by posting a message.
 * A 'controllerchange' event is triggered upon activation.
 * @param {ServiceWorkerRegistration} worker - The SW registration*/
_updateReady = function (worker){
  console.log('skip waiting')
  /**Personal note: Using a confirm() is not the prettiest option
   * to request confirmation from the user, but it's simple and works.
   */
  if(confirm('An update is available!\nWould you like to update now?')){
    worker.postMessage({action: 'skipWaiting'});
  }else{
    new Notification('Exictype',{
      body: 'The update will be postponed!',
      icon: 'imgs/icon.png'
    })
  }

}
