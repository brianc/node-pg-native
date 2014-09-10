var Client = require('../')

describe('LISTEN/NOTIFY', function() {
  before(function(done) {
    var client = this.client = new Client();
    client.connect(done);
  });

  var notify = function(channel, payload) {
    var client = new Client();
    client.connectSync();
    client.querySync("NOTIFY " + channel + ", '" + payload + "'");
    client.end();
  };

  it('works in a simple case', function(done) {
    var client = this.client;
    client.querySync('LISTEN boom');
    client.on('notification', function(msg) {
      done();
    });
    notify('boom', 'sup')
  });

  after(function(done) {
    this.client.end(done);
  });
});
