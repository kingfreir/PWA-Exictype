var $ = require('jquery');
var username = require('./utilities.js').get_cookie('username');

const messaging = require('./firebase.js');

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
  fetch('/redis/users/signout?username='+username)
  .then(function(res){
    console.log('signed out');
    document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
    window.location.href = '/';
  }).catch(function(err){
    console.log('cannot sign out in offline mode');
  })
}
$('#signout').click(sign_out);

function test_push(){
  messaging.getToken()
  .then(function(currentToken){
    fetch('/redis/push',{
      headers:{
        'Content-type':'application/json'
      },
      method:'POST',
      body:JSON.stringify({
        title:'Exictype',
        content:'test push',
        token:currentToken,
        username:username
      })
    }).then(function(res){
      res.json().then(function(res){
        if(res.success) console.log('pushed');
        else console.log('push failed')
      })
    })
  })
}
$('#push').click(test_push);

function test_push_all(){
  messaging.getToken()
  .then(function(currentToken){
    fetch('/redis/push/all',{
      headers:{
        'Content-type':'application/json'
      },
      method:'POST',
      body:JSON.stringify({
        title:'Exictype',
        content:'test push ALL'
      })
    }).then(function(res){
      res.json().then(function(res){
        if(res.message_id) console.log('pushed');
        else console.log('push failed')
      })
    })
  })
}
$('#pushAll').click(test_push_all);
