const { spawn, fork } = require('node:child_process')
const path = require('path')

fork(path.join(process.cwd(), "node_modules", "electron", "cli.js"), ["."], {
    shell: true,
    detached: true,
    windowsHide: false
}).unref()

process.exit()