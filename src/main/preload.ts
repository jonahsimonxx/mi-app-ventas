import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getProductos: () => ipcRenderer.invoke('get-productos'),
  createProducto: (producto: any) => ipcRenderer.invoke('create-producto', producto),
  updateProducto: (id: string, producto: any) => ipcRenderer.invoke('update-producto', id, producto),
  deleteProducto: (id: string) => ipcRenderer.invoke('delete-producto', id),
});