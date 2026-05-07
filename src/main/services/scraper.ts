import axios from 'axios';
import * as cheerio from 'cheerio';
import { getConnection } from 'typeorm';
import { Moneda } from '../../shared/entities/Moneda';

export async function scrapeTasaCambioUSD(): Promise<number | null> {
  try {
    // 1. Descargar el HTML de El Toque
    const response = await axios.get('https://eltoque.com/tasas-de-cambio-cuba', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const rows = $('table').first().find('tr');
    let tasaUSD: number | null = null;

    rows.each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const moneda = $(cells[0]).text().trim();
        const valor = $(cells[2]).text().trim();

        if (moneda.includes('USD')) {
          // Extraer el número de "540.00 CUP"
          const match = valor.match(/([\\d.]+)/);
          if (match) {
            tasaUSD = parseFloat(match[1]);
          }
        }
      }
    });

    if (tasaUSD === null) {
      console.error('❌ No se encontró la tasa de USD en El Toque');
      return null;
    }

    // 4. Actualizar la base de datos
    const connection = getConnection();
    const repo = connection.getRepository(Moneda);

    // Verificar si existe la moneda USD
    let monedaUSD = await repo.findOne({ where: { codigo: 'USD' } });
    if (!monedaUSD) {
      // Si no existe, crearla
      monedaUSD = repo.create({
        codigo: 'USD',
        nombre: 'Dólar Estadounidense',
        tasa_cambio: tasaUSD,
      });
    } else {
      // Si existe, actualizar la tasa
      monedaUSD.tasa_cambio = tasaUSD;
    }

    await repo.save(monedaUSD);

    console.log(`✅ Tasa USD actualizada: 1 USD = ${tasaUSD} CUP`);
    return tasaUSD;

  } catch (error) {
    console.error('❌ Error al scrapear tasa de cambio:', error);
    return null;
  }
}