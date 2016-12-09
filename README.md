# export-163-blog

NetEase blog is dead in my opinion, even though they are still running this service now. The service has been in unstable state for a long time, it seems that most of their resources were handed over to lofter.com which I have no interest in. 

They do provide the export service, but it's not free. You have to be a VIP user and then can export your blog posts as HTML files.

That's why I created this project.

## How to use 

Clone this repository to your local machine:

```
git clone https://github.com/rainyjune/export-163-blog.git
```

Install all the required dependencies: 
```
cd export-163-blog
npm install
```

After the install finished, you can do the export process with the following command:

```
node fire.js <your-blog-name>
```

Please replace the `<your-blog-name>` with your own. For example, if your blog URL is `http://helloworld.blog.163.com`, your blog name should be `helloworld`.

It may take a while to fetch and save all your blog post to your local hardware, the duration various depending on the number of your posts. You can find these posts within the `data` directory in the same directory of `fire.js`.
