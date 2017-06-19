'use strict';

const webpush = require('web-push');
const fs = require('fs');
var C = require('./config.json');

var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

var toBundle = ['./client/main.js'];

gulp.task('browserify',function(){
  return browserify(toBundle)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public'));
});

gulp.task('watchify',function(){
  var bundler = watchify(browserify(toBundle,{debug:true}));

  bundler.on('update',rebundle);
  bundler.on('log',gutil.log.bind(gutil));

  function rebundle(){
    return bundler.bundle()
      .on('error',gutil.log.bind(gutil,'browserify error'))
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./public'));
  }

  return rebundle();
});

gulp.task('nodemon',function(){
  return nodemon({
    script: 'app.js',
    ext: 'js html css',
    env: {'NODE_ENV': 'development'},
    ignore: ['client/**']
  });
});

gulp.task('keys',generateKeys());

gulp.task('build',['browserify']);
gulp.task('default',['keys','watchify','nodemon']);

function generateKeys(){
  if(!fs.existsSync('keys.json')){
    var vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFile('keys.json',JSON.stringify(vapidKeys),'utf8',function(err){
      if(err) throw err;
    })
  }
}
