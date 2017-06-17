var express = require('express');
var router = express.Router();
var redis = require('../models/redis.js');

router.get('/',function(req,res){
  res.render('chat');
})

router.post('/',function(req,res){
  console.log('chat '+req.body.username);
  res.render('chat');
})

module.exports = router;
//exports.name = function()
