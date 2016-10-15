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

  }

  options.output = options.output || './thumbnail'
  options.timemarks = options.timemarks || ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '90%']

  var folder = options.output + '/' + path.basename(inputFile, path.extname(inputFile)) + '/'

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
        var image = sharp(folder + '/' + filename)
        image
          .metadata()
          .then(function (md) {
            var thumbnailFolder = folder + '/' + 'thumbnail'
            createFolder(thumbnailFolder)
            return image
              .resize(Math.round(md.width / 2))
              // .webp()
              .toFile(thumbnailFolder + '/' + filename)
          })
          .then(function (data) {
            // data contains a WebP image half the width and height of the original JPEG
          })
      })

      console.log(inputFile + ' screenshots were saved')
    })
    .on('error', function (err) {
      console.log('an error happened: ' + err.message)
    })
    // take 2 screenshots at predefined timemarks and size
    .takeScreenshots({
      count: timemarks.length,
      timemarks: timemarks,
      filename: 'thumb.png',
      size: '100%',
      folder: folder
    })
}

module.exports = function (inputFile, options) {
  if (fs.lstatSync(inputFile).isDirectory()) {
    var files = fs.readdirSync(inputFile)
    inputFile = files.filter(function (input) {
      return fs.lstatSync(inputFile + '/' + input).isFile()
    }).map(function (input) {
      return inputFile + '/' + input
    })
    console.log('Input files: ', inputFile)
  }

  if (Array.isArray(inputFile)) {
    inputFile.forEach(function (input) {
      generateThumbnail(input, options)
    })
  }else {
    generateThumbnail(inputFile, options)
  }
}
