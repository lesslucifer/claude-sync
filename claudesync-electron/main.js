const { app, BrowserWindow, dialog } = require('electron');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

let backgroundWindow;

function createBackgroundWindow() {
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
}

function hideFromDock() {
    if (process.platform === 'darwin') {
        app.setActivationPolicy('accessory');
    }
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

    expressApp.get('/open-file', async (req, res) => {
        try {
            app?.setActivationPolicy?.('regular')
            const result = await dialog.showOpenDialog(backgroundWindow, {
                properties: ['openFile']
            });

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

    expressApp.listen(port, () => {
        console.log(`Express server running at http://localhost:${port}`);
    });
}

app.whenReady().then(() => {
    hideFromDock(); 
    createBackgroundWindow();
    runServer();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});