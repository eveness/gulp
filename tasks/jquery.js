var gulp = require('gulp');
var fs = require('fs');
var exec = require('child_process').exec;

var CFG = JSON.parse(fs.readFileSync('settings.json'));

module.exports = function() {

    gulp.task('jquery:install', function(cb) {
        if(CFG.JQUERY.enabled) {
            exec('npm view jquery versions', function (err, stdout, stderr) {
                if(stdout.indexOf(CFG.JQUERY.version) != -1) {
                    exec('npm install jquery@' + CFG.JQUERY.version, function (err, stdout, stderr) {
                        console.log(stdout);
                        console.log(stderr);
                        cb(err);
                    });
                } else {
                    console.log('jQuery не была установлена, версия ' + CFG.JQUERY.version + ' не найдена в npm.');
                    cb();
                }
            });
        } else {
            console.log('jQuery не была установлена, так как в конфиге фигушки.');
            cb();
        }
    });

    gulp.task('jquery:copy', function(cb) {
        if(CFG.JQUERY.enabled) {
            var path = 'node_modules/jquery/';
            var file = false;
            var filename = 'jquery.min.js';
            try {
                fs.statSync(path + 'dist/jquery.min.js');
                file = path + 'dist/jquery.min.js';
            } catch(e) {
                console.error('Не найден файл dist/jquery.min.js, ищем дальше...');
                try {
                    fs.statSync(path + 'jquery.min.js');
                    console.log('Найден файл jquery.min.js.');
                    file = path + 'jquery.min.js';
                } catch(e) {
                    console.error('Не найден файл jquery.min.js, ищем дальше...');
                    try {
                        fs.statSync(path + 'jquery.js');
                        console.log('Найден файл jquery.js. Внимание! Файл не минифицирован.');
                        file = path + 'jquery.js';
                        filename = 'jquery.js';
                    } catch(e) {
                        console.error('Не найден файл jquery.js, неудача!');
                    }
                }
            }
            if(file) {
                try {
                    fs.statSync(CFG.PATH_PUBLIC + 'js/vendor/');
                } catch(e) {
                    fs.mkdirSync(CFG.PATH_PUBLIC + 'js/vendor/');
                }
                fs.createReadStream(file).pipe(fs.createWriteStream(CFG.PATH_PUBLIC + 'js/vendor/' + filename));
            }
            cb();
        } else {
            cb();
        }
    });

    gulp.task('jquery', gulp.series(['jquery:install', 'jquery:copy']));

}