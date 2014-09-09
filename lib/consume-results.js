var consumeResults = module.exports = function(pq, cb) {

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
    if(pq.getResult() && pq.resultStatus() != 'PGRES_COPY_OUT') {
      return readError('Only one result at a time is accepted');
    }

    if(pq.resultStatus() == 'PGRES_FATAL_ERROR') {
      return readError();
    }

    cleanup();
    return cb(null);
  };
  pq.on('readable', onReadable);
  pq.startReader();
};

