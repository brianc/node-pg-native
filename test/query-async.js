var Client = require('../');
var assert = require('assert');
var async = require('async');
var ok = require('okay');
var PgTypes = require('pg-types');

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
    PgTypes.setTypeParser(23, 'text', null);
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

  it('prepared, named statements work', function(done) {
    var client = this.client;
    client.prepare('test', 'SELECT $1::text as name', 1, function(err) {
      if(err) return done(err);
      client.execute('test', ['Brian'], ok(done, function(rows) {
        assert.equal(rows.length, 1);
        assert.equal(rows[0].name, 'Brian');
        client.execute('test', ['Aaron'], ok(done, function(rows) {
          assert.equal(rows.length, 1);
          assert.equal(rows[0].name, 'Aaron');
          done();
        }));
      }));
    });
  });

  it('returns error if prepare fails', function(done) {
    this.client.prepare('test', 'SELECT AWWW YEAH', 0, function(err) {
      assert(err, 'Should have returned an error');
      done();
    });
  });

  it('returns an error if execute fails', function(done) {
    this.client.execute('test', [], function(err) {
      assert(err, 'Should have returned an error');
      done();
    });
  });

  it('returns an error if there was a query error', function(done) {
    var runErrorQuery = function(n, done) {
      this.client.query('SELECT ALKJSFDSLFKJ', function(err) {
        assert(err instanceof Error, 'Should return an error instance');
        done();
      });
    }.bind(this);
    async.timesSeries(3, runErrorQuery, done);
  });

  it('is still usable after an error', function(done) {
    this.client.query('SELECT NOW()', done);
  });

  it('supports empty query', function(done) {
    this.client.query('', function(err, rows) {
      assert.ifError(err);
      assert(rows, 'should return rows');
      assert.equal(rows.length, 0, 'should return no rows');
      done();
    });
  });

  it('returns an error if there was a error parsingRows', function(done) {
    PgTypes.setTypeParser(23, 'text', function () {
      throw new Error("Type Parser Error")
    });
    var runErrorQuery = function(n, done) {
      this.client.query('SELECT 1', function(err) {
        assert(err instanceof Error, 'Should return an error instance');
        PgTypes.setTypeParser(23, 'text', null);
        done();
      });
    }.bind(this);
    async.timesSeries(3, runErrorQuery, done);
  });
});
