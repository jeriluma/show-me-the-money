'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Evaluates for SASS errors, changes SASS to CSS
gulp.task('sass', function () {
    gulp.src([
        'assets/css/global.scss',
        'app/**/*.scss'
    ])
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('assets/css'));
});

// Watch for SCSS file changes to convert to CSS
gulp.task('sass:watch', function () {
    gulp.watch('assets/css/*.scss', ['sass']);
    gulp.watch('app/**/*.scss', ['sass']);
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src([
            'app/app.js',
            'app/**/*.js'
        ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('assets/js'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/js'));
});

gulp.task('scripts:watch', function() {
    gulp.watch('app/app.js', ['scripts']);
    gulp.watch('app/**/*.js', ['scripts']);
});

// Watches both SASS and JS Changes
gulp.task('default', ['sass', 'scripts', 'sass:watch', 'scripts:watch']);
