const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveExportDialog: (defaultName) => ipcRenderer.invoke('dialog:saveExport', defaultName),
});
