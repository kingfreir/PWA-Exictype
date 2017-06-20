var express = require('express');
var router = express.Router();
var debug = require('debug')('api');
var redis = require('../models/redis');

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
      'date':new Date(),
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
  redis.client.sadd('subscriptions',JSON.stringify(req.body));
  res.type('js').send('{"success":true}');
})

router.post('/push',function(req,res){
  
});

router.post('/push/all',function(req,res){

});

module.exports = router;
