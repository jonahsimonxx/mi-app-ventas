import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getProductos: () => ipcRenderer.invoke('get-productos'),
});