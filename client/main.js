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

var firebase = require('firebase');
var C = require('../public/config.json');

var config = {
    apiKey: "AIzaSyB2H9BUGL7PPC0ldhiLcyyB4_vUChjB2fk",
    authDomain: "pwa-exictype.firebaseapp.com",
    databaseURL: "https://pwa-exictype.firebaseio.com",
    projectId: "pwa-exictype",
    storageBucket: "pwa-exictype.appspot.com",
    messagingSenderId: "334941391422"
};

var app = firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.onTokenRefresh(function(){
  messaging.getToken()
  .then(function(refreshedToken){
    sendToken(refreshedToken);
  })
})

messaging.onMessage(function(payload){
    new Notification(payload);
})

messaging.requestPermission()
.then(function(){
  messaging.getToken()
  .then(function(currentToken){
    if(currentToken){
      sendToken(currentToken);
      fetch("https://iid.googleapis.com/iid/v1/"
        +currentToken+"/rel/topics/general",
        {
          headers:{
            'Content-Type':'application/json',
            'Authorization':"key=AIzaSyCNlwpCMo4k8gthg4DtXyIHNTXWRljK95o"
          },
          method:'POST'
      }).then(function(res){
        if(res.ok) console.log('okay');
      })
    }
  })
  navigator.serviceWorker.ready
  .then(function(reg){
    messaging.useServiceWorker(reg);
  });
})
.catch(function(err){
  console.log('no permission',err);
})

function sendToken(token){
  fetch('./redis/register',{
    headers:{
      'Content-type':'application/json'
    },
    body:JSON.stringify({token:token}),
    method:'POST'
  })
}

var $ = require('jquery');
var io = require('socket.io-client');
var crypto = require('./crypto.js');
var dexie = require('./dexie.js');
var util = require('./utilities.js');

dexie.post();

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
