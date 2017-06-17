if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });

  //periodicSync not available

  navigator.serviceWorker.ready.then(function(reg){
    subscribe(reg);
  });

  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('database_sync');
  });
}

var CONFIG = require('../config.json');
var util = require('./utilities.js');

function subscribe(reg){
  const appKey = util.convert(CONFIG.publicKey);
  reg.pushManager.subscribe({
    userVisibleOnly:true,
    applicationServerKey: appKey
  }).then(function(subscription){
    console.log('user subscribed');
  })
}

var $ = require('jquery');
var io = require('socket.io-client');
var crypto = require('./crypto.js');
var dexie = require('./dexie.js');

var managerOpts = {
  "reconnection":false,
  "reconnectionDelay":5000
};

dexie.post();

$(function () {
    var socket = io(CONFIG.hostname,managerOpts);
    var username = util.get_cookie('username');

    socket.on('connect',function(){
      dexie.update();

      dexie.db.unsent.toArray().then(function(messages){
        messages.forEach(function(element){
          socket.emit('chat message',element);
          dexie.db.unsent.delete(element.id);
        });
      }).then(function(){
        $(".unsent").remove();
      });
    });

    socket.on('connect_error',function(){

    });

    socket.on('reconnect_error',function(){

    });

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
});
