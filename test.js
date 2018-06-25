var fs = require('fs')
var test = require('tape')
var ddrive = require('@ddrive/core')
var dwrem = require('@dwcore/rem')
var flockRevelation = require('@flockcore/revelation')
var dWebChannel = require('@dwcore/channel')

var dWebNetSpeed = require('.')

var vault = ddrive(dwrem)
var flock

vault.ready(function () {
  flock = flockRevelation(vault)

  dWebChannel(fs.createReadStream('test.js'), vault.createWriteStream('test.js'), function (err) {
    if (err) throw err
    dWebChannel(fs.createReadStream('test.js'), vault.createWriteStream('test.js'), function (err) {
      if (err) throw err
      run()
    })
  })
})

function run () {
  test('dDrive NetSpeed Tests: tracks upload speed', function (t) {
    var dwnetspeed = dWebNetSpeed(vault)

    var vaultClient = ddrive(dwrem, vault.key)

    vaultClient.ready(function () {
      var flockClient = flockRevelation(vaultClient)

      vault.content.once('upload', function () {
        t.ok(dwnetspeed.uploadTotal && dwnetspeed.uploadTotal > 0, 'has upload total')
        t.ok(dwnetspeed.uploadSpeed && dwnetspeed.uploadSpeed > 0, 'has upload speed')
        t.ok(Object.keys(speed).indexOf('uploadSpeed') > -1, 'uploadSpeed enumerable')
        flockClient.close(function () {
          t.end()
        })
      })
    })
  })

  test('dDrive NetSpeed Tests: tracks download speed', function (t) {
    var vaultClient = ddrive(dwrem, vault.key)
    var speed = dWebNetSpeed(vaultClient)

    vaultClient.ready(function () {
      var flockClient = flockRevelation(vaultClient)

      vaultClient.once('content', function () {
        vaultClient.content.once('download', function () {
          t.ok(dwnetspeed.downloadTotal && dwnetspeed.downloadTotal > 0, 'has download total')
          t.ok(dwnetspeed.downloadSpeed && dwnetspeed.downloadSpeed > 0, 'has download speed')
          t.ok(Object.keys(speed).indexOf('downloadSpeed') > -1, 'downloadSpeed enumerable')
          flockClient.close(function () {
            t.end()
          })
        })
      })
    })
  })

  test('dDrive NetSpeed Tests: zeros out speed after finishing', function (t) {
    var vaultClient = ddrive(dwrem, vault.key)
    var speedDown = dWebNetSpeed(vaultClient)
    var stream = vaultClient.replicate({live: false})

    vaultClient.ready(function () {
      var flockClient = flockRevelation(vaultClient, {stream: function () { return stream}})

      stream.once('close', function () {
        setTimeout(ondone, 300)
      })

      function ondone () {
        t.same(speedDown.downloadSpeed, 0, 'download speed zero')
        flockClient.close(function () {
          t.end()
        })
      }
    })
  })

  test('dDrive NetSpeed Tests: zeros out speed after disconnection', function (t) {
    var vaultClient = ddrive(dwrem, vault.key)
    var speedDown = dWebNetSpeed(vaultClient, {timeout: 250})
    var speedUp = dWebNetSpeed(vault, {timeout: 250})

    vaultClient.ready(function () {
      var flockClient = flockRevelation(vaultClient)
      vaultClient.metadata.once('download', function () {
        setTimeout(function () {
          t.same(speedUp.uploadSpeed, 0, 'upload speed zero')
          t.same(speedDown.downloadSpeed, 0, 'download speed zero')

          flockClient.close(function () {
            flock.close(function () {
              t.end()
            })
          })
        }, 500)
        flockClient.leave(vault.key)
      })
    })
  })
}
