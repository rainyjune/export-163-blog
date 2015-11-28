var http = require('http'), url = require('url');
var zlib = require("zlib");
var iconv = require('iconv-lite'); // npm install iconv-lite

/**
 * Http Get Request.
 *
 *
 */
exports.get = function(options, successCallback, errorCallback) {
  http.get(options, function(res){
    var chunks = [];
    res.on('data', function (chunk) {
      chunks.push(chunk);
    });
    res.on('end', function() {
      // If the status code is not 200, call the errorCallback function.
      if (res.statusCode !== 200)  {
        errorCallback && errorCallback(new Error(res.statusMessage));
        return ;
      }
      // Convert from an encoded buffer to JavaScript string if needed.
      var decodedBody = options.encoding ? iconv.decode(Buffer.concat(chunks), options.encoding) : chunks.join(''); 
      successCallback && successCallback(decodedBody);
    });
  }).on('error', errorCallback);
};

/**
 * @param {object} options: { hostname: '', path: '', data: {}, cookie: "", "encoding": "" }
 *
 * @TODO parameter validation.
 */
exports.post = function(options, successCallback, errorCallback) {
  var postData = JSON.stringify(options.data);
  var defaultOption = {
    method: 'POST',
    headers: {
      'Content-Length': postData.length
    }
  };
  var mergedOptions = merge(defaultOption, options);
  var req = http.request(mergedOptions, function(res) {
    console.log('STATUS: ' + res.statusCode, 'HEADERS: ' + JSON.stringify(res.headers));
    //res.setEncoding('utf8');
    var chunks = [];
    res.on('data', function (chunk) {
      //console.log('BODY: ' + chunk);
      chunks.push(chunk);
    });
    res.on('end', function() {
      successCallback && successCallback(chunks.join(''));
    })
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    errorCallback && errorCallback(e.message);
  });

  // write data to request body
  req.write(postData);
  req.end();
};

exports.postData = function(opts, callback, errCallback) {
  var postData = {
    callCount: 1,
    scriptSessionId: "${scriptSessionId}187",
    "c0-scriptName": "BlogBeanNew",
    "c0-methodName": "getBlogs",
    "c0-id": 0,
    "c0-param0": "number:171396050",
    "c0-param1": "number:" + 10 * opts.page,
    "c0-param2": "number:10",
    "batchId": 307850
  };
  
  var postDataArr = [];
  for (var prop in postData) {
    postDataArr.push(new String(prop) + '=' + postData[prop]);
  }
  
  var postDataStr = postDataArr.join('\n');

  var options = {
    hostname: opts.hostname,
    path: opts.path,
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',
      'Referer': 'http://api.blog.163.com/crossdomain.html?t=20100205',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4,zh-TW;q=0.2,es;q=0.2',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Host': 'api.blog.163.com',
      'Origin': 'http://api.blog.163.com',
      'Pragma': 'no-cache',
      'Content-Type': 'text/plain',
      'Content-Length': postDataStr.length
    }
  };

  var req = http.request(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));

    var chunks = [];
    
    // pipe the response into the gunzip to decompress
    var gunzip = zlib.createGunzip();            
    res.pipe(gunzip);

    gunzip.on('data', function (chunk) {
      // decompression chunk ready, add it to the buffer
      chunks.push(chunk.toString());
    });
    gunzip.on('end', function() {
      callback && callback(chunks.join(''));
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    errCallback && errCallback(e);
  });
  
  // write data to request body
  req.write(postDataStr);
  req.end();
};

/**
 * Merge multiple objects dynamically with modifying either arguments.
 * Inspired by http://stackoverflow.com/questions/171251#16178864
 * @example merge(obj1, obj2, ....);
 * @return {object} The merged object.
 */
function merge() {
  var result = {}, 
      src, 
      prop, 
      args = getArgumentsArray(arguments),
      toString = Object.prototype.toString;
      
  while (args.length > 0) {
    src = args.shift();
    if (toString.call(src) === "[object Object]") {
      for (prop in src) {
        if (src.hasOwnProperty(prop)) {
          if (toString.call(src[prop]) == '[object Object]') {
            result[prop] = cp(result[prop] || {}, src[prop]);
          } else {
            result[prop] = src[prop];
          }
        }
      }
    }
  }
  return result;
}

/**
 *
 * Convert function arguments to an array.
 * The arguments object can be converted to a real Array by using:
 * var args = Array.prototype.slice.call(arguments);
 * But it prevents optimizations in JavaScript engines(V8 for example).
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
 * @param {object} arguments The Array-like object.
 * @return {array}
 */
function getArgumentsArray(arguments) {
  var result = [],
      len = arguments.length,
      i;
  for (i = 0; i < len; i++) {
    result.push(arguments[i]);
  }
  return result;
}