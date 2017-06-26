var username = getCookie('username');
if(username!=""){window.location.href = "/chat";}

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

function check_username(username){
  return fetch('/redis/users/check?username='+username);
}

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
