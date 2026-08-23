const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  testDatabase: (config) => ipcRenderer.invoke('database:test', config),
  runMigration: (config) => ipcRenderer.invoke('database:migrate', config),
  createAdmin: (data) => ipcRenderer.invoke('db:createAdmin', data),
  completeSetup: (config) => ipcRenderer.invoke('setup:complete', config),
})
