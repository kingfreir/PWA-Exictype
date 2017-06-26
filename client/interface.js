/**Interface or UI component:
 * Includes all the button and UI functions
 */
var $ = require('jquery');
var username = require('./utilities.js').get_cookie('username');

const messaging = require('./firebase.js');

/**Opens the sidebar and shows the overlay*/
function sidebar_open(){
  document.getElementById('sidebar').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}
$('#open').click(sidebar_open);

/**Closes the sidebar and hides the overlay*/
function sidebar_close(){
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}
$('#close').click(sidebar_close);
$('#overlay').click(sidebar_close);

/**Signs out the user by requesting the server to remove the username
 * from the database. This makes the username available for sign in for
 * other users which represents a security failure BUT this application
 * doesnt apply password sign in.
 * After removing the username, the user is taken to the sign in page.
 * If offline the user cannot sign out, since it is required that the
 * database knows which usernames are available.
 */
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

/**Sends a test push to self by sending the user's username
 * The format of a push request to the server is visible here.
 */
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

/**Sends a test push to all users
 * The format of a general push request to the server is visible here.
 */
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
