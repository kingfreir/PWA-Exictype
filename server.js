const express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + "/public"));

app.get('/jquery/jquery.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

//var redis = require('redis'),
  //  client = redis.createClient();

io.on('connection',function(socket){
  console.log('a user connected');

  socket.on('chat message',function(msg){
    console.log('message: '+msg.message+' '+msg.date);
    io.emit('chat message',msg);
  });

  //when a user disconnects
  socket.on('disconnect',function(){
    console.log('user disconnected');
  });

  socket.broadcast.emit('hi');
});

http.listen(3000, function(){
  console.log('listening on 3000');
});
