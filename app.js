const express = require('express');

var app = express();
var bodyparser = require('body-parser');
var debug = require('debug')('server');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('./models/redis.js');

io.on('connection',function(socket){
  debug('a user connected');

  socket.on('chat message',function(msg){
    debug('message: '+msg.content);
    msg.date = (new Date()).toString();

    redis.incr().then(function(rid){
      redis.add(msg,rid);
      msg.rid = rid;
      io.emit('chat message',msg);
    });
  });

  socket.on('disconnect',function(){
    debug('user disconnected');
  });
});

app.set('view engine','pug')

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

app.use(express.static(__dirname + "/public"));

app.use('/',require('./routes/index'));
app.use('/chat',require('./routes/chat'));
app.use('/redis',require('./routes/api'));

http.listen(3000, function(){
  debug('listening on 3000!');
});

exports.io = io;
