const appPublicKey = "BJwpiOXM_dO2rPwFkGCILNT2EuhLez-Qu8C4yQIkcAbFaYZJwViWpt2IeK6PeomkCOxVPY_Mbc9rBAB4px7JAQc";

if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    console.log('registered');
    reg.sync.register('database_sync');
  }).catch(function(){
    console.log('failed');
  });

  //periodicSync not available

  navigator.serviceWorker.ready.then(function(reg){
    subscribe(reg);
  });
}

function subscribe(reg){
  const appKey = urlBase64ToUint8Array(appPublicKey);
  reg.pushManager.subscribe({
    userVisibleOnly:true,
    applicationServerKey: appKey
  }).then(function(subscription){
    console.log('user subscribed');
  })
}

function syncReg(){
  reg.sync.register('database_sync');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

var $ = require('jquery');
var io = require('socket.io-client');
var dexie = require('./dexie.js');
var CONFIG = require('../config.json');

var managerOpts = {
  "reconnection":true,
  "reconnectionDelay":5000
};

dexie.post();

$(function () {
    var socket = io(CONFIG.hostname,managerOpts);

    socket.on('connect',function(){

      dexie.db.unsent.toArray().then(function(messages){
        messages.forEach(function(element){
          socket.emit('chat message',element);
          dexie.db.unsent.delete(element.id);
        });
      }).then(function(){
        $(".unsent").remove();
      });
      dexie.update();
    });

    socket.on('connect_error',function(){
      console.log('conection error');
    });

    socket.on('reconnect_error',function(){

    });

    $('form').submit(function(){
      var content = $('#m').val();
      var msg = {
        'content':content,
        'send_date':new Date(),
        'date':null,
        'from':'me',
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
