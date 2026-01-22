const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let selectionWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 820,
    minWidth: 340,
    minHeight: 650,
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
    transparent: true,
    backgroundColor: '#ffffff00'
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

// Handle getting all displays for selection
ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map(display => ({
    id: display.id,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor
  }));
});

// Handle opening selection overlay window
ipcMain.handle('open-selection-window', async () => {
  return new Promise((resolve) => {
    // Get the combined bounds of all displays
    const displays = screen.getAllDisplays();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    displays.forEach(display => {
      minX = Math.min(minX, display.bounds.x);
      minY = Math.min(minY, display.bounds.y);
      maxX = Math.max(maxX, display.bounds.x + display.bounds.width);
      maxY = Math.max(maxY, display.bounds.y + display.bounds.height);
    });

    selectionWindow = new BrowserWindow({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    selectionWindow.loadFile('selection.html');
    selectionWindow.setVisibleOnAllWorkspaces(true);

    // Listen for selection result
    ipcMain.once('selection-complete', (event, selection) => {
      if (selectionWindow) {
        selectionWindow.close();
        selectionWindow = null;
      }
      resolve(selection);
    });

    ipcMain.once('selection-cancelled', () => {
      if (selectionWindow) {
        selectionWindow.close();
        selectionWindow = null;
      }
      resolve(null);
    });
  });
});
