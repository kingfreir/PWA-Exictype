var express = require('express');
var router = express.Router();
var redis = require('../models/redis.js');

router.get('/',function(req,res){
  res.render('chat');
})

module.exports = router;
