var Client = require('../');
var assert = require('assert');

describe('connection error', function() {
  it('doesnt segfault', function(done) {
    var client = new Client();
    client.connect('asldgsdgasgdasdg', function(err) {
      assert(err);
      //calling error on a closed client was segfaulting
      client.end();
      done();
    });
  });
});

describe('connect & disconnect', function() {
  it('does not seg fault', function(done) {
    var client = new Client();
    client.connect(function() {
      client.end(done);
    });
  });
});
