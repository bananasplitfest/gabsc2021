const gulp = require('gulp'),
      rollup = require('gulp-rollup'),  
      gulpif = require('gulp-if'),
      data = require('gulp-data'),
      del = require('del'),
      fs = require('fs'),
      rename = require('gulp-rename'),
      sass = require('gulp-sass')(require('sass')),
      pug = require('gulp-pug'),
      autoprefixer = require('gulp-autoprefixer'),
      sourcemaps = require('gulp-sourcemaps'),
      emitty = require('emitty').setup('src/templates', 'pug'),
      browserSync = require('browser-sync').create(),
      reload = browserSync.reload,
      babel = require('gulp-babel'),
      uglify = require('gulp-uglify'),
      packageJSON = require('./package.json'),
      watch = require('gulp-watch'),
      sortJSON = require('gulp-json-sort');

// Define reusable paths

const path = {
  src: 'src',
  dist: 'dist',
  src_pug: 'src/templates',
  src_scss: 'src/scss',
  src_js: 'src/js',
  src_img: 'src/img',
  src_static: 'src/static',
  dist_vendor: 'dist/vendor',
  dist_js: 'dist/js',
  dist_css: 'dist/css',
  dist_img: 'dist/img',
}


// Sass compiling

// Expanded
gulp.task('sass:expanded', () => {
  const options = {
    outputStyle: 'expanded',
    precision: 10 // rounding of css color values, etc..
  };
  return gulp.src(path.src_scss + '/theme.scss')
    .pipe(sass(options).on('error', sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(gulp.dest(path.dist_css))
    .pipe(browserSync.stream()); // Inject css into browser
});

// Minified
gulp.task('sass:minified', () => {
  const options = {
    outputStyle: 'compressed',
    precision: 10 // rounding of css color values, etc..
  };
  return gulp.src(path.src_scss + '/theme.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(options).on('error', sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(rename({ suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.dist_css))
    .pipe(browserSync.stream()); // Inject css into browser
});


// JS compiling and minification

// Expanded
gulp.task('js:expanded', () => {
  return gulp.src(path.src_js + '/theme.js')
    .pipe(rollup({
      allowRealFiles: true,
      input: './' + path.src_js + '/theme.js',
      output: {
        format: 'iife',
        banner: `
        /**
         * Around | Multipurpose Bootstrap Template
         * Copyright 2021 Createx Studio
         * Theme core scripts
         * 
         * @author Createx Studio
         * @version 2.0.0
         */
        `
      }
    }))
    .pipe(babel({
      presets: [['@babel/env', {modules: false}]]
    }))
    .pipe(gulp.dest(path.dist_js));
});

// Minified
gulp.task('js:minified', () => {
  return gulp.src(path.src_js + '/theme.js')
    .pipe(rollup({
      allowRealFiles: true,
      input: './' + path.src_js + '/theme.js',
      output: {
        format: 'iife',
        banner: `
        /**
         * Around | Multipurpose Bootstrap Template
         * Copyright 2021 Createx Studio
         * Theme core scripts
         * 
         * @author Createx Studio
         * @version 2.0.0
         */
        `
      }
    }))
    .pipe(rename('theme.min.js'))
    .pipe(babel({
      presets: [['@babel/env', {modules: false}]],
    }))
    .pipe(uglify({output: {comments: /^!|@author|@version/i}}))
    .pipe(gulp.dest(path.dist_js))
    .on('end', () => {
      reload(); // One time browser reload at end of uglification (minification)
    });
});


// Pug compiling

// The pug task below is adapted from
// https://github.com/mrmlnc/emitty/blob/master/examples/stream-performance.js

// stream-performance
gulp.task('pug', () =>
  new Promise((resolve, reject) => {
    const sourceOptions = {
      cwd: path.src_pug,
      base: path.src_pug // This causes the components and docs subfolders to be mirrored in dist folder
    };

    emitty.scan(global.emittyChangedFile).then(() => {
      // gulp.src('**/schedule.pug').pipe(data(function(file) {
      //     const j = JSON.parse(fs.readFileSync(path.src_pug+'/data/2022-schedule.json'))
      //     console.log(j)
      //     return j
      // }))

      gulp.src(['**/*.pug', '!helpers/**', '!partials/**'], sourceOptions)
        .pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
        .pipe(data(function(file) {
            const j = JSON.parse(fs.readFileSync(path.src_static+'/data/2022-schedule.json'))
            return j
        }))
        .pipe(data(function(file) {
            const j = JSON.parse(fs.readFileSync(path.src_static+'/data/resources.json'))
            return j
        }))
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(path.dist))
        .on('error', reject)
        .on('end', () => {
          reload(); // One time browser reload at end of pug compilation
          resolve();
         })
      });
  })
);


// Move vendor css and js files from node_modules to dist folder
// based on the list in package.json dependencies

gulp.task('vendor', () => {
  let dependencies = Object.keys(packageJSON.dependencies);
  let vendor = dependencies.map((key) => {
    return key + '/**/*';
  });
  return gulp.src(vendor, {cwd: 'node_modules', base: './node_modules'})
  .pipe(gulp.dest(path.dist_vendor));
});


// Move static assets to dist folder with folder structure
gulp.task('static',function(){
  // the base option sets the relative root for the set of files,
  // preserving the folder structure
  return gulp.src(path.src_static + '/**/*.*', { base: path.src_static})
  .pipe(gulp.dest(path.dist));
});


// Clean certain files/folders from dist directory. Runs before compilation of new files. See 'default' task at the most bottom of this file

gulp.task('clean', () => {
  return del([
    // path.dist_css,
    // path.dist_js,
    // path.dist + '/*.html',
    // path.dist_vendor,
    // path.dist_img
    path.dist
  ]);
});


// Watcher

gulp.task('watch', () => {
  global.watch = true; // Let the pug task know that we are running in "watch" mode

  // BrowserSync
  browserSync.init({
    server: {
      baseDir: path.dist,
    },
    open: true, // or "local"
  });
  gulp.watch(path.src_pug + '/**/*.pug', gulp.series('pug'))
    .on('all', (event, filepath) => {
      global.emittyChangedFile = filepath;
    });
    gulp.watch(path.src_scss + '/**/*.scss', gulp.series('sass:minified', 'sass:expanded'));
    gulp.watch(path.src_js + '/**/*.js', gulp.series('js:expanded', 'js:minified'));
    // gulp.watch(path.src_img + '/**/*.*', gulp.series('static'));
});


// Default task - the dependent tasks will run in parallell / excluding Docs and Components compilation

gulp.task(
  'default',
  gulp.series('clean', 'vendor', gulp.parallel('static', 'pug', 'js:minified', 'js:expanded', 'sass:minified', 'sass:expanded'), 'watch')
);


// Prepare for production
gulp.task(
  'prod',
  gulp.series('clean', 'vendor', gulp.parallel('static', 'pug', 'js:minified', 'js:expanded', 'sass:minified', 'sass:expanded'))
);