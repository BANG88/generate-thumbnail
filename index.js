var fs = require('fs')
var mkdirp = require('mkdirp')

var ffmpeg = require('fluent-ffmpeg')
var sharp = require('sharp')
var path = require('path')

/**
 * create a folder -p
 * 
 * @param {any} folder
 */
function createFolder (folder) {
  if (!fs.existsSync(folder)) {
    mkdirp.sync(folder)
  }
}

/**
 * generate thumbnail from video 
 * 
 * @param {any} inputFile
 * @param {Object} options
 */
function generateThumbnail (inputFile, options) {
  options = options || {
    output: './thumbnail/' + path.basename(inputFile, path.extname(inputFile)) + '/',
    timemarks: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '90%']
  }

  var folder = options.output

  var timemarks = options.timemarks

  var filenameCached = []

  // create folder 
  createFolder(folder)

  ffmpeg(inputFile)
    // setup event handlers
    .on('filenames', function (filenames) {
      filenameCached = filenames

      console.log('screenshots are ' + filenames.join(', '))
    })
    .on('end', function () {
      filenameCached.forEach(function (filename) {
        var image = sharp(`${folder}/${filename}`)
        image
          .metadata()
          .then(function (md) {
            var thumbnailFolder = `${folder}thumbnail`
            createFolder(thumbnailFolder)
            return image
              .resize(Math.round(md.width / 2))
              // .webp()
              .toFile(`${thumbnailFolder}/${filename}`)
          })
          .then(function (data) {
            // data contains a WebP image half the width and height of the original JPEG
          })
      })

      console.log('screenshots were saved')
    })
    .on('error', function (err) {
      console.log('an error happened: ' + err.message)
    })
    // take 2 screenshots at predefined timemarks and size
    .takeScreenshots({
      count: timemarks.length,
      timemarks: timemarks,
      filename: 'thumb.png',
      size: `100%`,
      folder: folder
    })
}

module.exports = function (inputFile, options) {
  if (Array.isArray(inputFile)) {
    Array.forEach(function (inputFile) {
      generateThumbnail(inputFile, options)
    })
  }else {
    generateThumbnail(inputFile, options)
  }
}
