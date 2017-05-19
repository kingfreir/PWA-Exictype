var dexie = require('dexie');
var receivedDB = new dexie('msg-database');
var unsentDB = new dexie('msg-unsent');

receivedDB.version(1).stores({
  messages: "++id,message,date,redisID"
});

unsentDB.version(1).stores({
  messages: "++id,message,date"
});

receivedDB.open();
unsentDB.open();

function add_msg(msgObj){
  receivedDB.transaction('rw',receivedDB.messages,function(){
    insert_object = {
      message:msgObj.message,
      date:msgObj.date,
      redisID:msgObj.redisID
    };

    receivedDB.messages.add(insert_object);
  }).catch(function(err){
    console.log('error saving message');
  });
}

function add_unsent(msgObj){
  unsentDB.transaction('rw',unsentDB.messages,function(){
    insert_object = {
      message:msgObj.message,
      date:msgObj.date
    };

    unsentDB.messages.add(insert_object);
  }).catch(function(err){
    console.log('error saving message');
  });
}

exports.add = add_msg;
exports.add_u = add_unsent;
exports.receivedDB = receivedDB;
exports.unsentDB = unsentDB;
