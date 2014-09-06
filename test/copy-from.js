var assert = require('assert');
var Client = require('../');

return console.log('Streams make me crpy')
describe('COPY FROM', function() {
  before(function(done) {
    this.client = Client()
    this.client.connect(done);
  });

  after(function(done) {
    this.client.end(done);
  });

  it.only('works', function(done) {
    var client = this.client;
    this.client.querySync('CREATE TEMP TABLE blah(name text, age int)');
    this.client.querySync('COPY blah FROM stdin');
    console.log(this.client.pq.resultStatus())
    var stream = this.client.getCopyFromStream();
    stream.write(Buffer('Brian\t32\n', 'utf8'));
    stream.write(Buffer('Aaron\t30\n', 'utf8'));
    stream.end(Buffer('Shelley\t28\n'), 'utf8');

    stream.once('finish', function() {
      console.log('finish')
      var rows = client.querySync('SELECT COUNT(*) FROM blah')
      assert.equal(rows.length, 1);
      //assert.equal(rows[0].count, 3);
      done();
    });
  })
});
