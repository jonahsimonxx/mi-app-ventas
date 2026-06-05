import axios from 'axios';
import { getConnection } from 'typeorm';
import { Moneda } from '../../shared/entities/Moneda';

// Token de acceso a la API de El Toque (tasas TRMI).
// Se puede sobreescribir vía la variable de entorno ELTOQUE_TOKEN (ver .env).
const ELTOQUE_TOKEN =
  process.env.ELTOQUE_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc3OTIwNzc1MiwianRpIjoiZmYwOWNiYzEtZmJiMC00OTY1LWI2OGQtZjE1NDUyOTMzZTUwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY5ZmNjMmE0ZDA3NmQ2OGM0NmFmNmY0YSIsIm5iZiI6MTc3OTIwNzc1MiwiZXhwIjoxODEwNzQzNzUyfQ.LoYve5fs65Rko0ZyRrMYfWqdNEFx3zppmiKyCJZv_9M';

const ELTOQUE_BASE_URL = process.env.ELTOQUE_BASE_URL || 'https://tasas.eltoque.com';

// La tabla Moneda tiene un CHECK que sólo admite USD, CUP y USDT.
// Mapeamos cada código de la BD al campo correspondiente que devuelve la API.
const MAPEO_TASAS: { codigo: 'USD' | 'USDT'; nombre: string; campoApi: string }[] = [
  { codigo: 'USD', nombre: 'Dólar Estadounidense', campoApi: 'USD' },
  { codigo: 'USDT', nombre: 'Tether', campoApi: 'USDT_TRC20' },
];

interface TrmiResponse {
  date?: string;
  hour?: number;
  tasas?: Record<string, number>;
}

export interface TasasActualizadas {
  USD?: number;
  USDT?: number;
  fecha?: string;
}

/**
 * Consulta el endpoint TRMI de El Toque y persiste las tasas USD y USDT contra CUP.
 * Devuelve las tasas obtenidas, o `null` si la llamada falla.
 */
export async function fetchTasasEltoque(): Promise<TasasActualizadas | null> {
  try {
    const response = await axios.get<TrmiResponse>(`${ELTOQUE_BASE_URL}/v1/trmi`, {
      headers: {
        Authorization: `Bearer ${ELTOQUE_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const tasas = response.data?.tasas;
    if (!tasas || typeof tasas !== 'object') {
      console.error('❌ Respuesta inesperada de El Toque:', response.data);
      return null;
    }

    const connection = getConnection();
    const repo = connection.getRepository(Moneda);
    const resultado: TasasActualizadas = { fecha: response.data?.date };

    for (const { codigo, nombre, campoApi } of MAPEO_TASAS) {
      const valor = Number(tasas[campoApi]);
      if (!isFinite(valor) || valor <= 0) continue;

      let moneda = await repo.findOne({ where: { codigo } });
      if (!moneda) {
        moneda = repo.create({ codigo, nombre, tasa_cambio: valor });
      } else {
        moneda.tasa_cambio = valor;
      }
      await repo.save(moneda);
      resultado[codigo] = valor;
      console.log(`✅ Tasa ${codigo} actualizada desde El Toque: 1 ${codigo} = ${valor} CUP`);
    }

    return resultado;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.error('⚠️ El Toque rechazó el token (401/403). Verifica que ELTOQUE_TOKEN esté vigente.');
    } else {
      console.error('⚠️ No se pudo obtener tasas de El Toque:', error?.message || error);
    }
    return null;
  }
}
