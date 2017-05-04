if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });
}

var $ = require('jquery');
var io = require('socket.io-client');
var dexie = require('dexie');
var msgDb = new dexie("messages");

msgDb.version(1).stores({
  messages: 'message,date'
});

msgDb.open();

var managerOpts = {
  "reconnection":true,
  "reconnectionDelay":5000,
  "reconnectionAttempts":10
};

$(function () {
    var socket = io('localhost:3000',managerOpts);

    $('form').submit(function(){
      var msg = $('#m').val();
      console.log(socket);

      if(socket.connected){
        //when online
        socket.emit('chat message', {"message":msg, "date":new Date});
        $('#m').val('');
        return false;
      }else{
        //when offline
        console.log(msg);
        $('#messages').append($('<li>').text(msg));
        $('#m').val('');
        return false;
      }
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg.message));
      msgDb.messages.add(msg);
    });
});
