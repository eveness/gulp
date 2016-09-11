var gulp = require('gulp');
var fs = require('fs');
var RevAll = require('gulp-rev-all');
var del = require('del');

var CFG = JSON.parse(fs.readFileSync('settings.json'));

module.exports = function() {

    gulp.task('revision', function () {
        var revAll = new RevAll({hashLength: 12});
        return gulp.src([CFG.PATH_PUBLIC + 'js/main.min.js', CFG.PATH_PUBLIC + 'css/style.min.css'])
            .pipe(revAll.revision())
            .pipe(gulp.dest(CFG.PATH_PUBLIC))
            .pipe(revAll.manifestFile())
            .pipe(gulp.dest(CFG.PATH_PUBLIC));
    });

    gulp.task('revision:clean', function () {
        var revFiles = JSON.parse(fs.readFileSync(CFG.PATH_PUBLIC + 'rev-manifest.json'));
        return del([
            CFG.PATH_PUBLIC + revFiles['js/main.min.js'],
            CFG.PATH_PUBLIC + revFiles['css/style.min.css']
            ], { force: true });
    });

}