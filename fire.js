var utils = require('./utils.js');
var fs = require('fs');

var count = 0; // How many articles in the blog?
var pageSize = 10; // How many articles in each page? Defaults to 10.
var pages = 0; // How many pages are there in the blog?

var options = {
  hostname: 'aico77.blog.163.com',
  path: '/blog',
  encoding: 'GBK'
};

var countTextFile = './data/count.txt';

var countExp = /name\:\".+\"\,\s*count\:([0-9]+)\}\]/g;


utils.getHTML(options, function(res) {
  fs.exists(countTextFile, function (exists) {
    if(!exists) {
      var total = res.toString().match(countExp);
      if (total && total[0]) {
        var tmp = (total[0].match(/\,count\:([0-9]+)\}/));
        if (tmp && tmp[1]) {
          console.log('count', tmp[1]);
          count = tmp[1];
          pages = Math.ceil(tmp[1] / pageSize);
          fs.writeFile(countTextFile, tmp[1]);
          
          for ( var i = 0; i < pages; i++) {
            getArticlesByPage(i);
          }
        }
      }
    }
  });
}, function(e) {
  console.log('err:', e.message);
});

function getArticlesByPage(page) {
  utils.postData(page, function(res){
    console.log("post ok:", res);
    getBlogLinks(res);
  }, function(e) {
    console.log('post err:', e.message);
  });
}

function getBlogLinks(htmlString) {
  var pattern = /permalink\s*=\s*"blog\/static\/\d+";/g;
  var links =  htmlString.match(pattern);
  console.log('find match links:', links);
  
  links.forEach(function(item, index){
    getArticleByLink(item);
  });
}

function getArticleByLink(url) {
  var urlParts = url.match(/"(blog\/static\/\d+)";/);
  if (!urlParts || !urlParts[1]) return ;
  url = urlParts[1];
  var options = {
    hostname: 'aico77.blog.163.com',
    path: '/' + url,
    encoding: 'GBK'
  };
  console.log('url:', url);
  var blogId = url.split('/').pop();
  blogId = blogId.substring(0, blogId.length -2);
  console.log('blogId:', blogId);
  
  utils.getHTML(options, function(res) {
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
      console.log('saved：' + blogFile);
    });
  }, function(e) {
    console.log('err:', e.message);
  });
}