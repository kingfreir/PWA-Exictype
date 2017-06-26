/**Dexie component: handles all indexedDB behaviour.
 * Handles adding received and unsent messages to the database.
 * Also handles updating database by making a fetch to /redis/messages
 * and notifies the user of new messages.
 * Includes function to append messages to the main message list.
 */

var dexie = require('dexie');
var crypto = require('./crypto.js');
var util = require('./utilities.js');
var db = new dexie('msg-database');
var df = require('dateformat');
var $ = require('jquery');
var C = require('../public/config.json');

/**Creates the template for the database named "msg-database" indicated in the
 * 'require' above. Version management is also done at this stage by modifying
 * the version number and the necessary changes to the database stores.
 */
db.version(1).stores({
  received: "++id,content,send_date,date,from,to,&rid",
  unsent: "++id,content,send_date,from,to"
});

/**Opens the database*/
db.open();

/**Adds messages to the database. Checks if the added message already exists in
 * the store by verifying that no other message with the same Redis ID (rid)
 * exists. It then counts the number of stored messages and deletes the oldest
 * one if it surpasses the maximum indicated in the config file.
 * @param {json} msg - The message json object.
 */
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

/**Deletes the oldest message from the database, according to its Redis ID.*/
function deleteOldest(){
  db.received
    .orderBy('rid')
    .reverse()
    .offset(C.maxMessages)
    .delete()
    .then(function(count){

    });
}

/**Adds an unsent message to the database, in its own store, and adds
 * the message to the list with a pale red background.
 * @param {json} msg - The message json object.
 */
function add_unsent(msg){
  db.transaction('rw',db.unsent,function(){
    db.unsent.add(msg);
    //add to list
    addtoList(msg,"w3-pale-red");
  }).catch(function(err){
    console.log('error saving message');
  });
}

/**Checks if the user is signed in, and if not prompts the user to do so
 * If signed in, post all messages, including unsent, stored in the database.
 * A slight delay is added to posting unsent messages to make sure that, IF
 * the sync event was successfull in sending the unsent messages, it also has
 * enough time to remove them from the database.
 */
function post_messages(){
  if(util.get_cookie('username')==""){
    post_warning();
    return;
  }

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

/**Posts a "Please Sign In" warning message and
 * takes the user to the Sign in page after 2 seconds.
 */
function post_warning(){
  $('#messages').append("<li class='w3-card w3-round w3-animate-fade w3-section"
  +" w3-red' style='width:100%'>"
  +"<h4>You are currently Signed Out.</h4>"
  +"<h5>You'll be momentarily taken to the Sign In page.</h5>"
  +"</li>");
  $('body').scrollTop($('ul li').last().position().top+
    $('ul li').last().height());
    setTimeout(function(){
      window.location.href='/';
    },2000);
}

/**Queries the database for Redis ID (rid) of the latest message
 * it received and fetches all new messages since then. The fetch
 * response is a JSON array of messages that are then added to the database.
 * Lastly, notifications are presented indicating that the messages that
 * were sent online have been properly received by the server, and the
 * amount of new messages received.
 */
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

/**Adds a message to the list
 * @param {json} msg - The message json object
 * @param {string} extra_class - W3.CSS class denomination to be added to the
 *  message post. Usually used to indicate offline messages throuh a pale red.
 */
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
