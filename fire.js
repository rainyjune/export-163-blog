var utils = require('./utils.js');
var fs = require('fs');

var count = 0; // How many articles in the blog?
var pageSize = 10; // How many articles in each page? Defaults to 10.
var pages = 0; // How many pages are there in the blog?

if (!process.argv[2]) {
  console.error("Blog name must be passed.");
  return ;
}

// TODO : verification the blog name.
var userId;
var hostname = '{username}.blog.163.com'.replace('{username}', process.argv[2]);
var apiURL = 'api.blog.163.com';
var apiGetBlogPath = '/{username}/dwr/call/plaincall/BlogBeanNew.getBlogs.dwr'.replace('{username}', process.argv[2]);
var overviewFile = './data/overview.json';
var authorFile = './data/author.json';

// Step 1: Get overview data.
utils.get({ hostname: hostname, path: '/blog', encoding: 'GBK' }, function(res) {
  var overviewExp = /<textarea name="js">([^<]+)<\/textarea>/;
  var overviewMatch = res.match(overviewExp);
  if (!overviewMatch || !overviewMatch[1]) {
    console.warn("No overview data found. exit.");
    return;
  }
  var overviewObj = {};
  eval(overviewMatch[1].trim().replace("this.p", "overviewObj"));
  //console.log('overviewObj:', overviewObj);
  
  var authorObj = {};
  var authorExp = /UD\.host\s*=\s*({([^;])+)/;
  var authorMatch = res.match(authorExp);
  console.log("authorMatch:", authorMatch[1]);
  
  if (!authorMatch || !authorMatch[1]) {
    console.error("Could not get the author's information.");
    return;
  }
  eval("authorObj=" + authorMatch[1].trim());
  userId = authorObj.userId;
  
  count = overviewObj.c.map(function(category){
      return category.count;
    }).reduce(function(a, b) {
      return a + b;
  });
  console.log('Blog posts:', count);
  
  pages = Math.ceil(count / pageSize);

  for ( var i = 0; i < pages; i++) {
    getArticlesByPage(i);
  }
  
  fs.exists(overviewFile, function (exists) {
    if(!exists) {
      fs.writeFile(overviewFile, JSON.stringify(overviewObj));
    }
  });
  
  fs.exists(authorFile, function (exists) {
    if(!exists) {
      fs.writeFile(authorFile, JSON.stringify(authorObj));
    }
  });
}, function(e) {
  console.log('Get url ['+ hostname + '/blog] err:', e.message);
});

/**
 *
 * @param {number} page The page index, zero based. 
 */
function getArticlesByPage(pageIndex) {
  var postData = {
    callCount: 1,
    scriptSessionId: "${scriptSessionId}187",
    "c0-scriptName": "BlogBeanNew",
    "c0-methodName": "getBlogs",
    "c0-id": 0,
    "c0-param0": "number:" + userId,
    "c0-param1": "number:" + (pageIndex ? 10 * (pageIndex + 1) : 0),
    "c0-param2": "number:10",
    "batchId": 307850
  };
  var postDataArr = [];
  for (var prop in postData) {
    postDataArr.push(new String(prop) + '=' + postData[prop]);
  }
  var postDataStr = postDataArr.join('\n');
  
  utils.post({
    hostname: hostname,
    path: apiGetBlogPath,
    encoding: 'GBK',
    data: postData,
    dataString: postDataStr,
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
  }, function(res){
    //console.log("post ok:", res);
    getBlogLinks(res, postData);
  }, function(e) {
    console.log('post err:', e.message);
  });
}

function getBlogLinks(htmlString, postData) {
  var pattern = /permalink\s*=\s*"blog\/static\/\d+";/g;
  var links =  htmlString.match(pattern);
  //console.log('find match links:', links);
  //return;
  if (!links) {
    console.warn("Links not found.", postData);
    return ;
  }
  links.forEach(function(item, index){
    getArticleByLink(item);
  });
}

function getArticleByLink(url) {
  var urlParts = url.match(/"(blog\/static\/\d+)";/);
  if (!urlParts || !urlParts[1]) return ;
  url = urlParts[1];
  var options = {
    hostname: hostname,
    path: '/' + url,
    encoding: 'GBK'
  };
  //console.log('url:', url);
  var blogId = url.split('/').pop();
  blogId = blogId.substring(0, blogId.length -2);
  //console.log('blogId:', blogId);
  
  utils.get(options, function(res) {
    var articleObj = {};
    var t1 = res.split('<textarea name="js">')[1];
    if( !t1) {
      console.log('t1 undefined:', url);
      return;
    }
    var t2 = t1.split('</textarea>')[0].trim(),
        t3 = t2.substring(7);
        
    eval('articleObj = ' + t3);
    var blogFile = './data/' + articleObj.publishTime + '.json';
    
    fs.writeFile(blogFile, JSON.stringify(articleObj), function(err) {
      if (err) throw err;
      //console.log('saved：' + blogFile);
    });
  }, function(e) {
    console.log('err:', e.message, ' url:', hostname + '/' + url);
  });
}