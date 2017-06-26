var $ = require('jquery');
var io = require('socket.io-client');
var crypto = require('./crypto.js');
var dexie = require('./dexie.js');
var util = require('./utilities.js');
var C = require('../public/config.json');

var socket = io(C.hostname,C.socket_options);
var username = util.get_cookie('username');

socket.on('connect',function(){
  dexie.update();
  //remove offline icon
});

socket.on('connect_error',function(){
  //add offline icon
  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('socket_sync');
  });
});

socket.on('reconnect_error',function(){

});

socket.on('disconnect',function(){
  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('database_sync');
    reg.sync.register('unsent_sync');
  });
})

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

socket.on('chat message', function(msg){
  dexie.add_r(msg);
});
