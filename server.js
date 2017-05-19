const express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis'),
    supRaw = require('node-redis-raw');

//default redis client connection 127.0.0.1:6379
var client = redis.createClient();

var nohm = require('nohm').Nohm;

client.on("connect",function(){
  console.log('connected to redis');
});

client.on("error", function (err) {
    console.log("Error " + err);
});

io.on('connection',function(socket){
  console.log('a user connected');

  socket.on('chat message',function(_msg){
    console.log('message: '+_msg.message+' '+new Date(_msg.date));
    var RedisID;
    //save message to redis
    client.incr('id',function(err,id){
      client.hmset('msg:'+id,"message "+_msg.message,"date "+_msg.date);
      RedisID = id;
    });
    dexie_msg = {
      'message':_msg.message,
      'date':_msg.date,
      'redisID':RedisID
    };

    //emit msg with redisID
    io.emit('chat message',dexie_msg);
  });

  //when a user disconnects
  socket.on('disconnect',function(){
    console.log('user disconnected');
  });

});

app.use(express.static(__dirname + "/public"));

app.get('/jquery/jquery.js', function(req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

app.get('/redis/messages',function(req,res){
    //res.send redis message array
    //use req.params to know which messages to load (date wise)
});

http.listen(3000, function(){
  console.log('listening on 3000');
});
