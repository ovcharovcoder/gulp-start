const gulp = require('gulp');
const { src, dest, watch, parallel, series } = gulp;
const fs = require('fs');
const path = require('path');

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

const isProd = process.env.NODE_ENV === 'production';

// File paths
const paths = {
  imagesSrc: 'app/images/src/**/*.{jpg,jpeg,png,svg}',
  imagesWebpSrc: 'app/images/src/**/*.{jpg,jpeg,png}',
  imagesAvifSrc: 'app/images/src/**/*.{jpg,jpeg,png}',
  imagesSvgSrc: 'app/images/src/**/*.svg',
  scriptsSrc: 'app/js/main.js',
  stylesSrc: 'app/scss/style.scss',
  htmlSrc: 'app/pages/*.html',
  fontsSrc: 'app/fonts/src/*.{ttf,otf}',
};

// Processing HTML with components
function pages() {
  console.log('📄 Обробка HTML...');
  return src(paths.htmlSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error HTML: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.include({ prefix: '@@', basepath: 'app/components/' }))
    .pipe(dest('app'))
    .pipe(plugins.browserSync.reload({ stream: true }));
}

// Font optimization
function fonts() {
  console.log('🔤 Оптимізація шрифтів...');

  if (!fs.existsSync('app/fonts')) {
    fs.mkdirSync('app/fonts', { recursive: true });
  }

  const woffStream = src(paths.fontsSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error Fonts WOFF: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.fonter({ formats: ['woff'] }))
    .pipe(dest('app/fonts'));

  const woff2Stream = src(paths.fontsSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error Fonts WOFF2: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.ttf2woff2())
    .pipe(dest('app/fonts'));

  return Promise.all([woffStream, woff2Stream]);
}

// Image conversion
function imagesWebp() {
  console.log('🖼️ Конвертація в WebP...');
  return src(paths.imagesWebpSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error WebP: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.newer('app/images'))
    .pipe(plugins.webp())
    .pipe(dest('app/images'));
}

function imagesAvif() {
  console.log('🖼️ Конвертація в AVIF...');
  return src(paths.imagesAvifSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error AVIF: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.newer('app/images'))
    .pipe(plugins.avif({ quality: 50 }))
    .pipe(dest('app/images'));
}

function imagesSvg() {
  console.log('🖼️ Копіювання SVG...');
  return src(paths.imagesSvgSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError('Error SVG: <%= error.message %>'),
      }),
    )
    .pipe(plugins.newer('app/images'))
    .pipe(dest('app/images'));
}

const images = parallel(imagesWebp, imagesAvif, imagesSvg);

// Script processing
function scripts() {
  console.log('📜 Обробка скриптів...');

  return src(paths.scriptsSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error scripts: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('main.min.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(dest('app/js'))
    .pipe(plugins.browserSync.reload({ stream: true }));
}

// Style processing
function styles() {
  console.log('🎨 Обробка стилів...');

  if (!fs.existsSync('app/css')) {
    fs.mkdirSync('app/css', { recursive: true });
  }

  return src(paths.stylesSrc)
    .pipe(
      plugins.plumber({
        errorHandler: plugins.notify.onError(
          'Error styles: <%= error.message %>',
        ),
      }),
    )
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.scss({ outputStyle: 'compressed' }))
    .pipe(plugins.concat('style.min.css'))
    .pipe(plugins.postcss([require('autoprefixer')]))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(dest('app/css'))
    .pipe(plugins.browserSync.stream());
}

// Browser synchronization
function sync(done) {
  plugins.browserSync.init({
    server: { baseDir: 'app/' },
    notify: false,
    port: 3000,
    ghostMode: false,
    online: true,
    open: true,
  });
  done();
}

// Watching
function watching() {
  console.log('👀 Початок спостереження за файлами...');
  console.log('🌐 Сервер запущено: http://localhost:3000');

  watch('app/scss/**/*.scss', styles);
  watch(['app/components/**/*.html', 'app/pages/*.html'], pages);
  watch('app/js/main.js', scripts);
  watch(
    paths.imagesSrc,
    series(images, function (done) {
      plugins.browserSync.reload();
      done();
    }),
  );
  watch(paths.fontsSrc, fonts);
}

// Clean up the dist folder
function cleanDist() {
  console.log('🧹 Очищення папки dist...');
  return src('dist', { allowEmpty: true, read: false }).pipe(plugins.clean());
}

// Build for production
function building() {
  console.log('🏗️ Збірка для production...');
  return src(
    [
      'app/css/**/*.css',
      'app/images/**/*.{svg,webp,avif}',
      'app/fonts/**/*.{woff,woff2}',
      'app/js/main.min.js',
      'app/*.html',
    ],
    { base: 'app', allowEmpty: true },
  )
    .pipe(
      plugins.if(
        isProd,
        plugins.replace(/(src|href)=["']\/([^"']+)/g, '$1="$2'),
      ),
    )
    .pipe(
      plugins.if(isProd, plugins.replace(/url\(['"]?\/([^)'"]+)/g, 'url($1)')),
    )
    .pipe(
      plugins.if(
        isProd,
        plugins.replace(/<img([^>]+)src=["']\/([^"']+)/g, '<img$1src="$2'),
      ),
    )
    .pipe(dest('dist'));
}

// Export of tasks
exports.styles = styles;
exports.imagesWebp = imagesWebp;
exports.imagesAvif = imagesAvif;
exports.imagesSvg = imagesSvg;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.scripts = scripts;
exports.watch = watching;
exports.cleanDist = cleanDist;

exports.build = series(
  cleanDist,
  parallel(images, fonts),
  styles,
  scripts,
  pages,
  building,
);

exports.default = series(
  parallel(images, fonts),
  styles,
  scripts,
  pages,
  sync,
  watching,
);
