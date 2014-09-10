var Client = require('../')

var notify = function(channel, payload) {
  var client = new Client();
  client.connectSync();
  client.querySync("NOTIFY " + channel + ", '" + payload + "'");
  client.end();
};

describe('simple LISTEN/NOTIFY', function() {
  before(function(done) {
    var client = this.client = new Client();
    client.connect(done);
  });

  it('works', function(done) {
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

describe('async LISTEN/NOTIFY', function() {
  
})
