const Service = require('node-windows').Service;

const svc = new Service({
  name: 'ClaudeSync',
  description: 'ClaudeSync Electron background service',
  script: 'C:\\path\\to\\your\\main.js'
});

svc.on('install', function() {
  svc.start();
});

svc.install();