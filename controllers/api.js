/**API Controller:
 * Manages POST and GET requests
 */
var debug = require('debug')('api');
var redis = require('../models/redis');
var fb = require('../firebase.json');
var request = require('request');
var C = require('../config.json');

/**Responds a GET request to /redis/messages with a JSON message array
 * The request body should include a query field named 'rid' which
 * corresponds to the rid of the latest message received by the user
 */
exports.get_messages = function(req,res){
  var arr = new Array();
  redis.send(req.query.rid).map(function(obj){
    if(obj){
      obj.rid = parseInt(obj.rid);
      arr.push(obj);
    }
  }).then(function(){
    res.json(arr.slice(0,C.maxMessages));
  });
}

/**Responds to a POST request to /redis/messages by adding the message
 * in the request body to the database and emitting it through socket.io.
 * The request body should include the below indicated fields.
 * Returns a JSON response with a success status
 */
exports.post_messages = function(req,res){
  var msg = {
    'content':req.body.content,
    'send_date':req.body.send_date,
    'date':null,
    'from':req.body.from,
    'to':req.body.to,
    'rid':null
  }
  debug(msg.content);
  redis.incr().then(function(rid){
    redis.add(msg,rid);
    msg.rid = rid;
    require('../app.js').io.emit('chat message',msg);
    res.json({
      "status":"success"
    });
  });

}

/**Responds to a POST request to /redis/messages/bulk by adding the
 * message array in the request body to the database and emitting
 * them through socket.io.
 * Each message in the request body should include the below indicated fields.
 * Returns a JSON response with a success status
 */
exports.post_bulk = function(req,res){
  var messages = req.body.message_array;

  messages.forEach(function(message){
    var msg = {
      'content':message.content,
      'send_date':message.send_date,
      'date':null,
      'from':message.from,
      'to':message.to,
      'rid':null
    }
    debug(msg.content);
    redis.incr().then(function(rid){
      redis.add(msg,rid);
      msg.rid = rid;
      require('../app.js').io.emit('chat message',msg);
    });
  })

  res.json({
    "status":"success"
  });
}

/**Responds to a GET request to /redis/users/check with a query result
 * on whether the provided username is already in the database or not.
 */
exports.check_user = function(req,res){
  var username = req.query.username;
  redis.client.sismemberAsync('users',username)
  .then(function(isSignedIn){
    if(isSignedIn) res.json({
      "status":"success",
      "result":true
    });
    else{
      redis.client.sadd('users',username);
      res.json({
        "status":"success",
        "result":false
      });
    }
  });
}

/**Responds to a POST request to /redis/users/signout by removing the
 * provided username from the database.
 * Returns a success status
 */
exports.signout_user = function(req,res){
  var username = req.query.username;
  redis.client.srem('users',username);
  redis.client.del(username);
  res.json({
    "status":"success"
  });
}

/**Responds to a POST request to /redis/register by adding the push token
 * to the database as a hash using the username as key
 */
exports.register_token = function(req,res){
  redis.client.hmset(req.body.username,'token',req.body.token);
  res.json({
    "status":"success"
  });
}

/**Responds to a POST request to /redis/push by making a push request to
 * the FCM Service with the token indicated by the username in the request body.
 * Returns the response from the FCM Service.
 */
exports.push = function(req,res){
  redis.client.hgetAsync(req.body.username,'token').then(function(token){

    request({
      uri:"https://fcm.googleapis.com/fcm/send",
      headers:{
        "Content-type":"application/json",
        "Authorization":'key=AIzaSyCNlwpCMo4k8gthg4DtXyIHNTXWRljK95o'
      },
      method:'POST',
      body:JSON.stringify({ "notification": {
          "title": req.body.title,
          "body": req.body.content,
          "click_action" : C.hostname
        },
        "to" : token
      })
    },function(err,response,body){
      res.json(JSON.parse(body));
    });
  });
}

/**Responds to a POST request to /redis/push/all by making a push request
 * to the FCM service with the 'general' topic as the receiving end.
 * This pushes the notification provided in the request body to all users.
 * Returns the response of the FCM service
 */
exports.push_all = function(req,res){
  request({
    uri:"https://fcm.googleapis.com/fcm/send",
    headers:{
      "Content-type":"application/json",
      "Authorization":'key=AIzaSyCNlwpCMo4k8gthg4DtXyIHNTXWRljK95o'
    },
    method:'POST',
    body:JSON.stringify(
    {
      "notification": {
        "title": req.body.title,
        "body": req.body.content,
        "click_action" : C.hostname
      },
      "to" : "/topics/general"
    })
  },function(err,response,body){
    debug(JSON.parse(body))
    res.json(JSON.parse(body));
  });

}
