var express = require('express');
var router = express.Router();
var C = require('../config.json');
var K = require('../keys.json');

router.get('/',function(req,res){
  //modify config to send only required elements
  var config = {
    "hostname":C.hostname,
    "maxMessages":C.maxMessages,
    "publicKey":K.publicKey,
    "socket_options":C.socket_options
  }
  res.json(config);
})

module.exports = router;
