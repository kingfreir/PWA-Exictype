const express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _dirname = '/Work/E24 PWA/pwa-chat-exictype';

app.use(express.static("public"));

/*app.get('/',function(req,res){
  res.sendFile(_dirname+'/index.html');
});*/

io.on('connection',function(socket){
  console.log('a user connected');

  socket.on('chat message',function(msg){
    console.log('message: '+msg);
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
