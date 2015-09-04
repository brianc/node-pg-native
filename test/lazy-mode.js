var Client = require('../');
var assert = require('assert');

describe('client with lazyMode', function() {
  it('returns result as lazy row', function(done) {
    var client = new Client({lazyMode: true});
    client.connectSync();
    client.querySync('CREATE TEMP TABLE blah(name TEXT, number INT)');
    client.querySync('INSERT INTO blah (name) VALUES ($1)', ['brian'])
    client.querySync('INSERT INTO blah (name,number) VALUES ($1,$2)', ['aaron', 1])
    var rows = client.querySync("SELECT * FROM blah");
    assert.equal(rows.length, 2);
    assert.equal(rows[0]['name'], 'brian');
    assert.equal(rows[0].parse_name(), 'brian');
    assert.equal(rows[0]['number'], null);
    assert.equal(rows[0].parse_number(), null);
    assert.equal(rows[1]['name'], 'aaron');
    assert.equal(rows[1].parse_name(), 'aaron');
    assert.equal(rows[1]['number'], '1');
    assert.equal(rows[1].parse_number(), 1);

    client.query("SELECT now() as current_time, 'brian' as value1, null as value2", function(err, res) {
      assert.ifError(err);
      assert.strictEqual(typeof res[0]['current_time'], 'string');
      assert.equal(res[0].parse_current_time().getFullYear(), new Date().getFullYear());
      assert.strictEqual(res[0]['value1'], 'brian')
      assert.strictEqual(res[0].parse_value1(), 'brian')
      assert.strictEqual(res[0]['value2'], null)
      assert.strictEqual(res[0].parse_value2(), null)
      client.end(done);
    });
  });
});
