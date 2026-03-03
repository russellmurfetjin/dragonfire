const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Dragon Fire Puzzle');

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  const windowOpts = {
    width: 900,
    height: 700,
    backgroundColor: '#1a1a2e',
    title: 'Dragon Fire Puzzle',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  };
  if (fs.existsSync(iconPath)) {
    windowOpts.icon = iconPath;
  }
  mainWindow = new BrowserWindow(windowOpts);

  // Set dock icon on macOS
  if (process.platform === 'darwin' && fs.existsSync(iconPath)) {
    app.dock.setIcon(iconPath);
  }

  mainWindow.loadFile('index.html');

  // Build application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Campaign',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.loadFile('game.html')
        },
        {
          label: 'Custom Campaigns',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.loadURL('file://' + path.join(__dirname, 'game.html') + '?mode=custom')
        },
        {
          label: 'Level Editor',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.loadFile('editor.html')
        },
        {
          label: 'Main Menu',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow.loadFile('index.html')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { role: 'reload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' }
      ]
    }
  ];

  // macOS gets an app-name menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'Dragon Fire Puzzle',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createWindow();

  // Auto-reload when HTML files change (dev mode only)
  if (!app.isPackaged) {
    let reloadTimeout = null;
    ['index.html', 'game.html', 'editor.html'].forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.watch(filePath, () => {
          if (reloadTimeout) clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
          }, 300);
        });
      }
    });
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
