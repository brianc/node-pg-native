var Readable = require('stream').Readable
var util = require('util')

var CopyToStream = module.exports = function(pq, options) {
  Readable.call(this, options);
  this.pq = pq;
  this._reading = false;
};

util.inherits(CopyToStream, Readable);

//var readStart = 0
CopyToStream.prototype._consumeBuffer = function(cb) {
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

CopyToStream.prototype._read = function(size) {
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
