var gulp = require('gulp');
var fs = require('fs');
var fileinclude = require('gulp-file-include');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer');
var less = require('gulp-less');
var postcss = require('gulp-postcss');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var RevAll = require('gulp-rev-all');
var del = require('del');
var gulpif = require('gulp-if');

var CFG = JSON.parse(fs.readFileSync('settings.json'));

gulp.task('path', function(cb) {
  fs.writeFileSync('less/path.less', '@path: "' + CFG.PATH_IN_CSS + '";');
  cb();
});

gulp.task('revision', function () {
    var revAll = new RevAll({hashLength: 12});
    return gulp.src([CFG.PATH_PUBLIC + 'js/main.min.js', CFG.PATH_PUBLIC + 'css/style.min.css'])
        .pipe(revAll.revision())
        .pipe(gulp.dest(CFG.PATH_PUBLIC))
        .pipe(revAll.manifestFile())
        .pipe(gulp.dest(CFG.PATH_PUBLIC));
});

gulp.task('revision-clean', function () {
    var revFiles = JSON.parse(fs.readFileSync(CFG.PATH_PUBLIC + 'rev-manifest.json'));
    return del([
        CFG.PATH_PUBLIC + revFiles['js/main.min.js'],
        CFG.PATH_PUBLIC + revFiles['css/style.min.css']
        ], { force: true });
});

gulp.task('js', function() {
  return gulp.src('js/main.js')
    .pipe(fileinclude())
    .pipe(uglify())
    .pipe(rename('main.min.js'))
    .pipe(gulp.dest(CFG.PATH_PUBLIC + 'js/'));
});

gulp.task('style', function() {
  return gulp.src('less/style.less')
    .pipe(gulpif(CFG.SRCMAP, sourcemaps.init()))
    .pipe(less())
    .pipe(postcss([ autoprefixer({ browsers: ['last 4 versions'] }) ]))
    .pipe(cssnano())
    .pipe(gulpif(CFG.SRCMAP, sourcemaps.write()))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest(CFG.PATH_PUBLIC + 'css'));
});

gulp.task('html', function() {
    var revFiles = JSON.parse(fs.readFileSync(CFG.PATH_PUBLIC + 'rev-manifest.json'));
    return gulp.src('html/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            context: {
                path: CFG.PATH,
                cssFile: revFiles['css/style.min.css'],
                jsFile: revFiles['js/main.min.js'],
                jquery: CFG.JQUERY.enabled,
                jqueryVersion: CFG.JQUERY.version
            }
        }))
        .pipe(gulp.dest(CFG.PATH_PUBLIC));
});

gulp.task('watch', function() {
  gulp.watch('less/**/*.less', gulp.series(['style', 'revision-clean', 'revision', 'html']));
  gulp.watch('js/**/*.js', gulp.series(['js', 'revision-clean', 'revision', 'html']));
  gulp.watch('html/**/*.html', gulp.series('html'));
});

gulp.task('serve', gulp.parallel(
  ['watch'],
  function browserSync() {
    var browserSync = require('browser-sync').create();
    browserSync.init({server: CFG.PATH_PUBLIC});
    browserSync.watch(CFG.PATH_PUBLIC + '**/*.html').on('change', browserSync.reload);
  }
));

require('./tasks/jquery.js')();
require('./tasks/deploy.js')();

gulp.task('init', gulp.series(['path', 'js', 'style', 'revision', 'html', 'jquery']));
gulp.task('build', gulp.series(['path', 'js', 'style', 'revision-clean', 'revision', 'html', 'jquery']));
