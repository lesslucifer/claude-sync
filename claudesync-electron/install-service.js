const Service = require('node-windows').Service;

const svc = new Service({
  name: 'ClaudeSync',
  description: 'ClaudeSync Electron background service',
  script: `D:\\proj\\llm\\claude-sync\\claudesync-electron\\service.js`
});

svc.on('install', function() {
  svc.start();
});

svc.install();
// svc.uninstall();