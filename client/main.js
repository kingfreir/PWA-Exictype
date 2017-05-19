if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });
}

var $ = require('jquery');
var io = require('socket.io-client');
var dexie = require('./dexie.js');

var managerOpts = {
  "reconnection":true,
  "reconnectionDelay":5000
};

dexie.receivedDB.messages.toArray().then(function(messages){
  messages.forEach(function(element){
    $('#messages').append($('<li>').text(element.message));
  });

});

$(function () {
    var socket = io('localhost:3000',managerOpts);

    socket.on('connect',function(){
      console.log('socket.io connected');
      dexie.unsentDB.messages.toArray().then(function(messages){
        messages.forEach(function(element){
          socket.emit('chat message',element);
          dexie.unsentDB.messages.delete(element.id);
        });
      });
      $(".unsent").remove();
    });

    socket.on('connect_error',function(){
      console.log('conection error');
    });

    socket.on('reconnect_error',function(){
      console.log('failed reconnect');
    });

    $('form').submit(function(){
      var msg = $('#m').val();
      var _msg = {
        'message':msg,
        'date':new Date()
      };

      if(socket.connected){
        //when online
        socket.emit('chat message', _msg);
        $('#m').val('');
        return false;
      }else{
        //when offline
        console.log(msg);

        $('#messages').append($('<li class="unsent">').text(msg));
        $('#m').val('');
        dexie.add_u({'message':msg,'date':new Date()});
        return false;
      }
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg.message+' '+new Date(msg.date)));
      dexie.add(msg);
    });
});
