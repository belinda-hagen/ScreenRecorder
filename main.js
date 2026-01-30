const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Get ffmpeg path - try bundled first, then system
let ffmpegPath;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  // Fallback to system ffmpeg
  ffmpegPath = 'ffmpeg';
}

let mainWindow;
let selectionWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 820,
    minWidth: 800,
    minHeight: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'build', 'icons', 'icon.ico'),
    title: 'Screen Recorder',
    resizable: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0e27'
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
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id // Include display_id for matching with displays
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

// Handle saving the recorded video
ipcMain.handle('save-video', async (event, buffer, format = 'webm') => {
  try {
    const formatExtensions = {
      'webm': 'webm',
      'mp4': 'mp4',
      'mkv': 'mkv',
      'avi': 'avi',
      'mov': 'mov'
    };

    const ext = formatExtensions[format] || 'webm';
    
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Recording',
      defaultPath: `screen-recording-${Date.now()}.${ext}`,
      filters: [
        { name: `${ext.toUpperCase()} Video`, extensions: [ext] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // If format is webm, save directly
    if (format === 'webm') {
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return { success: true, filePath };
    }

    // For other formats, need to convert using ffmpeg
    // Save webm to temp file first
    const tempPath = path.join(app.getPath('temp'), `temp-recording-${Date.now()}.webm`);
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Convert using ffmpeg
    return new Promise((resolve) => {
      const args = [
        '-i', tempPath,
        '-y', // Overwrite output file if exists
      ];

      // Format-specific encoding options
      switch (format) {
        case 'mp4':
          // Add video filter to ensure dimensions are divisible by 2 (required by H.264)
          args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2');
          args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22');
          args.push('-c:a', 'aac', '-b:a', '128k');
          args.push('-movflags', '+faststart');
          break;
        case 'mkv':
          args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2');
          args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22');
          args.push('-c:a', 'aac', '-b:a', '128k');
          break;
        case 'avi':
          args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2');
          args.push('-c:v', 'libxvid', '-qscale:v', '4');
          args.push('-c:a', 'libmp3lame', '-b:a', '128k');
          break;
        case 'mov':
          args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2');
          args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22');
          args.push('-c:a', 'aac', '-b:a', '128k');
          break;
      }

      args.push(filePath);

      const ffmpeg = spawn(ffmpegPath, args);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }

        if (code === 0) {
          resolve({ success: true, filePath });
        } else {
          console.error('FFmpeg error:', errorOutput);
          resolve({ success: false, error: `Conversion failed (code ${code})` });
        }
      });

      ffmpeg.on('error', (err) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
        console.error('FFmpeg spawn error:', err);
        resolve({ success: false, error: 'FFmpeg not available. Please install FFmpeg or use WebM format.' });
      });
    });
  } catch (error) {
    console.error('Error saving video:', error);
    return { success: false, error: error.message };
  }
});

// Check if ffmpeg is available
ipcMain.handle('check-ffmpeg', async () => {
  return new Promise((resolve) => {
    const ffmpeg = spawn(ffmpegPath, ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
});

// Handle opening external URLs
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

// Handle getting all displays for selection
ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  return displays.map(display => ({
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    size: display.size,
    workAreaSize: display.workAreaSize,
    rotation: display.rotation,
    isPrimary: display.id === primaryDisplay.id
  }));
});

// Handle opening selection overlay window
ipcMain.handle('open-selection-window', async (event, displayId, useFixedSize = true) => {
  return new Promise((resolve) => {
    const displays = screen.getAllDisplays();
    let targetDisplay;
    
    if (displayId !== undefined && displayId !== null) {
      // Find the specific display
      targetDisplay = displays.find(d => d.id === displayId);
    }
    
    if (!targetDisplay) {
      // Use primary display if no specific one requested
      targetDisplay = screen.getPrimaryDisplay();
    }

    const bounds = targetDisplay.bounds;

    selectionWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      fullscreenable: false,
      show: false, // Don't show immediately
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    // Load the selection overlay
    selectionWindow.loadFile('selection.html');
    
    // Ensure the window fills the entire display, accounting for scaling
    selectionWindow.once('ready-to-show', () => {
      // Set bounds precisely to match the display
      selectionWindow.setBounds(bounds, false);
      selectionWindow.show();
      selectionWindow.focus();
    });
    
    selectionWindow.setVisibleOnAllWorkspaces(true);

    // Clean up any existing listeners
    ipcMain.removeAllListeners('selection-complete');
    ipcMain.removeAllListeners('selection-cancelled');

    // Listen for selection result
    ipcMain.once('selection-complete', (e, selection) => {
      if (selectionWindow && !selectionWindow.isDestroyed()) {
        // Use setImmediate to ensure the window closes after the event is handled
        setImmediate(() => {
          if (selectionWindow && !selectionWindow.isDestroyed()) {
            selectionWindow.close();
          }
          selectionWindow = null;
        });
      }
      // Convert local window coordinates to absolute screen coordinates
      // The selection coordinates are already in physical pixels from the selection window
      const absoluteSelection = {
        x: selection.x + bounds.x,
        y: selection.y + bounds.y,
        width: selection.width,
        height: selection.height,
        displayId: targetDisplay.id,
        displayBounds: targetDisplay.bounds,
        displayScaleFactor: targetDisplay.scaleFactor,
        // Store the physical size for proper video cropping
        physicalWidth: Math.round(selection.width * targetDisplay.scaleFactor),
        physicalHeight: Math.round(selection.height * targetDisplay.scaleFactor)
      };
      resolve(absoluteSelection);
    });

    ipcMain.once('selection-cancelled', () => {
      if (selectionWindow && !selectionWindow.isDestroyed()) {
        setImmediate(() => {
          if (selectionWindow && !selectionWindow.isDestroyed()) {
            selectionWindow.close();
          }
          selectionWindow = null;
        });
      }
      resolve(null);
    });

    // Also handle window close
    selectionWindow.on('closed', () => {
      selectionWindow = null;
      resolve(null);
    });
  });
});
