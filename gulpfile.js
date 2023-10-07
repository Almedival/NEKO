const {src, dest, watch, parallel, series} = require('gulp') /* базовый пакет модулей Gulp
    src() выполняет чтение исходных файлов;
    dest() выполняет запись итоговых файлов;
    parallel() объединяет задачи для выполнения в параллельном режиме;
    series() объединяет задачи для выполнения в последовательном режиме;
    watch() запускает необходимые задачи при изменениях в файлах.*/

const browserSync = require('browser-sync').create() //Live Server, автоматически обновляет браузер при изменениях
const clean = require('gulp-clean');                 //очистка файлов и папок
const sass = require('gulp-sass')(require('sass'))   //конвертирует стили *.scss в *.css, может минифицировать код css
const autoprefixer = require('gulp-autoprefixer')    //добавляет префиксы к экспериментальным свойствам из CSS 3
const concat = require('gulp-concat')                //объединяет в один файл и может переименовать
const uglify = require('gulp-uglify-es').default     //минифицирует JS-код
const include = require('gulp-include')              //собирает файлы в один с помощью <!--=unclude название.расширение-->
const htmlMin = require('gulp-htmlmin')              //минифицирует html файлы
const fonter = require('gulp-fonter')                //конвертирует шрифты ttf в другие форматы кроме woff2
const ttf2woff2 = require('gulp-ttf2woff2');         //конвертирует шрифты ttf в woff2
const imagemin = require('gulp-imagemin');           //минифицирует изображения
const newer = require('gulp-newer');                 //передаёт только те исходные файлы, которые новее соответствующих файлов назначения.
const svgSprite = require('gulp-svg-sprite')         //собирает все svg картинки в один файл

/*_______________________________________________________________________________________________________________________________________*/

function styles() {
    return src('src/scss/styles.scss')
        .pipe(autoprefixer({overrideBrowserslist: ['last 10 version']}))
        .pipe(concat('styles.min.css'))
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
} 

function scripts() {
	return src(['src/js/scripts.js'])               // Берем файлы из источников, Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
	.pipe(concat('scripts.min.js'))                 // Конкатенируем в один файл
	.pipe(uglify())                                 // Сжимаем JavaScript
	.pipe(dest('app/js'))                           // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream())                     // Триггерим Browsersync для обновления страницы
}

function fonts() {
    return src('src/fonts/**/*.*')
        .pipe(fonter({formats: ['woff', 'ttf']}))
        .pipe(src('src/fonts/*.ttf'))
        .pipe(ttf2woff2())
        .pipe(dest('app/fonts'))
}

function imgmin() {
    return src(['src/img/**/*.*', '!src/img/**/*.svg'])
        .pipe(newer('app/imgmin'))
        .pipe(imagemin())
        .pipe(dest('app/imgmin'))
}

function svgsprite() {
    return src('src/img/svg/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg',
                    // example: true   //дополнительно создаёт файл sprite.stack.html
                }
            }
        }))
        .pipe(dest('app/imgmin'))
}

function pages() {
    return src (['src/*.html', 'src/html/pages/*.html'])
    .pipe(include({includePaths: 'src/html/components'}))
    .pipe(dest('app'))
    .pipe(browserSync.stream())
}

function htmlmin() {
    return src('app/*.html')
    .pipe(htmlMin({collapseWhitespace: true}))
    .pipe(dest('app/htmlmin'))
}

function watching() {
    browserSync.init({              // Инициализация Browsersync
		server: {baseDir: 'app/'}   // Указываем папку сервера
		// notify: false            // Отключаем уведомления
		// online: true             // Параметр online отвечает за режим работы. Укажите online: false, если хотите работать без подключения к интернету.
	})
    watch('src/scss/**/*.scss', styles)
    watch('src/img/*.*', imgmin)
    watch('src/img/svg/*.svg', svgsprite)
    watch('src/js/scripts.js', scripts)
    watch(['src/html/components/*.html',
           'src/html/pages/*.html',
           'src/*.html'], pages).on('change', browserSync.reload)
}

function cleaning() {
    return src('app', {allowEmpty: true})
    .pipe(clean())
}

exports.styles = styles
exports.scripts = scripts
exports.imgmin = imgmin
exports.svgsprite = svgsprite
exports.pages = pages
exports.watching = watching
exports.cleaning = cleaning
exports.fonts = fonts       //функция по конвертированию шрифтов не включена в default команду gulp
exports.htmlmin = htmlmin   //функция минификации html файлов не включена в default команду gulp

exports.default = series(cleaning, parallel(pages, fonts, styles, imgmin, svgsprite, scripts), htmlmin, watching)   //очистка директории а потом запуск
exports.app = parallel(pages, styles, scripts, watching)     //быстрый запуск без очистки, без сжатия html и без шрифтов
