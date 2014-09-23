var Client = require('../');
var async = require('async');
var ok = require('okay');

var execute = function(x, done) {
  var client = new Client();
  client.connect(ok(done, function() {
    var query = function(n, cb) {
      client.query('SELECT $1::int as num', [n], function() {
        cb()
      });
    };
    async.timesSeries(50, query, ok(done, function() {
      client.end();
      done()
    }));
  }));
}
describe('Load tests', function() {
  it('single client and many queries', function(done) {
    async.times(1, execute, done);
  });

  it.only('multiple client and many queries', function(done) {
    this.timeout(5000);
    //this segfaults or throws 'Abort trap: 6'
    async.times(10, execute, done);
  });
});
