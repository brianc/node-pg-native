var Client = require('../');
var async = require('async');
var ok = require('okay');

describe('many connections', function() {

  describe('async', function() {
    var test = function(count, times) {
      it('connecting ' + count + ' clients ' + times, function(done) {
        this.timeout(10000);

        var connectClient = function(n, cb) {
          var client = new Client();
          client.connect(ok(cb, function() {
            client.query('SELECT NOW()', ok(cb, function() {
              client.end(cb);
            }));
          }));
        }

        var run = function(n, cb) {
          async.times(count, connectClient, cb);
        }

        async.timesSeries(times, run, done);

      });
    };

    test(1, 1);
    test(1, 1);
    test(1, 1);
    test(5, 5);
    test(5, 5);
    test(5, 5);
    test(10, 10);
    test(10, 10);
    test(10, 10);
    test(20, 20);
    test(20, 20);
    test(20, 20);
  });
});
