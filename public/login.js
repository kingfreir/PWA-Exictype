document.getElementById('frm').onsubmit = function(){
  var user = document.getElementById('in').value;
  document.cookie = "username="+user;
}
