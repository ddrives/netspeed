var assert = require('assert')
var dWebNetSpeed = require('@dwcore/netspeed')
var debug = require('debug')('dweb-network')

module.exports = function (vault, opts) {
  assert.ok(vault, 'vault required')
  opts = opts || {}

  var dwnetspeed = {}
  var downloadSpeed = dWebNetSpeed()
  var uploadSpeed = dWebNetSpeed()
  var timeout = opts.timeout || 1000
  var upTimeout = null
  var downTimeout = null
  var totalTransfer = {
    up: 0,
    down: 0
  }

  if (debug.enabled) {
    setInterval(function () {
      if (totalTransfer.up) debug('Uploaded data:', totalTransfer.up)
      if (totalTransfer.down) debug('Downloaded data:', totalTransfer.down)
    }, 500)
  }

  vault.metadata.on('download', function (block, data) {
    totalTransfer.down += data.length
    ondownload(data.length)
  })

  vault.metadata.on('upload', function (block, data) {
    totalTransfer.up += data.length
    onupload(data.length)
  })

  if (vault.content) trackContent()
  else vault.on('content', trackContent)

  Object.defineProperty(dwnetspeed, 'downloadSpeed', {
    enumerable: true,
    get: function () { return downloadSpeed() }
  })

  Object.defineProperty(dwnetspeed, 'uploadSpeed', {
    enumerable: true,
    get: function () { return uploadSpeed() }
  })

  Object.defineProperty(dwnetspeed, 'downloadTotal', {
    enumerable: true,
    get: function () { return totalTransfer.down }
  })

  Object.defineProperty(dwnetspeed, 'uploadTotal', {
    enumerable: true,
    get: function () { return totalTransfer.up }
  })

  return dwnetspeed

  function trackContent () {
    vault.content.on('download', function (block, data) {
      totalTransfer.down += data.length
      ondownload(data.length)
    })

    vault.content.on('upload', function (block, data) {
      totalTransfer.up += data.length
      onupload(data.length)
    })
  }

  // Zero out for uploads & disconnections
  function downZero () {
    downloadSpeed = dWebNetSpeed()
    if (downTimeout) clearTimeout(downTimeout)
  }

  function upZero () {
    uploadSpeed = dWebNetSpeed()
    if (upTimeout) clearTimeout(upTimeout)
  }

  function ondownload (bytes) {
    downloadSpeed(bytes)
    if (downTimeout) clearTimeout(downTimeout)
    downTimeout = setTimeout(downZero, timeout)
  }

  function onupload (bytes) {
    uploadSpeed(bytes)
    if (upTimeout) clearTimeout(upTimeout)
    upTimeout = setTimeout(upZero, timeout)
  }
}
