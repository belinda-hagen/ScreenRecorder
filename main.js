const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell } = require('electron');
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 880,
    minWidth: 340,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    ...(process.platform === 'win32' && {
      // Note: use 8-digit hex for alpha transparency. '#00000000' = fully transparent
      backgroundColor: '#00000000',
      roundedCorners: true,
    }),
    title: 'Screen Recorder',
    resizable: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
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
