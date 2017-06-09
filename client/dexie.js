var dexie = require('dexie');
var db = new dexie('msg-database');
var $ = require('jquery');

db.version(1).stores({
  received: "++id,content,send_date,date,from,to,&rid",
  unsent: "++id,content,send_date,from,to"
});

db.open();

function add_received(msg){
  db.received
    .where('rid')
    .equals(msg.rid)
    .count()
    .then(function(count){
      if(count==0){
        db.transaction('rw',db.received,function(){
          db.received.add(msg);
          $('#messages')
            .append($('<li>')
            .text(msg.content+' '+new Date(msg.date)));
        }).catch(function(err){
          console.log('error saving message');
        });
      }
    });
}

function add_unsent(msg){
  db.transaction('rw',db.unsent,function(){
    db.unsent.add(msg);
    $('#messages')
      .append($('<li class="unsent">')
      .text(msg.content+' '+new Date(msg.date)));
  }).catch(function(err){
    console.log('error saving message');
  });
}

//doesnt show unsent messages: notification?
function post_messages(){
  db.received
    .orderBy('rid')
    .toArray()
    .then(function(messages){
    messages.forEach(function(el){
      $('#messages').append($('<li>').text(el.content+' '+new Date(el.date)));
    });
  });
}

var hostname = 'http://localhost:3000';

//when there are unsent messages send old rid, creating duplicates in <li>
function update_db(){
  db.received
    .reverse()
    .sortBy('rid')
    .then(function(arr){
      var url = new URL('../redis/messages?rid='+arr[0].rid,hostname);

      fetch(url).then(function(res){
        res.json().then(function(messages){
          messages.forEach(function(el){
            add_received(el);
          });
        });
      });
    });
}

exports.update = update_db;
exports.post = post_messages;
exports.add_r = add_received;
exports.add_u = add_unsent;
exports.db = db;
