if(navigator.serviceWorker){
  navigator.serviceWorker.register('/sw.js').then(function(){
    console.log('registered');
  }).catch(function(){
    console.log('failed');
  });
}
