'use strict';

var _ = require('underscore');
var fs = require('fs');
var gulp = require('gulp');
var sass = require('gulp-sass');
var sitemapGenerator = require('sitemap');
var yaml = require('js-yaml');

gulp.task('build', ['misc', 'sass', 'images', 'favicons', 'fonts', 'sitemap']);

gulp.task('misc', function () {
  gulp.src(['assets/misc/**/*'])
    .pipe(gulp.dest('public'));
});

gulp.task('fonts', function () {
  gulp.src(['assets/fonts/**/*'])
    .pipe(gulp.dest('public/assets/fonts'));
});

gulp.task('images', function () {
  gulp.src(['assets/images/**/*'])
    .pipe(gulp.dest('public/assets/images'));
});

gulp.task('favicons', function () {
  gulp.src(['assets/favicons/**/*'])
    // Favicons are supposed to be accessible from the root.
    .pipe(gulp.dest('public'));
});

gulp.task('sass', function () {
  gulp.src('./assets/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/assets/css'));
});

gulp.task('watch', function () {
  gulp.watch('./assets/**/*', ['build']);
});

gulp.task('sitemap', function (done) {
  var sitemapPath = __dirname + '/sitemap.yml';
  var sitemapDest = __dirname + '/public/sitemap.xml';
  var doc = yaml.load(fs.readFileSync(sitemapPath, 'utf8'));
  var urls = [];


  for (var i = 0; i < doc.length; i++) {
    var group = doc[i];
    var groupUrls = group.urls;
    var settings = _.omit(group, 'urls');

    for (var groupKey in groupUrls) {
      var url = groupUrls[groupKey];
      var imageEntries = undefined;

      if (url && url.images) {
        imageEntries = _.map(url.images, function (value, key) {
          return { url: key, caption: value };
        });
      }

      var entry = _.extend({}, settings, {
        url: groupKey,
        img: imageEntries,
      });

      urls.push(entry);
    }
  }

  var sitemap = sitemapGenerator.createSitemap({
    hostname: 'https://trysparkschool.com',
    urls: urls,
  });

  fs.writeFile(sitemapDest, sitemap.toString(), done);
});

