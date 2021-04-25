const connect = require('connect');
const path = require('path');
const serveStatic = require('serve-static');
const open = require('open');
const port = 8080;

connect()
  .use(serveStatic(path.join(__dirname, '../')))
  .use(serveStatic(path.join(__dirname, '../dist')))
  .listen(port, function () {
    console.log('dir is ', path.join(__dirname, '../'));
    console.log(`Listing on http://localhost:${port}`);
    open(`http://localhost:${port}`);
  });
