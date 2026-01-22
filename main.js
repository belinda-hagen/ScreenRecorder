const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 760,
    minWidth: 340,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Screen Recorder',
    resizable: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('index.html');
}

// Window control handlers
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle getting screen sources
ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 150, height: 150 }
    });
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

// Handle saving the recorded video
ipcMain.handle('save-video', async (event, buffer) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Recording',
      defaultPath: `screen-recording-${Date.now()}.webm`,
      filters: [
        { name: 'WebM Video', extensions: ['webm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving video:', error);
    return { success: false, error: error.message };
  }
});

// Handle opening external URLs
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});
