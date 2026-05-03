import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createConnection } from 'typeorm';

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
      entities: [
        // Acá pondremos nuestras entidades (Producto, Envío, etc.)
      ],
      synchronize: true, // Solo en desarrollo, crea tablas automáticamente
    });
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
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

  // Cargar siempre desde Vite en desarrollo
  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});