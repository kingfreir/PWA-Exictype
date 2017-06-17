var express = require('express');
var router = express.Router();

router.get('/',function(req,res){
  console.log('redirecting');
  res.render('login');
})

router.post('/',function(req,res){
  console.log('index '+req.body.username);
  res.redirect('/chat');
})

module.exports = router;
