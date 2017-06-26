/**Redis Model: Contains most interactions with the Redis DB
 * Makes the client object available to other scripts.
 */
var debug = require('debug')('redis');
var redis = require('redis');
var df = require('dateformat');
var bluebird = require('bluebird');
var C = require('../config.json');

/**Promisifying this component makes handling callbacks simpler*/
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

/**Connects to Redis according to config*/
var client = redis.createClient(C.redis_port[C.redis_host]);

client.on("connect",function(){
  debug('connected to redis');
});

client.on("error", function (err) {
    debug("Error " + err);
});

/**Returns a promise with an increased id value for
 * adding new messages -> Redis ID (rid) key in the message object
 */
function incr(){
  return client.incrAsync('id');
}

/**Adds a new message to the database
 * @param {json} msg - The message json object
 * @param {int} rid - Redis ID
 */
function add_message(msg,rid){
  client.hmset('msg:'+rid,
    "content",msg.content,
    "send_date",df(msg.send_date),
    "date",df(),
    "from",msg.from,
    "to",msg.to,
    "rid",rid);
  client.sadd('msg_ids',rid);
}

/**Retrieves all messages with an id value larger than the provided rid
 * Returns a Promise that resolves to an array of messages
 * @param {int} rid - Redis ID
 */
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
