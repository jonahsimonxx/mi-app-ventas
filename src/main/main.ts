import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createConnection } from 'typeorm';
import { Producto } from '../shared/entities/Producto';
import { Envio } from '../shared/entities/Envio';
import { ProductoEnvio } from '../shared/entities/ProductoEnvio';
import { Transaccion } from '../shared/entities/Transaccion';
import { Cuenta } from '../shared/entities/Cuenta';
import { Moneda } from '../shared/entities/Moneda';

let mainWindow: BrowserWindow | null = null;

async function initDatabase() {
  try {
    await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'mi-app-ventas-data-base',
      entities: [Producto, Cuenta, Envio, Moneda, ProductoEnvio, Transaccion], 
      synchronize: true,
    });
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error en la DB:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  ipcMain.handle('get-productos', async () => {
    const repo = (await createConnection()).getRepository(Producto);
    return await repo.find();
  });

  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});