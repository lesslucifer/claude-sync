const { app, BrowserWindow, dialog, Tray, Menu } = require('electron');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const AutoLaunch = require('auto-launch');

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

function createTray() {
    tray = new Tray(path.join(__dirname, 'tray-icon.png')); // Make sure to add a tray icon image
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open', click: async () => {
                try {
                    app?.setActivationPolicy?.('regular')
                    backgroundWindow?.focus({ steal: true })
                    app.focus({ steal: true })
                    await dialog.showOpenDialog(backgroundWindow, {
                        properties: ['openFile']
                    }).catch();
                }
                finally {
                    app?.setActivationPolicy?.('accessory')
                }
            }
        },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('ClaudeSync');
    tray.setContextMenu(contextMenu);
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
    expressApp.use(express.json());

    let openFileCounter = 1;
    app?.setActivationPolicy?.('regular')
    expressApp.get('/open-file', async (req, res) => {
        try {
            console.log(`[Start] Open file`, openFileCounter);
            app?.setActivationPolicy?.('regular')
            backgroundWindow?.focus({ steal: true })
            app.focus({ steal: true })
            const result = await dialog.showOpenDialog(backgroundWindow, {
                properties: ['openFile']
            });
            console.log(`[End] Open file`, openFileCounter++);

            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                const fileName = path.basename(filePath);
                const fileContent = await fs.readFile(filePath, 'utf-8');

                res.json({
                    filePath,
                    fileName,
                    fileContent
                });
            } else {
                res.status(400).json({ error: 'File selection was canceled' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
        finally {
            app?.setActivationPolicy?.('accessory')
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