export interface ElectronAPI {
  getProductos: () => Promise<any[]>; 
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}