import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createConnection, Connection } from 'typeorm';
import { Producto } from '../shared/entities/Producto';
import { Cuenta } from '../shared/entities/Cuenta';
import { Envio } from '../shared/entities/Envio';
import { Moneda } from '../shared/entities/Moneda';
import { ProductoEnvio } from '../shared/entities/ProductoEnvio';
import { Transaccion } from '../shared/entities/Transaccion';

let mainWindow: BrowserWindow | null = null;
let connection: Connection | null = null; // ✅ Conexión global

async function initDatabase() {
  try {
    connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'mi-app-ventas-data-base',
      entities: [Producto, Cuenta, Envio, Moneda, ProductoEnvio, Transaccion],
      synchronize: false, // ✅ Desactiva synchronize (las tablas ya existen)
      logging: true, // ✅ Opcional: para ver consultas SQL en la terminal
    });
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error en la base de datos:', error);
    connection = null;
  }
}

async function createWindow() {
  // ✅ Espera a que la DB esté lista
  await initDatabase();

  // ✅ Registra el handler SOLO si la conexión funcionó
  if (connection) {
    ipcMain.handle('get-productos', async () => {
      try {
        const repo = connection!.getRepository(Producto);
        const productos = await repo.find();
        console.log('📊 Productos obtenidos:', productos.length);
        return productos;
      } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        return [];
      }
    });
  } else {
    console.error('❌ No se registró el handler: conexión fallida');
  }

  ipcMain.handle('create-producto', async (_, producto: Producto) => {
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
  // Configuración de la ventana
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // ✅ Asegúrate que esta ruta sea correcta
    },
  });

  // Carga la app
  mainWindow.loadURL('http://localhost:5173');

  // Opcional: Abre DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Inicializa la app
app.whenReady().then(createWindow);

// Cierra la app cuando todas las ventanas se cierran
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recrea la ventana si se cierra (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});