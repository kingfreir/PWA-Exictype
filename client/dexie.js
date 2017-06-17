var dexie = require('dexie');
var crypto = require('./crypto.js');
var util = require('./utilities.js');
var db = new dexie('msg-database');
var $ = require('jquery');
var CONFIG = require('../config.json');

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
          //add to list
          addtoList(msg);
        }).catch(function(err){
          console.log('error saving message');
        });
      }
    });
}

function add_unsent(msg){
  db.transaction('rw',db.unsent,function(){
    db.unsent.add(msg);
    //add to list
    addtoList(msg);
  }).catch(function(err){
    console.log('error saving message');
  });
}

function post_messages(){
  db.received
    .orderBy('rid')
    .toArray()
    .then(function(messages){
    messages.forEach(function(el){
      addtoList(el);
    });
  });

  //maybe modify to add them to list
  db.unsent
    .count()
    .then(function(count){
      if(count>0){
        new Notification("Exictype",{
          body:"You have unsent messages!"
        });
      }
    })
}

function update_db(){
  db.received
    .reverse()
    .sortBy('rid')
    .then(function(arr){
      var rid;
      if(arr[0]!=undefined){
        rid = arr[0].rid;
      }else{
        rid = 0;
      }
      var url = new URL('../redis/messages?rid='+rid,CONFIG.hostname);
      fetch(url).then(function(res){
        res.json().then(function(messages){
          //notification
          messages.forEach(function(el){
            add_received(el);
          });
        });
      });
    });
}

function addtoList(msg){
  var style;
  var content = crypto.decrypt(msg.content);
  if(msg.from === util.get_cookie('username')){
    style = 'float:right';
  }else{
    style = 'float:left';
  }

  $('#messages').append("<li class='w3-card w3-round w3-animate-fade w3-section' "+
  "style='width:70%;"+style+"'>"
  +"<h5>"+content+"</h5>"
  +"<div class='w3-right-align'><p>"+new Date(msg.date)+"</p></div></li>");

  $('body').scrollTop($('ul li').last().position().top+
    $('ul li').last().height());
}

exports.update = update_db;
exports.post = post_messages;
exports.add_r = add_received;
exports.add_u = add_unsent;
exports.db = db;
