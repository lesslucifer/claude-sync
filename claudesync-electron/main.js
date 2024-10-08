const { app, BrowserWindow, dialog, Tray, Menu } = require('electron');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const AutoLaunch = require('auto-launch');
const crypto = require('crypto');

let tray = null;
let backgroundWindow = null
let server = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
    return process.exit()
}

function initWindow() {
    backgroundWindow = new BrowserWindow({
        show: false,
        width: 0,
        height: 0,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    backgroundWindow.loadURL('about:blank');
    app?.setActivationPolicy?.('accessory')
}

async function forceFocus() {
    app?.setActivationPolicy?.('regular')
    backgroundWindow.setAlwaysOnTop(true);
    backgroundWindow?.focus({ steal: true })
    app.focus({ steal: true })
    setTimeout(() => {
        backgroundWindow.setAlwaysOnTop(false);
        app?.setActivationPolicy?.('accessory')
    }, 1000)
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'tray-icon.png')); // Make sure to add a tray icon image
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Focus', click: forceFocus
        },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('ClaudeSync');
    tray.setContextMenu(contextMenu);
    tray.on("double-click", forceFocus)
}

function setAppIcon() {
    const iconPath = path.join(__dirname, 'icon.png');
    app.dock?.setIcon(iconPath); // For macOS
    BrowserWindow.getAllWindows().forEach(win => win.setIcon(iconPath)); // For Windows and Linux
}

function setupAutoLaunch() {
    const autoLauncher = new AutoLaunch({
        name: 'ClaudeSync',
        path: app.getPath('exe'),
    });

    autoLauncher.isEnabled().then((isEnabled) => {
        if (!isEnabled) autoLauncher.enable();
    });
}

function runServer() {
    const expressApp = express();
    const port = 38451;

    const corsOptions = {
        origin: 'https://claude.ai',
        optionsSuccessStatus: 200
    };
    expressApp.use(cors(corsOptions));
    expressApp.use(express.json({ limit: '100mb' }));

    app?.setActivationPolicy?.('regular')
    expressApp.get('/open-file', async (req, res) => {
        try {
            app?.setActivationPolicy?.('regular')
            backgroundWindow.setAlwaysOnTop(true);
            backgroundWindow?.focus({ steal: true })
            app.focus({ steal: true })

            const isSingleFileOnly = ('singleFile' in req.query)

            const result = await dialog.showOpenDialog(backgroundWindow, {
                properties: [
                    'openFile',
                    ...(isSingleFileOnly ? [] : ['multiSelections'])
                ],
                defaultPath: req.query?.rootFolder ?? ''
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const filesData = await Promise.all(result.filePaths.map(async (filePath) => {
                    const fileName = path.basename(filePath);
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    return { filePath, fileName, fileContent };
                }));

                res.json(filesData);
            } else {
                res.status(400).json({ error: 'File selection was canceled' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
        finally {
            app?.setActivationPolicy?.('accessory')
            backgroundWindow.setAlwaysOnTop(false);
        }
    });

    expressApp.get('/read-file', async (req, res) => {
        try {
            const filePath = req.query.path;
            if (!filePath) {
                return res.status(400).json({ error: 'File path is required' });
            }

            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                res.json({ fileContent, exists: true });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    res.json({ exists: false });
                } else {
                    throw error;
                }
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    expressApp.post('/check-files', async (req, res) => {
        try {
            const files = req.body.files;
            const results = await Promise.all(files.map(async (file) => {
                try {
                    const stats = await fs.stat(file.path);
                    return {
                        id: file.id,
                        lastModified: stats.mtime.valueOf(),
                        exists: true
                    };
                } catch (error) {
                    return {
                        id: file.id,
                        exists: false
                    };
                }
            }));
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    expressApp.post('/verify-file-changes', async (req, res) => {
        try {
            const files = req.body.files;
            const results = await Promise.all(files.map(async (file) => {
                try {
                    const fileContent = await fs.readFile(file.path, 'utf-8');
                    const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
                    const hasChanged = currentHash !== file.contentHash;
                    return {
                        id: file.id,
                        hasChanged,
                        exists: true
                    };
                } catch (error) {
                    return {
                        id: file.id,
                        exists: false,
                        hasChanged: false
                    };
                }
            }));
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });


    expressApp.get('/select-workspace', async (req, res) => {
        try {
            app?.setActivationPolicy?.('regular')
            backgroundWindow?.focus({ steal: true })
            app.focus({ steal: true })
            const result = await dialog.showOpenDialog(backgroundWindow, {
                properties: ['openDirectory']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                res.json({ path: result.filePaths[0] });
            } else {
                res.status(400).json({ error: 'Workspace selection was canceled' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
        finally {
            app?.setActivationPolicy?.('accessory')
        }
    });

    expressApp.get('/open-workspace', (req, res) => {
        const { shell } = require('electron');
        const workspacePath = req.query.path;
        if (workspacePath) {
            shell.openPath(workspacePath);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Workspace path is required' });
        }
    });

    server = expressApp.listen(port, () => {
        console.log(`Express server running at http://localhost:${port}`);
    });
}

app.on('ready', () => {
    initWindow()
    createTray();
    setupAutoLaunch();
    runServer();
    setAppIcon()
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Prevent the app from quitting
});

app.on('quit', () => {
    if (server) {
        server.close();
    }
});

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (tray) {
        dialog.showMessageBox({
            type: 'info',
            title: 'ClaudeSync',
            message: 'ClaudeSync is already running.',
            buttons: ['OK']
        });
    }
});
