var debug = require('debug')('api');
var redis = require('../models/redis');
var fb = require('../firebase.json');
var request = require('request');
var C = require('../config.json');

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
    res.send('OK');
  });

}

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

  res.send('OK');
}

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

exports.signout_user = function(req,res){
  var username = req.query.username;
  redis.client.srem('users',username);
  redis.client.del(username);
  res.json({
    "status":"success"
  });
}

exports.register_token = function(req,res){
  redis.client.hmset(req.body.username,'token',req.body.token);
  res.json({
    "status":"success"
  });
}

exports.push = function(req,res){
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
      "to" : req.body.token
    })
  },function(err,response,body){
    res.json(JSON.parse(body));
  });
}

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
