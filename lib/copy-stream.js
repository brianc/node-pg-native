var Duplex = require('stream').Duplex;
var Writable = require('stream').Writable;
var util = require('util');
var consumeResults = require('./consume-results');

var CopyStream = module.exports = function(pq, options) {
  Duplex.call(this, options);
  this.pq = pq;
  this._reading = false;
};

util.inherits(CopyStream, Duplex);

var count = 0;
CopyStream.prototype._write = function(chunk, encoding, cb) {
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

CopyStream.prototype.end = function() {
  var args = arguments;
  var self = this;

  if((args||0).length && (typeof args[0] != 'function')) {
    this.write(args[0]);
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
      var cb = args[args.length - 1];
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

//reader functions
CopyStream.prototype._consumeBuffer = function(cb) {
  var result = this.pq.getCopyData(true);
  //console.log('read result:', result);
  if(util.isBuffer(result)) {
    //readStart = 0;
    return setImmediate(function() {
      cb(null, result);
    })
  }
  if(result === -1) {
    //end of stream
    return cb(null, null);
  }
  if(result === 0) {
    var self = this;
    //console.log('wait for input')
    this.pq.once('readable', function() {
      self.pq.stopReader();
      self.pq.consumeInput();
      //readStart++;
      //if(readStart > 3) {
        //throw new Error('dead')
      //}
      //console.log('readable')
      self._consumeBuffer(cb);
    });
    return this.pq.startReader();
  }
  cb(new Error('Unrecognized read status: ' + result))
};

CopyStream.prototype._read = function(size) {
  if(this._reading) return;
  this._reading = true;
  //console.log('read begin');
  var self = this
  this._consumeBuffer(function(err, buffer) {
    self._reading = false;
    if(err) {
      return self.emit('error', err)
    }
    if(buffer === false) {
      //nothing to read for now, return
      return;
    }
    self.push(buffer);
  });
};
