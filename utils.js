var http = require('http'), https = require('https'), url = require('url');
var zlib = require("zlib");
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

exports.postData = function(page, callback, errCallback) {
  var postData = {
    callCount: 1,
    scriptSessionId: "${scriptSessionId}187",
    "c0-scriptName": "BlogBeanNew",
    "c0-methodName": "getBlogs",
    "c0-id": 0,
    "c0-param0": "number:171396050",
    "c0-param1": "number:" + 10 * page,
    "c0-param2": "number:10",
    "batchId": 307850
  };
  
  var postDataArr = [];
  for (var prop in postData) {
    postDataArr.push(new String(prop) + '=' + postData[prop]);
  }
  
  var postDataStr = postDataArr.join('\n');

  var options = {
    hostname: 'api.blog.163.com',
    port: 80,
    path: '/aico77/dwr/call/plaincall/BlogBeanNew.getBlogs.dwr',
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
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));

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