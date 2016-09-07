var gulp = require('gulp');
var fs = require('fs');
var ftp = require( 'vinyl-ftp' );
var gutil = require( 'gulp-util' );

var CFG = JSON.parse(fs.readFileSync('settings.json'));
var FTP_CFG = JSON.parse(fs.readFileSync('./deploy.json'));
var needConnection = (process.argv.slice(-1) == 'deploy' || process.argv.slice(-1) == '--connect') || false;

function getFilesList(CFG) {
    return JSON.parse(fs.readFileSync('./' + CFG.PATH_PUBLIC + 'rev-manifest.json'));
}

module.exports = function(){

    if(needConnection !== false) {
        gutil.log('Connecting to FTP-server...');
        var conn = ftp.create({
            host:     FTP_CFG.host,
            user:     FTP_CFG.user,
            password: FTP_CFG.password,
            parallel: 10,
            log:      gutil.log
        });
    }

    gulp.task('deploy:download-revision', function() {
        return conn.src([FTP_CFG.folder + '/rev-manifest.json'], { base: FTP_CFG.folder, buffer: false })
            .pipe(gulp.dest('.', { base: FTP_CFG.local }));
    });

    gulp.task('deploy:upload-files', function() {
        var files = getFilesList(CFG);
        var globs = [
            CFG.PATH_PUBLIC + files['js/main.min.js'],
            CFG.PATH_PUBLIC + files['css/style.min.css'],
            CFG.PATH_PUBLIC + 'rev-manifest.json'
        ];
        return gulp.src(globs, { base: CFG.PATH_PUBLIC, buffer: false })
            .pipe(conn.newer(FTP_CFG.folder))
            .pipe(conn.dest(FTP_CFG.folder));
    });

    gulp.task('deploy:delete-remote-files', function(cb) {
        var files = getFilesList(CFG);
        var filesDel = [];
        try {
            var previous = JSON.parse(fs.readFileSync('./' + FTP_CFG.local + '/rev-manifest.json'));
        } catch (err) {
            var previous = [];
        }
        if(previous['js/main.min.js'] != files['js/main.min.js']) {
            filesDel.push(FTP_CFG.folder + '/'+ previous['js/main.min.js']);
        }
        if(previous['css/style.min.css'] != files['css/style.min.css']) {
            filesDel.push(FTP_CFG.folder + '/'+ previous['css/style.min.css']);
        }
        if(filesDel.length > 0) {
            conn.delete(filesDel, cb);
        }
        cb();
    });

    gulp.task('deploy', gulp.series(['deploy:download-revision', 'deploy:upload-files', 'deploy:delete-remote-files']));

}