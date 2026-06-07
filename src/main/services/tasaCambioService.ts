import { getConnection } from 'typeorm';
import * as XLSX from 'xlsx';
import { Moneda } from '../../shared/entities/Moneda';
import { TasaCambioHistorico } from '../../shared/entities/TasaCambioHistorico';

export interface TasaCambioManual {
  fecha: string; // ISO date (YYYY-MM-DD)
  usd_to_cup: number;
  eur_to_cup?: number;
  gbp_to_cup?: number;
  fuente?: string;
}

// Mapea un código de moneda a la columna correspondiente del histórico.
const COLUMNA_POR_MONEDA: Record<string, keyof TasaCambioHistorico> = {
  USD: 'usd_to_cup',
  EUR: 'eur_to_cup',
  GBP: 'gbp_to_cup',
};

function normalizarFecha(fecha: string | Date): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return d.toISOString().slice(0, 10);
}

/**
 * Obtiene la tasa actual de una moneda desde la tabla Moneda.
 * La tasa se expresa en CUP por 1 unidad de la moneda. CUP devuelve 1.
 */
export async function getTasaActual(codigo_moneda: string): Promise<number> {
  if (codigo_moneda === 'CUP') return 1;
  const repo = getConnection().getRepository(Moneda);
  const moneda = await repo.findOne({ where: { codigo: codigo_moneda } });
  return moneda ? Number(moneda.tasa_cambio) : 0;
}

/**
 * Obtiene la tasa de una moneda en una fecha concreta desde tasa_cambio_historico.
 * Devuelve 0 si no hay registro para esa fecha/moneda.
 */
export async function getTasaPorFecha(fecha: Date | string, codigo_moneda: string): Promise<number> {
  if (codigo_moneda === 'CUP') return 1;
  const columna = COLUMNA_POR_MONEDA[codigo_moneda];
  if (!columna) return 0;

  const repo = getConnection().getRepository(TasaCambioHistorico);
  const registro = await repo.findOne({ where: { fecha: normalizarFecha(fecha) } });
  if (!registro) return 0;

  const valor = registro[columna];
  return valor != null ? Number(valor) : 0;
}

/**
 * Devuelve todo el histórico de tasas ordenado por fecha ascendente.
 */
export async function getTasasHistoricas(): Promise<TasaCambioHistorico[]> {
  const repo = getConnection().getRepository(TasaCambioHistorico);
  return repo.find({ order: { fecha: 'ASC' } });
}

/**
 * Añade (o actualiza si ya existe la fecha) una tasa de cambio manual.
 * Además sincroniza la tasa actual de USD en la tabla Moneda.
 */
export async function agregarTasaManual(tasa: TasaCambioManual): Promise<void> {
  const connection = getConnection();
  const repo = connection.getRepository(TasaCambioHistorico);
  const fecha = normalizarFecha(tasa.fecha);

  let registro = await repo.findOne({ where: { fecha } });
  if (!registro) {
    registro = repo.create({ fecha });
  }
  registro.usd_to_cup = tasa.usd_to_cup;
  registro.eur_to_cup = tasa.eur_to_cup;
  registro.gbp_to_cup = tasa.gbp_to_cup;
  registro.fuente = tasa.fuente || 'manual';
  await repo.save(registro);

  await sincronizarMonedaUSD(tasa.usd_to_cup);
}

/**
 * Importa tasas desde un archivo Excel hacia tasa_cambio_historico.
 * Se esperan columnas: fecha, usd_to_cup, eur_to_cup (opcional), gbp_to_cup (opcional).
 */
export async function importarTasasDesdeExcel(filePath: string): Promise<void> {
  const workbook = XLSX.readFile(filePath);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { raw: false });

  for (const fila of filas) {
    const fechaRaw = fila.fecha ?? fila.Fecha ?? fila.FECHA;
    const usdRaw = fila.usd_to_cup ?? fila.USD ?? fila.usd;
    if (fechaRaw == null || usdRaw == null) continue;

    const usd = Number(usdRaw);
    if (!isFinite(usd)) continue;

    const eur = Number(fila.eur_to_cup ?? fila.EUR ?? fila.eur);
    const gbp = Number(fila.gbp_to_cup ?? fila.GBP ?? fila.gbp);

    await agregarTasaManual({
      fecha: normalizarFecha(fechaRaw),
      usd_to_cup: usd,
      eur_to_cup: isFinite(eur) ? eur : undefined,
      gbp_to_cup: isFinite(gbp) ? gbp : undefined,
      fuente: 'excel',
    });
  }
}

// Mantiene actualizada la tasa actual de USD en la tabla Moneda.
async function sincronizarMonedaUSD(usd_to_cup: number): Promise<void> {
  if (!isFinite(usd_to_cup) || usd_to_cup <= 0) return;
  const repo = getConnection().getRepository(Moneda);
  let usd = await repo.findOne({ where: { codigo: 'USD' } });
  if (!usd) {
    usd = repo.create({ codigo: 'USD', nombre: 'Dólar Estadounidense', tasa_cambio: usd_to_cup });
  } else {
    usd.tasa_cambio = usd_to_cup;
  }
  await repo.save(usd);
}
