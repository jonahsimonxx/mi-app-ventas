import { contextBridge, ipcRenderer } from 'electron';
console.log("🔹 Preload cargado correctamente");

contextBridge.exposeInMainWorld('electronAPI', {
  getProductos: () => {
    console.log("🔹 Llamando a getProductos desde preload");
    return ipcRenderer.invoke('get-productos');
  },
});