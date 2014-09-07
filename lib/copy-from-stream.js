var Writable = require('stream').Writable;
var util = require('util');
var consumeResults = require('./consume-results');

var CopyFromStream = module.exports = function(pq, options) {
  Writable.call(this, options);
  this.pq = pq;
};

util.inherits(CopyFromStream, Writable);

var count = 0;
CopyFromStream.prototype._write = function(chunk, encoding, cb) {
  var result = this.pq.putCopyData(chunk);

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

CopyFromStream.prototype.end = function() {
  var args = arguments;
  var self = this;

  if(args && args.length && !util.isFunction(args[0])) {
    this.write(args[0])
  }
  var result = this.pq.putCopyEnd();

  //sent successfully
  if(result === 1) {
    //consume our results and then call 'end' on the
    //"parent" writable class so we can emit 'finish' and
    //all that jazz
    return consumeResults(this.pq, function(err, res) {
      Writable.prototype.end.call(self);

      //handle possible passing of callback to end method
      var cb = args[args.length - 1]
      if(cb) {
        cb();
      }
    });
  }

  //error
  if(result === -1) {
    var err = new Error(this.pq.errorMessage());
    return this.emit('error', err);
  }

  //command would block. wait for writable and call again.
  return this.pq.writable(function() {
    return self.end.apply(self, args);
  });
};
