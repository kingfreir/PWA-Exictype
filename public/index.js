/**The Sign in script*/

/**If the username cookie had a value, that is, if a user is signed in
 * redirect user to chat post_messages
 */
var username = getCookie('username');
if(username!=""){window.location.href = "/chat";}

/**Form submit function:
 * Checks if the given username is already taken
 * If it isnt, sends the username to the server and redirects user to chat post_messages
 * Else it will display warning and ask user to change username
 */
document.getElementById('frm').onsubmit = function(){
  var username = document.getElementById('in').value;
  if(username=="")return false;
  check_username(username).then(function(res){
    res.json().then(function(b){
      if(!b.result){
        document.cookie = "username="+username;
        window.location.href = "/chat";
      }else{
        console.log('username taken');
        document.getElementById('warning').style.display = 'block';
      }
    })
  })
  return false;
}

/**Checks if the username already exists in the database
 * @param {string} username - the input username
 */
function check_username(username){
  return fetch('/redis/users/check?username='+username);
}

/**Utility function that returns cookie value
 * @param {string} cname - cookie name
 */
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
