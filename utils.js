var http = require('http'), https = require('https'), url = require('url');
var iconv = require('iconv-lite'); // npm install iconv-lite
 
/**
 * Parse options 
 * @param  options
 * @return object
 */
function parseOptions(options) {
  var result = {protocol: 'http:', options: {}, encoding: 'utf8'};
  if (typeof options == "string") {
    result.options = options;
    var urlComponent = url.parse(options);
    result.protocol = urlComponent.protocol; 
  } else if (typeof options == "object") {
    result.options = options;
    if (options.encoding && typeof options.encoding == "string") {
      result.encoding = options.encoding;  
    }
    if (options.url && typeof options.url == "string") {
      result.options = url.parse(options.url);
    }
    if (result.options.protocol) {
      result.protocol = result.options.protocol;
    }
  }
  return result;
}
exports.getHTML = function(options, callback, errCallback) {
  var options = parseOptions(options);
  var protocol = options.protocol == 'http:' ? http : https;

  protocol.get(options.options, function(res) {
    console.log("Got response: " + res.statusCode);
    var chunks = [];
    res.on('data', function (chunk) {
      chunks.push(chunk);
    });
    res.on('end', function() {
      var decodedBody = iconv.decode(Buffer.concat(chunks), options.encoding); // Convert from an encoded buffer to JavaScript string.
      callback && callback(decodedBody);
    });
    
  }).on('error', function(e) {
    console.log("Got error:" + e.message); 
    errCallback && errCallback(e);
  });
};

exports.postData = function(options1, callback, errCallback) {
  var postData = {
    callCount: 1,
    scriptSessionId: "${scriptSessionId}187",
    "c0-scriptName": "BlogBeanNew",
    "c0-methodName": "getBlogs",
    "c0-id": 0,
    "c0-param0": "number:171396050",
    "c0-param1": "number:20",
    "c0-param2": "number:10",
    "batchId": 816385
  };
  var postString = JSON.stringify(postData);

  var options = {
    hostname: 'api.blog.163.com',
    port: 80,
    path: '/aico77/dwr/call/plaincall/BlogBeanNew.getBlogs.dwr',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': postString.length
    }
  };

  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    var chunks = [];
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
      chunks.push(chunk);
    });
    res.on('end', function() {
      callback && callback(chunks);
      console.log('No more data in response.')
    })
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    errCallback && errCallback(e);
  });
  
  // write data to request body
  req.write(postString);
  req.end();

};