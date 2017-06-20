var express = require('express');
var router = express.Router();
var debug = require('debug')('api');
var redis = require('../models/redis');
var fb = require('../firebase.json');
var C = require('../config.json');

router.get('/messages',function(req,res){
  var arr = new Array();
  redis.send(req.query.rid).map(function(obj){
    if(obj){
      obj.rid = parseInt(obj.rid);
      arr.push(obj);
    }
  }).then(function(){
    res.json(arr.slice(0,100));
  });
})

router.post('/messages',function(req,res){
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
    });
    res.send('OK');
});

router.get('/users/check',function(req,res){
  var username = req.query.username;
  redis.client.sismemberAsync('users',username).then(function(i){
    if(i) res.json({"result":i});
    else{
      redis.client.sadd('users',username);
      res.json({"result":i});
    }
  });
})

router.get('/users/signout',function(req,res){
  var username = req.query.username;
  redis.client.srem('users',username);
  res.send('OK');
})

router.post('/register',function(req,res){
  redis.client.sadd('tokens',req.body.token);
  res.type('js').send('{"success":true}');
})

var request = require('request');

router.post('/push',function(req,res){

  request({
    uri:"https://fcm.googleapis.com/fcm/send",
    headers:{
      "Content-type":"application/json",
      "Authorization":'key=AIzaSyCNlwpCMo4k8gthg4DtXyIHNTXWRljK95o'
    },
    method:'POST',
    body:{ "notification": {
        "title": req.body.title,
        "body": req.body.content,
        "click_action" : C.hostname
      },
      "to" : req.body.token
    }
  });
  res.send('OK');
});

router.post('/push/all',function(req,res){
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
      "to" : "topics/general"
    })
  },function(err,res,body){
    console.log(body)
  });
  res.send('OK');
});

module.exports = router;
