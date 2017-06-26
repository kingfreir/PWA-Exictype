require('./sw-controller.js')._registerSW();
require('./firebase.js');

navigator.serviceWorker.ready.then(function(reg){
  reg.sync.register('unsent_sync');
});

require('./dexie.js').post();
require('./socket.io.js');
require('./interface.js');
