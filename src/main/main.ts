import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// Carga las variables de entorno desde .env (token de El Toque, credenciales de BD, etc.).
try {
  require('dotenv').config();
} catch {
  console.warn('⚠️ dotenv no está instalado; se usarán los valores por defecto. Ejecuta "npm install".');
}

import { createConnection, Connection, getConnection } from 'typeorm';
import { Producto } from '../shared/entities/Producto';
import { Moneda } from '../shared/entities/Moneda';
import { Cuenta } from '../shared/entities/Cuenta';
import { Envio } from '../shared/entities/Envio';
import { ProductoEnvio } from '../shared/entities/ProductoEnvio';
import { Transaccion } from '../shared/entities/Transaccion';
import { fetchTasasEltoque } from './services/eltoqueApi';

let mainWindow: BrowserWindow | null = null;
let connection: Connection | null = null;

async function initDatabase() {
  try {
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'mi-app-ventas-data-base',
      entities: [Producto, Moneda, Cuenta, Envio, ProductoEnvio, Transaccion],
      synchronize: false,
      logging: true,
    });
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error en la base de datos:', error);
    connection = null;
  }
}

// ========== HANDLERS DE PRODUCTO ==========
ipcMain.handle('get-productos', async () => {
  try {
    const repo = connection!.getRepository(Producto);
    return await repo.find();
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return [];
  }
});

ipcMain.handle('create-producto', async (_, producto: Partial<Producto>) => {
  try {
    const repo = connection!.getRepository(Producto);
    const nuevoProducto = repo.create(producto as Producto);
    await repo.save(nuevoProducto);
    return nuevoProducto;
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    throw error;
  }
});

ipcMain.handle('update-producto', async (_, id: string, producto: Partial<Producto>) => {
  try {
    const repo = connection!.getRepository(Producto);
    await repo.update(id, producto);
    return await repo.findOne({ where: { id_prod: id } });
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    throw error;
  }
});

ipcMain.handle('delete-producto', async (_, id: string) => {
  try {
    const repo = connection!.getRepository(Producto);
    await repo.delete(id);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    throw error;
  }
});

// ========== HANDLERS DE MONEDA ==========
ipcMain.handle('get-monedas', async () => {
  try {
    const repo = connection!.getRepository(Moneda);
    return await repo.find();
  } catch (error) {
    console.error('❌ Error al obtener monedas:', error);
    return [];
  }
});

ipcMain.handle('create-moneda', async (_, moneda: Partial<Moneda>) => {
  try {
    const repo = connection!.getRepository(Moneda);
    const nuevaMoneda = repo.create(moneda as Moneda);
    await repo.save(nuevaMoneda);
    return nuevaMoneda;
  } catch (error) {
    console.error('❌ Error al crear moneda:', error);
    throw error;
  }
});

ipcMain.handle('update-moneda', async (_, codigo: string, moneda: Partial<Moneda>) => {
  try {
    const repo = connection!.getRepository(Moneda);
    await repo.update(codigo, moneda);
    return await repo.findOne({ where: { codigo } });
  } catch (error) {
    console.error('❌ Error al actualizar moneda:', error);
    throw error;
  }
});

ipcMain.handle('delete-moneda', async (_, codigo: string) => {
  try {
    const repo = connection!.getRepository(Moneda);
    await repo.delete(codigo);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar moneda:', error);
    throw error;
  }
});

  // ========== HANDLERS DE CUENTA ==========
ipcMain.handle('get-cuentas', async () => {
  try {
    const repo = connection!.getRepository(Cuenta);
    return await repo.find();
  } catch (error) {
    console.error('❌ Error al obtener cuentas:', error);
    return [];
  }
});

ipcMain.handle('create-cuenta', async (_, cuenta: Partial<Cuenta>) => {
  try {
    const repo = connection!.getRepository(Cuenta);
    const nuevaCuenta = repo.create(cuenta as Cuenta);
    await repo.save(nuevaCuenta);
    return nuevaCuenta;
  } catch (error) {
    console.error('❌ Error al crear cuenta:', error);
    throw error;
  }
});

ipcMain.handle('update-cuenta', async (_, id: string, cuenta: Partial<Cuenta>) => {
  try {
    const repo = connection!.getRepository(Cuenta);
    await repo.update(id, cuenta);
    return await repo.findOne({ where: { id_cuenta: id } });
  } catch (error) {
    console.error('❌ Error al actualizar cuenta:', error);
    throw error;
  }
});

ipcMain.handle('delete-cuenta', async (_, id: string) => {
  try {
    const repo = connection!.getRepository(Cuenta);
    await repo.delete(id);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    throw error;
  }
});

async function createWindow() {
  await initDatabase();

  if (!connection) {
    console.error('❌ No se registraron handlers: conexión fallida');
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL('http://localhost:5173');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await createWindow();
  await fetchTasasEltoque();
  setInterval(async () => {
    await fetchTasasEltoque();
  }, 21600000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});