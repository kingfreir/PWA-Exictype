/**Socket.io
 * The messaging websocket component.
 * Includes socket event setup and form submit function.
 */
var $ = require('jquery');
var io = require('socket.io-client');
var crypto = require('./crypto.js');
var dexie = require('./dexie.js');
var util = require('./utilities.js');
var C = require('../public/config.json');

/**Connect to socket as indicated in the config file*/
var socket = io(C.hostname,C.socket_options);
var username = util.get_cookie('username');

/**On connect event request an update on missed messages*/
socket.on('connect',function(){
  dexie.update();
  //remove offline icon
});

/**When connection is lost register sync events for when connection
 * is re-established. In this case the socket sync is not used,
 * since it is pointless to retrieve an xhttp request for a socket
 * when the application is not in the foreground.
 */
socket.on('connect_error',function(){
  //add offline icon
  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('socket_sync');
  });
});

/**Attempt to clean reconnection errors
socket.on('reconnect_error',function(){

});
*/

/**When disconnect register for a database sync and unsent message sync.
 * This way when internet connection is restored a notification will
 * be received if new messages were received during the offline period
 * and unsent messages will be sent.
 */
socket.on('disconnect',function(){
  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('database_sync');
    reg.sync.register('unsent_sync');
  });
})

/**Form submit function: If connected emits the message through the socket
 * if disconnected adds message to unsent message database.
 * The message JSON format is visible here.
 */
$('form').submit(function(){
  var content = $('#m').val();
  var crypted = crypto.encrypt(content);
  var msg = {
    'content':crypted,
    'send_date':new Date(),
    'date':null,
    'from':username,
    'to':'#general',
    'rid':null
  };
  if(socket.connected){
    //when online
    socket.emit('chat message', msg);
    $('#m').val('');
    return false;
  }else{
    //when offline
    dexie.add_u(msg);
    $('#m').val('');
    return false;
  }
});

/**On new chat message, add to received message database*/
socket.on('chat message', function(msg){
  dexie.add_r(msg);
});
