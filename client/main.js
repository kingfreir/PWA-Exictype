/**Main script
 * Starts by registering the SW and Push Messaging Service.
 * Then registers for a sync event to send any unsent messages in this session.
 * Following that it posts all messages in the database in order.
 * Finally adds Socket.io and UI functions.
 */
require('./sw-controller.js')._registerSW();
require('./firebase.js');

navigator.serviceWorker.ready.then(function(reg){
  reg.sync.register('unsent_sync');
});

require('./dexie.js').post();
require('./socket.io.js');
require('./interface.js');
