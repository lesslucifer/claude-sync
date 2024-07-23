const { spawn, fork } = require('node:child_process')
const path = require('path')

fork(path.join(process.cwd(), "node_modules", "electron", "cli.js"), ["."], {
    shell: false,
    detached: true,
    windowsHide: false,
    stdio: 'ignore'
}).unref()

process.exit()