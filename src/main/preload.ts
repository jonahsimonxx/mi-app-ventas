import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getProductos: () => ipcRenderer.invoke('get-productos'),
  createProducto: (producto: any) => ipcRenderer.invoke('create-producto', producto),
  updateProducto: (id: string, producto: any) => ipcRenderer.invoke('update-producto', id, producto),
  deleteProducto: (id: string) => ipcRenderer.invoke('delete-producto', id),

  getMonedas: () => ipcRenderer.invoke('get-monedas'),
  createMoneda: (moneda: any) => ipcRenderer.invoke('create-moneda', moneda),
  updateMoneda: (codigo: string, moneda: any) => ipcRenderer.invoke('update-moneda', codigo, moneda),
  deleteMoneda: (codigo: string) => ipcRenderer.invoke('delete-moneda', codigo),

  getCuentas: () => ipcRenderer.invoke('get-cuentas'),
  createCuenta: (cuenta: any) => ipcRenderer.invoke('create-cuenta', cuenta),
  updateCuenta: (id: string, cuenta: any) => ipcRenderer.invoke('update-cuenta', id, cuenta),
  deleteCuenta: (id: string) => ipcRenderer.invoke('delete-cuenta', id),
});