'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var assign = require('lodash.assign');

var customOpts = {
  entries: ['./client/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('js',bundle);
b.on('update',bundle);
b.on('log',console.log);

gulp.task('default',['js'],function(){
  var stream = nodemon({
    script: 'server.js',
    ext: 'html js'});

  stream
    .on('restart',function(){
      console.log('restarted');
    })
    .on('crash',function(){
      console.log('error');
    });
});

function bundle(){
  return b.bundle();
  //.on(event)
}
