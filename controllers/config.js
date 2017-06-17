var express = require('express');
var router = express.Router();
var config = require('../config.json');

router.get('/',function(req,res){
  //modify config to send only required elements
  res.json(config);
})

module.exports = router;
