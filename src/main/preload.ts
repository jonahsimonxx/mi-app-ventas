import { contextBridge } from 'electron';

// Exponer API segura al renderer (por ahora vacía)
contextBridge.exposeInMainWorld('electronAPI', {
  // Acá agregaremos funciones para comunicarnos con la DB
});