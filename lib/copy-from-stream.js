var Transform = require('stream').Transform;
var util = require('util');
var consumeResults = require('./consume-results');

var CopyFromStream = module.exports = function(pq, options) {
  Transform.call(this, options);
  this.pq = pq;
};

util.inherits(CopyFromStream, Transform);

CopyFromStream.prototype._write = function(chunk, encoding, cb) {
  var result = this.pq.putCopyData(chunk);

  this.push(' ')
  //sent successfully
  if(result === 1) return cb();

  //error
  if(result === -1) return cb(new Error(this.pq.errorMessage()));

  //command would block. wait for writable and call again.
  var self = this;
  this.pq.writable(function() {
    self._write(chunk, encoding, cb);
  });
};

CopyFromStream.prototype._flush = function(cb) {
  var result = this.pq.putCopyEnd();
  this.push('test')

  //sent successfully
  if(result === 1) return consumeResults(this.pq, cb);

  //error
  if(result === -1) return cb(new Error(this.pq.errorMessage()));

  //command would block. wait for writable and call again.
  var self = this;
  this.pq.writable(function() {
    self._flush(cb);
  });
};
