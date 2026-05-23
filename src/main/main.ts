import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createConnection, Connection, getConnection } from 'typeorm';
import { Producto } from '../shared/entities/Producto';
import { Moneda } from '../shared/entities/Moneda';
import { Cuenta } from '../shared/entities/Cuenta';
import { Envio } from '../shared/entities/Envio';
import { ProductoEnvio } from '../shared/entities/ProductoEnvio';
import { Transaccion } from '../shared/entities/Transaccion';
import { scrapeTasaCambioUSD } from './services/omfiScraper';
import { fetchTasasEltoque } from './services/eltoqueApi';

let mainWindow: BrowserWindow | null = null;
let connection: Connection | null = null;

async function initDatabase() {
  try {
    connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'mi-app-ventas-data-base',
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

// ========== HANDLER PARA ACTUALIZAR TASAS DESDE EL TOQUE ==========
ipcMain.handle('refresh-tasas', async () => {
  const tasas = await fetchTasasEltoque();
  if (tasas) return { source: 'eltoque', ...tasas };

  // Fallback al scraper OMFi si la API falla.
  const usdOmfi = await scrapeTasaCambioUSD();
  if (usdOmfi !== null) return { source: 'omfi', USD: usdOmfi };

  return { source: 'none' };
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

async function actualizarTasas() {
  const tasas = await fetchTasasEltoque();
  if (tasas) return;
  // Fallback al scraper si la API no respondió.
  await scrapeTasaCambioUSD();
}

app.whenReady().then(async () => {
  await createWindow();
  await actualizarTasas();
  setInterval(actualizarTasas, 21600000);
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