var Client = require('../');
var ok = require('okay');
var assert = require('assert');

describe('async workflow', function() {
  before(function() {
    this.client = new Client();
  });

  it('connects', function(done) {
    this.client.connect(done);
  });

  var echoParams = function(params, cb) {
    this.client.query('SELECT $1::text as first, $2::text as second', params, ok(cb, function(rows) {
      checkParams(params, rows);
      cb(null, rows);
    }));
  };

  var checkParams = function(params, rows) {
    assert.equal(rows.length, 1);
    assert.equal(rows[0].first, params[0]);
    assert.equal(rows[0].second, params[1]);
  };

  it('sends async query', function(done) {
    var params = ['one', 'two']
    echoParams.call(this, params, done);
  });

  it('sends multiple async queries', function(done) {
    var self = this;
    var params = ['bang', 'boom'];
    echoParams.call(this, params, ok(done, function(rows) {
      echoParams.call(self, params, done);
    }));
  });

  it('sends an async query, copies in, copies out, and sends another query', function(done) {
    var self = this;
    echoParams.call(this, ['one', 'two'], ok(done, function() {
      done();
    }))
  });
});
