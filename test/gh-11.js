//this is a test to recreate the issue
//at https://github.com/brianc/node-pg-native/issues/11


var Client = require('../');
var Pool = require('generic-pool').Pool;
var ok = require('okay');

var pool = Pool({
  max: 20,
  idleTimeoutMillis: 50,
  create: function(cb) {
    console.log('NEW CLIENT')
    var client = new Client();
    client.connectSync();
    client.querySync('CREATE TEMP TABLE stats(jsDoc TEXT)');
    cb(null, client);
  },
  destroy: function(client) {
    console.log('DESTROY')
    client.end();
  }
});

var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter

//get a random number between min and max
var rnd = function(min, max) { return ((~~(Math.random() * max) + min))}

var randomTextBuffer = function(size) {
  var bytes = []
  for(var i = 0; i < size; i++) {
    bytes.push(rnd(21, 71))
  }
  return Buffer(bytes)
}
var fakeSocket = function() {
  var fake = new EventEmitter()

  var emitData = function() {
    setTimeout(function() {
      fake.emit('data', randomTextBuffer(rnd(200, 10000)))
      emitData()
    }, rnd(5000, 10000))
  }
  emitData()
  return fake
}

var server = new EventEmitter()
var queryCount = 0
server.on('connection', function(socket) {
  socket.on('data', function(data) {
    pool.acquire(ok(function(client) {
      var str = data.toString('utf8')
      client.query('INSERT INTO stats(jsDoc) VALUES ($1)', [str], ok(function() {
        console.log('query done', queryCount++)
        pool.release(client)
      }))
    }))
  })
})

if(module.parent) return;

var max = parseInt(process.env.MAX || 1000);
var count = 0
var tid = setInterval(function() {
  if(count++ > max) return clearTimeout(tid);
  console.log('fake socket', count)
  server.emit('connection', fakeSocket());
}, 100)
