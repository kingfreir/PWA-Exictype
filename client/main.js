if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });

  navigator.serviceWorker.ready.then(function(reg){
    reg.sync.register('unsent_sync');
  });
}

var C = require('../public/config.json');
var util = require('./utilities.js');

var $ = require('jquery');
var io = require('socket.io-client');
var crypto = require('./crypto.js');
var dexie = require('./dexie.js');

dexie.post();

function sidebar_open(){
  document.getElementById('sidebar').style.display = 'block';
}

function sidebar_close(){
  document.getElementById('sidebar').style.display = 'none';
}

$(document).ready(function () {
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

    function sidebar_open(){
      document.getElementById('sidebar').style.display = 'block';
      document.getElementById('overlay').style.display = 'block';
    }
    $('#open').click(sidebar_open);

    function sidebar_close(){
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('overlay').style.display = 'none';
    }
    $('#close').click(sidebar_close);
    $('#overlay').click(sidebar_close);

    function sign_out(){
      fetch('/redis/users/signout?username='+username).then(function(res){
        console.log('signed out');
        document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
        window.location.href = "/";
      }).catch(function(err){
        console.log('cannot sign out in offline mode');
      })
    }
    $('#signout').click(sign_out);
});
