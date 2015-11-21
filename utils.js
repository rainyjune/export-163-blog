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