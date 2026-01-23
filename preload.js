const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveVideo: (buffer, format) => ipcRenderer.invoke('save-video', buffer, format),
  checkFfmpeg: () => ipcRenderer.invoke('check-ffmpeg'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
