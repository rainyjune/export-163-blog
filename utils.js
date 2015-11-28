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

    if (!mergedOptions.encoding || mergedOptions.encoding === "utf8") {
      res.setEncoding('utf8');
    }
    
    var resObj = res;
    switch (res.headers['content-encoding']) {
      case 'gzip':
        var gunzip = zlib.createGunzip();    
        res.pipe(gunzip);
        resObj = gunzip;
        break;
      case 'deflate':
        var inflat = zlib.createInflate();
        res.pipe(inflat);
        resObj = inflat;
        break;
      default:
        break;
    }
  
    var chunks = [];
    
    resObj.on('data', function (chunk) {
      chunks.push(chunk);
    });
    resObj.on('end', function() {
      successCallback && successCallback(chunks.join(''));
    })
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    errorCallback && errorCallback(e.message);
  });

  // write data to request body
  req.write(options.dataString || postData);
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
            result[prop] = merge(result[prop] || {}, src[prop]);
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