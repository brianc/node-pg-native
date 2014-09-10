var Libpq = require('libpq');
var consumeResults = require('./lib/consume-results');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Client = module.exports = function(types) {
  EventEmitter.call(this);
  if(!types) {
    var pgTypes = require('pg-types')
    types = pgTypes.getTypeParser.bind(pgTypes)
  }
  if(!(this instanceof Client)) {
    return new Client(types);
  }
  this.pq = new Libpq();
  this.types = types;
  var self = this;
  this.on('newListener', function(event) {
    self.pq.startReader();
    self.pq.once('readable', function() {
      self.pq.consumeInput();
      var notice;
      while(notice = self.pq.notifies()) {
        self.emit('notification', notice);
      }
    });
  });
};

util.inherits(Client, EventEmitter);

Client.prototype.connect = function(params, cb) {
  this.pq.connect(params, cb);
};

Client.prototype.connectSync = function(params) {
  this.pq.connectSync(params);
};

Client.prototype.end = function(cb) {
  this.pq.stopReader();
  this.pq.finish();
  if(cb) setImmediate(cb);
};

var throwIfError = function(pq) {
  var err = pq.resultErrorMessage() || pq.errorMessage();
  if(err) {
    throw new Error(err);
  }
}

var mapResults = function(pq, types) {
  var rows = [];
  var rowCount = pq.ntuples();
  var colCount = pq.nfields();
  for(var i = 0; i < rowCount; i++) {
    var row = {};
    rows.push(row);
    for(var j = 0; j < colCount; j++) {
      var rawValue = pq.getvalue(i, j);
      var value = rawValue;
      if(rawValue == '') {
        if(pq.getisnull()) {
          value = null;
        }
      } else {
        value = types(pq.ftype(j))(rawValue);
      }
      row[pq.fname(j)] = value;
    }
  }
  return rows;
};

var waitForDrain = function(pq, cb) {
  var res = pq.flush();
  if(res === 0) return cb();
  if(res === -1) return cb(pq.errorMessage());
  return pq.writable(function() {
    waitForDrain(pq, cb);
  });
};

var dispatchQuery = function(pq, fn, cb) {
  var success = pq.setNonBlocking(true);
  if(!success) return cb(new Error('Unable to set non-blocking to true'));
  var sent = fn();
  if(!sent) return cb(new Error(pq.errorMessage()));
  return waitForDrain(pq, cb);
};

Client.prototype.query = function(text, values, cb) {
  var queryFn;
  var pq = this.pq
  var types = this.types
  if(typeof values == 'function') {
    cb = values;
    queryFn = pq.sendQuery.bind(pq, text);
  } else {
    queryFn = pq.sendQueryParams.bind(pq, text, values);
  }

  dispatchQuery(pq, queryFn, function(err) {
    if(err) return cb(err);
    consumeResults(pq, function(err) {
      return cb(err, err ? null : mapResults(pq, types));
    });
  });
};

Client.prototype.prepare = function(statementName, text, nParams, cb) {
  var pq = this.pq;
  var fn = pq.sendPrepare.bind(pq, statementName, text, nParams);
  dispatchQuery(pq, fn, function(err) {
    if(err) return cb(err);
    consumeResults(pq, cb);
  });
};

Client.prototype.execute = function(statementName, parameters, cb) {
  var pq = this.pq;
  var types = this.types;
  var fn = pq.sendQueryPrepared.bind(pq, statementName, parameters);
  dispatchQuery(pq, fn, function(err, rows) {
    if(err) return cb(err);
    consumeResults(pq, function(err) {
      return cb(err, err ? null : mapResults(pq, types));
    });
  });
};

var CopyFromStream = require('./lib/copy-from-stream');
Client.prototype.getCopyFromStream = function() {
  this.pq.setNonBlocking(true);
  return new CopyFromStream(this.pq);
};

var CopyToStream = require('./lib/copy-to-stream');
Client.prototype.getCopyToStream = function() {
  this.pq.setNonBlocking(true);
  return new CopyToStream(this.pq);
};

Client.prototype.querySync = function(text, values) {
  var queryFn;
  var pq = this.pq;
  pq[values ? 'execParams' : 'exec'].call(pq, text, values);
  throwIfError(this.pq);
  return mapResults(pq, this.types);
};

Client.prototype.prepareSync = function(statementName, text, nParams) {
  this.pq.prepare(statementName, text, nParams);
  throwIfError(this.pq);
};

Client.prototype.executeSync = function(statementName, parameters) {
  this.pq.execPrepared(statementName, parameters);
  throwIfError(this.pq);
  return mapResults(this.pq, this.types);
};
