/**Firebase component:
 * This application uses the Firebase Cloud Messaging (FCM) Service.
 * Push messaging registration. 
 * Registers our SW to be used for push messaging.
 */

var firebase = require('firebase');
var fb = require('../firebase.json');
var util = require('./utilities.js');

var app = firebase.initializeApp(fb);

const messaging = firebase.messaging();
module.exports = messaging;

/**Refreshes token and sends it to server. */
messaging.onTokenRefresh(function(){
  navigator.serviceWorker.ready
  .then(function(reg){
    messaging.useServiceWorker(reg);
    messaging.getToken()
    .then(function(refreshedToken){
      sendToken(refreshedToken)
      .then(function(res){
        if(res.ok) console.log('token updated')
      })
      .catch(function(err){
        console.log(err)
      })
    })
  })
})

/**Shows Notification when push message is received while
 * application runs on the foreground.
 * Note: Apparently did not work during development, all push
 * messages were received by SW.
 */
messaging.onMessage(function(payload){
    new Notification(JSON.parse(payload).notification);
})

/**Requests permission to serve notifications.
 * Tells the firebase service to use our own SW.
 */
messaging.requestPermission()
.then(function(){
  navigator.serviceWorker.ready
  .then(function(reg){
    messaging.useServiceWorker(reg);
    messaging.getToken()
    .then(function(currentToken){
      if(currentToken){
        sendToken(currentToken);
        registerTopic(currentToken);
      }
    })
  });
})
.catch(function(err){
    console.log('no permission',err);
})

/**Registers this client for the 'general' topic. Allows the server
 * to send a push notification to all users subscribed to this topic.
 * @param {Token} token - The ID token.
 */
function registerTopic(token){
  fetch("https://iid.googleapis.com/iid/v1/"
    +token+"/rel/topics/general",
    {
      headers:{
        'Content-Type':'application/json',
        'Authorization':"key=AIzaSyCNlwpCMo4k8gthg4DtXyIHNTXWRljK95o"
      },
      method:'POST'
  }).then(function(res){
    if(res.status == 200){
       console.log('successfully subscribed to push topic!')
     }
  })
}

/**Sends the push token to the server.
 * @param {Token} token - The ID token.
 */
function sendToken(token){
  return fetch('./redis/register',{
    headers:{
      'Content-type':'application/json'
    },
    body:JSON.stringify({
      token:token,
      username:util.get_cookie('username')
    }),
    method:'POST'
  })
}
