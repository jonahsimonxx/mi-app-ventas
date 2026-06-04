import axios from 'axios';
import { Producto } from '../shared/entities/Producto'; 
import { Moneda } from '../shared/entities/Moneda';

export interface ElectronAPI {
  getProductos: () => Promise<Producto[]>;
  createProducto: (producto: Partial<Producto>) => Promise<Producto>;
  updateProducto: (id: string, producto: Partial<Producto>) => Promise<Producto | null>;
  deleteProducto: (id: string) => Promise<boolean>;

  getMonedas: () => Promise<Moneda[]>;
  createMoneda: (moneda: Partial<Moneda>) => Promise<Moneda>;
  updateMoneda: (codigo: string, moneda: Partial<Moneda>) => Promise<Moneda | null>;
  deleteMoneda: (codigo: string) => Promise<boolean>;

  getCuentas: () => Promise<Cuenta[]>;
  createCuenta: (cuenta: Partial<Cuenta>) => Promise<Cuenta>;
  updateCuenta: (id: string, cuenta: Partial<Cuenta>) => Promise<Cuenta | null>;
  deleteCuenta: (id: string) => Promise<boolean>;
}



declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}