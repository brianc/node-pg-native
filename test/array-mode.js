var Client = require('../');
var assert = require('assert');

describe('client with arrayMode', function() {
  it('returns result as array', function() {
    var client = new Client({arrayMode: true});
    client.connectSync();
    client.querySync('CREATE TEMP TABLE blah(name TEXT)');
    client.querySync('INSERT INTO blah (name) VALUES ($1)', ['brian'])
    client.querySync('INSERT INTO blah (name) VALUES ($1)', ['aaron'])
    var rows = client.querySync("SELECT * FROM blah");
    assert.equal(rows.length, 2);
    var row = rows[0]
    assert.equal(row.length, 1);
    assert.equal(row[0], 'brian');
    assert.equal(rows[1][0], 'aaron');
  });
});
