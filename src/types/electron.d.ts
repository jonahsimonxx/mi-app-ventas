import { Producto } from '../shared/entities/Producto'; 

export interface ElectronAPI {
  getProductos: () => Promise<Producto[]>;
  createProducto: (producto: Partial<Producto>) => Promise<Producto>;
  updateProducto: (id: string, producto: Partial<Producto>) => Promise<Producto | null>;
  deleteProducto: (id: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}