
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('default',function(){
  var stream = nodemon({
    script: 'server.js',
    tasks: ['browserify'],
    ext: 'html js'});

  stream
    .on('restart',function(){
      console.log('restarted');
    })
    .on('crash',function(){
      console.log('error');
    });
});
