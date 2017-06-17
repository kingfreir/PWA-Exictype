var express = require('express');
var router = express.Router();
var redis = require('../models/redis');

router.get('/messages',function(req,res){
  var arr = new Array();
  redis.send(req.query.rid).map(function(obj){
    if(obj){
      obj.rid = parseInt(obj.rid);
      arr.push(obj);
    }
  }).then(function(){
    res.json(arr);
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
    redis.add(msg,io);
    res.send('OK');
});

module.exports = router;
