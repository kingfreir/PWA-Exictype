var debug = require('debug')('redis');
var redis = require('redis');
var bluebird = require('bluebird');
var C = require('../config.json');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//default redis client connection 127.0.0.1:6379
var client = redis.createClient(C.redis_port[C.redis_host]);

client.on("connect",function(){
  debug('connected to redis');
});

client.on("error", function (err) {
    debug("Error " + err);
});


function incr(){
  return client.incrAsync('id');
}

function add_message(msg,rid){
  client.hmset('msg:'+rid,
    "content",msg.content,
    "send_date",msg.send_date,
    "date",msg.date,
    "from",msg.from,
    "to",msg.to,
    "rid",rid);
  client.sadd('msg_ids',rid);
}

function send_messages(rid){
  return client.sortAsync('msg_ids','ASC').map(function(id){
    if(parseInt(id)>rid) return client.hgetallAsync('msg:'+id);
    else return;
  });
}

exports.send = send_messages;
exports.incr = incr;
exports.add = add_message;
exports.client = client;
