const { exec } = require('node:child_process')
const path = require('path')

exec(path.join(process.cwd(), "node_modules", ".bin", "electron.cmd") + " .")