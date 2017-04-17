var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('develop',function(){
  var stream = nodemon(
    {script: 'index.js'
    , ext: 'html js'});

  stream
    .on('restart',function(){
      console.log('restarted');
    })
    .on('crash',function(){
      console.log('error');
    });
});
