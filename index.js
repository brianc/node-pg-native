var Libpq = require('libpq');

var Client = module.exports = function(types) {
  if(!types) {
    var pgTypes = require('pg-types')
    types = pgTypes.getTypeParser.bind(pgTypes)
  }
  if(!(this instanceof Client)) {
    return new Client(types);
  }
  this.pq = new Libpq();
  this.types = types;
};

Client.prototype.connect = function(params, cb) {
  this.pq.connect(params, cb);
};

Client.prototype.connectSync = function(params) {
  this.pq.connectSync(params);
};

Client.prototype.end = function(cb) {
  this.pq.finish();
  if(cb) setImmediate(cb);
};

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

var consumeResults = function(pq, cb) {
  var cleanup = function() {
    pq.removeListener('readable', onReadable);
    pq.stopReader();
  }

  var readError = function(message) {
    cleanup();
    return cb(new Error(message || pq.errorMessage()));
  };

  var onReadable = function() {
    //read waiting data from the socket
    //e.g. clear the pending 'select'
    if(!pq.consumeInput()) {
      return readError();
    }
    //check if there is still outstanding data
    //if so, wait for it all to come in
    if(pq.isBusy()) {
      return;
    }
    //load our result object
    pq.getResult();

    //"read until results return null"
    //or in our case ensure we only have one result
    if(pq.getResult()) {
      return readError('Only one result at a time is accepted');
    }
    cleanup();
    return cb(null);
  };
  pq.on('readable', onReadable);
  pq.startReader();
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

Client.prototype.querySync = function(text, values) {
  var queryFn;
  var pq = this.pq;
  pq[values ? 'execParams' : 'exec'].call(pq, text, values);
  var success = !pq.errorMessage();
  if(!success) {
    throw new Error(pq.resultErrorMessage());
  }
  return mapResults(pq, this.types);
};
