var Client = require('../')
var assert = require('assert')
var async = require('async')

describe('connection', function() {
  it('works', function(done) {
    Client().connect(done);
  });

  it('connects with args', function(done) {
    Client().connect('host=localhost', done);
  });

  it('errors out with bad connection args', function(done) {
    Client().connect('host=asldkfjasdf', function(err) {
      assert(err, 'should raise an error for bad host');
      done();
    });
  });
});

describe('connectSync', function() {
  it('works without args', function() {
    Client().connectSync();
  });

  it('works with args', function() {
    Client().connectSync('host=localhost');
  });

  it('throws if bad host', function() {
    assert.throws(function() {
      Client().connectSync('host=laksdjfdsf');
    });
  });
});

describe('async query', function() {
  before(function(done) {
    this.client = Client();
    this.client.connect(function(err) {
      if(err) return done(err);
      return done();
    });
  });

  after(function(done) {
    this.client.end(done);
  });

  it('simple query works', function(done) {
    var runQuery = function(n, done) {
      this.client.query('SELECT NOW() AS the_time', function(err, rows) {
        if(err) return done(err);
        assert.equal(rows[0].the_time.getFullYear(), new Date().getFullYear());
        return done();
      });
    }.bind(this);
    async.timesSeries(3, runQuery, done)
  });

  it('parameters work', function(done) {
    var runQuery = function(n, done) {
      this.client.query('SELECT $1::text AS name', ['Brian'], done);
    }.bind(this);
    async.timesSeries(3, runQuery, done)
  });

  it('prepared, named statements work');
});

describe('query sync', function(done) {
  before(function() {
    this.client = Client();
    this.client.connectSync();
  });

  after(function(done) {
    this.client.end(done);
  });

  it('simple query works', function() {
    var rows = this.client.querySync('SELECT NOW() AS the_time');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].the_time.getFullYear(), new Date().getFullYear());
  });

  it('parameterized query works', function() {
    var rows = this.client.querySync('SELECT $1::text AS name', ['Brian']);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Brian');
  });
});
