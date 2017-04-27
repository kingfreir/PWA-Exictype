if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });
}

var $ = require('jquery');
//the entire socket client is bundled SO the issue is simply fetch errors
//due to reconnection failing
var io = require('socket.io-client');

var managerOpts = {
  "reconnection":true,
  "reconnectionDelay":5000,
  "reconnectionAttempts":10
};

//
$(function () {
    var socket = io('localhost:3000',managerOpts);

    $('form').submit(function(){
      var msg = $('#m').val();
      console.log(socket);

      if(socket.connected){
        socket.emit('chat message', {"message":msg, "date":new Date});
        $('#m').val('');
        return false;
      }else{
        //was failing because it didnt return false!!
        console.log(msg);
        $('#messages').append($('<li>').text(msg));
        $('#m').val('');
        return false;
      }
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg.message));
    });
});
