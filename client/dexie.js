var dexie = require('dexie');
var crypto = require('./crypto.js');
var util = require('./utilities.js');
var db = new dexie('msg-database');
var df = require('dateformat');
var $ = require('jquery');
var C = require('../public/config.json');

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
          addtoList(msg,"");
        }).catch(function(err){
          console.log('error saving message');
        });
      }
    });
  db.received
    .count()
    .then(function(result){
      if(result>C.maxMessages){
        deleteOldest();
      }
    })
}

function deleteOldest(){
  db.received
    .orderBy('rid')
    .reverse()
    .offset(C.maxMessages)
    .delete()
    .then(function(count){

    });
}
function add_unsent(msg){
  db.transaction('rw',db.unsent,function(){
    db.unsent.add(msg);
    //add to list
    addtoList(msg,"w3-pale-red");
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
      addtoList(el,"");
    });
  });

  setTimeout(function(){
    db.unsent
      .orderBy('send_date')
      .toArray()
      .then(function(messages){
      messages.forEach(function(el){
        addtoList(el,"w3-pale-red");
      });
    });
  },1000);
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
      var url = new URL('../redis/messages?rid='+rid,C.hostname);
      fetch(url).then(function(res){
        res.json().then(function(messages){

          var from_me = 0, from_others = 0;
          messages.forEach(function(el){
            if(el.from === util.get_cookie('username')){
              from_me++;
            }else{
              from_others++;
            }
            add_received(el);
          });

          if(from_others>0){
            new Notification("Exictype",{
              body:'You have '+from_others+' new message(s)!',
              icon:'imgs/icon.png'
            })
          }

          if(from_me>0){
            new Notification("Exictype",{
              body:'Your '+from_me+' message(s) have been sent!',
              icon:'imgs/icon.png'
            })
          }
        });
      });
    });
}

function addtoList(msg,extra_class){
  var style;
  var content = crypto.decrypt(msg.content);
  var username = msg.from;
  if(msg.from === util.get_cookie('username')){
    style = 'float:right';
  }else{
    style = 'float:left';
  }

  $('#messages').append("<li class='w3-card w3-round w3-animate-fade w3-section "
  +extra_class
  +"' style='width:70%;"+style+"'>"
  +"<h5><b>"+username+":</b> "+content+"</h5>"
  +"<div class='w3-right-align w3-tiny'><p>"+df(msg.date)+"</p></div></li>");

  $('body').scrollTop($('ul li').last().position().top+
    $('ul li').last().height());
}

exports.update = update_db;
exports.post = post_messages;
exports.add_r = add_received;
exports.add_u = add_unsent;
exports.db = db;
