const gulp = require('gulp');
const { src, dest, watch, parallel, series } = gulp;
const plugins = {
  scss: require('gulp-sass')(require('sass')),
  concat: require('gulp-concat'),
  uglify: require('gulp-uglify-es').default,
  browserSync: require('browser-sync').create(),
  postcss: require('gulp-postcss'),
  clean: require('gulp-clean'),
  avif: require('gulp-avif'),
  webp: require('gulp-webp'),
  newer: require('gulp-newer'),
  fonter: require('gulp-fonter'),
  ttf2woff2: require('gulp-ttf2woff2'),
  include: require('gulp-file-include'),
  sourcemaps: require('gulp-sourcemaps'),
  notify: require('gulp-notify'),
  replace: require('gulp-replace'),
  plumber: require('gulp-plumber'),
  if: require('gulp-if'),
};

// Шляхи до файлів
const paths = {
  imagesSrc: 'app/images/src/**/*.{jpg,jpeg,png,svg}',
  scriptsSrc: 'app/js/main.js',
  stylesSrc: 'app/scss/style.scss',
  htmlSrc: 'app/pages/*.html',
  fontsSrc: 'app/fonts/src/*.{ttf,otf}',
};

// Обробка HTML з компонентами
function pages() {
  console.log('Обробка HTML...');
  return src(paths.htmlSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Помилка HTML: <%= error.message %>'
        ),
      })
    )
    .pipe(plugins.include({ prefix: '@@', basepath: 'app/components/' }))
    .pipe(dest('app'))
    .pipe(plugins.browserSync.reload({ stream: true }));
}

// Оптимізація шрифтів
function fonts() {
  return (
    src(paths.fontsSrc)
      .pipe(
        plugins.plumber({
          errorHandler: plugins.notify.onError(
            'Помилка шрифтів: <%= error.message %>'
          ),
        })
      )
      .pipe(plugins.fonter({ formats: ['woff', 'ttf'] }))
      // Копіюємо лише .woff, виключаючи .ttf
      .pipe(plugins.if(file => /\.woff$/.test(file.extname), dest('app/fonts')))
      // Завантажуємо .ttf для конвертації в .woff2
      .pipe(src('app/fonts/src/*.ttf'))
      .pipe(plugins.ttf2woff2())
      .pipe(dest('app/fonts'))
  );
}

// Оптимізація зображень
function images() {
  return (
    src(paths.imagesSrc)
      .pipe(
        plugins.plumber({
          errorHandler: plugins.notify.onError(
            'Помилка зображень: <%= error.message %>'
          ),
        })
      )
      .pipe(plugins.newer('app/images'))
      // Копіювання SVG без змін
      .pipe(plugins.if(file => /\.svg$/.test(file.extname), dest('app/images')))
      // Конвертація JPG/PNG у AVIF
      .pipe(
        plugins.if(
          file => /\.(jpg|jpeg|png)$/.test(file.extname),
          plugins.avif({ quality: 50 })
        )
      )
      .pipe(dest('app/images'))
      // Повторне завантаження для WebP
      .pipe(src(paths.imagesSrc))
      .pipe(plugins.newer('app/images'))
      .pipe(
        plugins.if(
          file => /\.(jpg|jpeg|png)$/.test(file.extname),
          plugins.webp()
        )
      )
      .pipe(dest('app/images'))
  );
}

// Обробка скриптів
function scripts() {
  return src(paths.scriptsSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Помилка скриптів: <%= error.message %>'
        ),
      })
    )
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('main.min.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write())
    .pipe(dest('app/js'))
    .pipe(plugins.browserSync.reload({ stream: true }));
}

// Обробка стилів
function styles() {
  return src(paths.stylesSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Помилка стилів: <%= error.message %>'
        ),
      })
    )
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.scss({ outputStyle: 'compressed' }))
    .pipe(plugins.concat('style.min.css'))
    .pipe(plugins.postcss([require('autoprefixer')]))
    .pipe(plugins.sourcemaps.write())
    .pipe(dest('app/css'))
    .pipe(plugins.browserSync.stream());
}

// Синхронізація браузера
function sync() {
  plugins.browserSync.init({
    server: { baseDir: 'app/' },
    notify: false,
    port: 3000,
    ghostMode: false,
    online: true,
  });
}

// Спостереження за файлами
function watching() {
  console.log('👀 Спостереження за файлами...');
  sync();

  // Спостереження за SCSS
  watch('app/scss/**/*.scss', styles);

  // Спостереження за HTML
  watch(['app/components/**/*.html', 'app/pages/*.html'], pages);

  // Спостереження за JS
  watch('app/js/main.js', scripts);

  // Спостереження за зображеннями
  watch(
    paths.imagesSrc,
    series(images, function (cb) {
      plugins.browserSync.reload();
      cb();
    })
  );

  // Спостереження за шрифтами
  watch(paths.fontsSrc, fonts);
}

// Очищення папки dist
function cleanDist() {
  return src('dist', { allowEmpty: true }).pipe(plugins.clean());
}

// Збірка для продакшену
function building() {
  return src(
    [
      'app/css/style.min.css',
      'app/images/**/*.{svg,webp,avif}',
      'app/fonts/*.{woff,woff2}', // Включено лише woff і woff2
      'app/js/main.min.js',
      'app/*.html',
    ],
    { base: 'app', allowEmpty: true }
  ).pipe(dest('dist'));
}

exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.scripts = scripts;
exports.watching = watching;
exports.cleanDist = cleanDist;
exports.build = series(
  cleanDist,
  images,
  fonts,
  styles,
  scripts,
  pages,
  building
);
exports.default = series(images, fonts, styles, scripts, pages, watching);
