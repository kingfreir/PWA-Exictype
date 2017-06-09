const express = require('express');

const privatekey = "QCcYhyF7ycIEVfhyZ7dH-qEe_1IgLD3gUyyRIDXEIxI";

var app = express();
var bodyparser = require('body-parser');
var debug = require('debug')('server');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var redis = require('./redis.js');

io.on('connection',function(socket){
  debug('a user connected');

  socket.on('chat message',function(msg){
    debug('message: '+msg.content);
    msg.date = new Date();
    redis.add(msg,io);
  });

  //when a user disconnects
  socket.on('disconnect',function(){
    debug('user disconnected');
  });

});
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

app.use(express.static(__dirname + "/public"));

app.get('/config.json',function(req,res){
  res.sendFile(__dirname+'/config.json');
});

app.get('/redis/messages',function(req,res){
    debug('request rid: '+req.query.rid);
    redis.send(res,req.query.rid);
});

app.post('/chat',function(req,res){
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

http.listen(3000, function(){
  debug('listening on 3000!');
});
