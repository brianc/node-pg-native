#node-pg-native

[![Build Status](https://travis-ci.org/brianc/node-pg-native.svg?branch=master)](https://travis-ci.org/brianc/node-pg-native)

High performance, native bindings between node.js and PostgreSQL via [libpq](https://github.com/brianc/node-libpq) with a clean and modern interface.

## install

```bash
$ npm i pg-native
```

## use

### async

Please note the following code uses no [async flow control](https://github.com/caolan/async), [promise](https://github.com/kriskowal/q), or [generator](https://github.com/visionmedia/co) modules to make the _callback hell_ go away. I figure this is more straight-forward as an example but _in general_ you probably want to use one of the aforementioned approaches in production.

```js
var Client = require('pg-native')

var client = new Client();
client.connect(function(err) {
  if(err) throw err

  //text queries
  client.query('SELECT NOW() AS the_date', function(err, rows) {
    if(err) throw err

    console.log(rows[0].the_date) //Tue Sep 16 2014 23:42:39 GMT-0400 (EDT)

    //parameterized statements
    client.query('SELECT $1::text as twitter_handle', ['@briancarlson'], function(err, rows) {
      if(err) throw err

      console.log(rows[0].twitter_handle) //@briancarlson
    })

    //prepared statements
    client.prepare('get_twitter', 'SELECT $1::text as twitter_handle', 1, function(err) {
      if(err) throw err

      //execute the prepared, named statement
      client.execute('get_twitter', ['@briancarlson'], function(err, rows) {
        if(err) throw err

        console.log(rows[0].twitter_handle) //@briancarlson

        //execute the prepared, named statement again
        client.execute('get_twitter', ['@realcarrotfacts'], function(err, rows) {
          if(err) throw err

          console.log(rows[0].twitter_handle) //@realcarrotfacts
          
          client.end(function() {
            console.log('ended');
          })
        })
      })
    })
  })
})

```

### sync

Because `pg-native` is bound to [libpq](https://github.com/brianc/node-libpq) it is able to provide _sync_ operations for both connection and queries. This is exteremly convienent sometimes.

```js
var Client = require('pg-native')

var client = new Client();
client.connectSync();

//text queries
var rows = client.query('SELECT NOW() AS the_date')
console.log(rows[0].the_date) //Tue Sep 16 2014 23:42:39 GMT-0400 (EDT)

//parameterized queries
var rows = client.query('SELECT $1::text as twitter_handle', ['@briancarlson'])
console.log(rows[0].twitter_handle) //@briancarlson

//prepared statements
client.prepare('get_twitter', 'SELECT $1::text as twitter_handle', 1)

var rows = client.execute('get_twitter', ['@briancarlson'])
console.log(rows[0].twitter_handle) //@briancarlson

var rows = client.execute('get_twitter', ['@realcarrotfacts'])
console.log(rows[0].twitter_handle) //@realcarrotfacts
```

## api

#### `constructor Client()`

Constructs and returns a new `Client` instance

### async functions

##### `client.connect(<params:string>, callback:function(err:Error))`

Connect to a PostgreSQL backend server. Params is in any format accepted by [libpq](http://www.postgresql.org/docs/9.3/static/libpq-connect.html#LIBPQ-CONNSTRING).  Returns an `Error` to the `callback` if the connection was unsuccessful.  `callback` is _required_ but `params` is optional.

##### `client.query(queryText:string, <values:string[]>, callback:Function(err:Error, rows:Object[]))`

Execute a query with the text of `queryText` and _optional_ parameters specified in the `values` array. All values are passed to the PostgreSQL backend server and executed as a parameterized statement.  The callback is _required_ and is called with an `Error` object in the event of a query error, otherwise it is passed an array of result objects.  Each element in this array is a dictionary of results with keys for column names and their values as the values for those columns.


##### `client.prepare(statementName:string, queryText:string, nParams:int, callback:Function(err:Error))`

Prepares a _named statement_ for later execution.  You _must_ supply the name of the statement via `statementName`, the command to prepare via `queryText` and the number of parameters in `queryText` via `nParams`. Calls the callback with an `Error` if there was an error.

##### `client.execute(statementName:string, <values:string[]>, callback:Function(err:err, rows:Object[]))`

Executes a previously prepared statement on this client with the name of `statementName`, passing it the optional array of query parameters as a `values` array.  The `callback` is mandatory and is called with and `Error` if the execution failed, or with the same array of results as would be passed to the callback of a `client.query` result.

### sync functions

##### `client.connectSync(params:string)`

Connect to a PostgreSQL backend server. Params is in any format accepted by [libpq](http://www.postgresql.org/docs/9.3/static/libpq-connect.html#LIBPQ-CONNSTRING).  Throws an `Error` if the connection was unsuccessful.

##### `client.querySync(queryText:string, <values:string[]>) -> results:Object[]`

Executes a query with a text of `queryText` and optional parameters as `values`. Uses a parameterized query if `values` are supplied.  Throws an `Error` if the query fails, otherwise returns an array of results.

##### `client.prepareSync(statementName:string, queryText:string, nParams:int)`

Prepares a name statement with name of `statementName` and a query text of `queryText`. You must specify the number of params in the query with the `nParams` argument.  Throws an `Error` if the statement is un-preparable, otherwise returns an array of results.

##### `client.executeSync(statementName:string, <values:string[]>) -> results:Object[]`

Executes a previously prepared statement on this client with the name of `statementName`, passing it the optional array of query paramters as a `values` array.  Throws an `Error` if the execution fails, otherwas returns an array of results.

##### `client.end(<callback:Function()>`

Ends the connection. Calls the _optional_ callback when the connection is terminated.

## license

The MIT License (MIT)

Copyright (c) 2014 Brian M. Carlson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
