var Client = require('../');
var assert = require('assert');

describe('multiple commands in a single query', function() {
  it('all execute to completion', function(done) {
    var client = new Client();
    client.connectSync();
    client.query("SELECT NOW(); SELECT 'brian'::text as name", function(err, rows) {
      assert.equal(rows.length, 1);
      assert.equal(rows[0].name, 'brian');
      done();
    });
  });
});
