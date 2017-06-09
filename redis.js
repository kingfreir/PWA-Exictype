var debug = require('debug')('redis');
var redis = require('redis');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//default redis client connection 127.0.0.1:6379
var client = redis.createClient();

client.on("connect",function(){
  debug('connected to redis');
});

client.on("error", function (err) {
    debug("Error " + err);
});


function add_message(msg,io){
  //save message to redis
  client.incr('id',function(err,id){
    if(err)return;
    client.hmset('msg:'+id,
      "content",msg.content,
      "send_date",msg.send_date,
      "date",msg.date,
      "from",msg.from,
      "to",msg.to,
      "rid",id);
    client.sadd('msg_ids',id);
    msg.rid = id;
    //message emited within callback
    //later implementation could emit msg to specific users or groups
    io.emit('chat message',msg);
  });
}

function send_messages(res,rid){
  var arr = new Array();
  client.sortAsync('msg_ids','ASC').map(function(id){
    if(parseInt(id)>rid) return client.hgetallAsync('msg:'+id);
    else return;
  }).map(function(obj){
    if(obj){
      obj.rid = parseInt(obj.rid);
      arr.push(obj);
    }
  }).then(function(){
    res.json(arr);
  });
}

exports.send = send_messages;
exports.add = add_message;
exports.client = client;
