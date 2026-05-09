import axios from 'axios';
import * as cheerio from 'cheerio';
import { getConnection } from 'typeorm';
import { Moneda } from '../../shared/entities/Moneda';

export async function scrapeTasaCambioUSD(): Promise<number | null> {
  try {
    const response = await axios.get('https://omfi.eltoque.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    let tasaUSD: number | null = null;

    $('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const moneda = $(cells[0]).text().trim();
        const valorText = $(cells[1]).text().trim();

        if (moneda.includes('USD')) {
          const match = valorText.match(/([\d.]+)/);
          if (match) {
            tasaUSD = parseFloat(match[1]);
          }
        }
      }
    });

    if (tasaUSD === null) {
      console.error('❌ No se encontró la tasa de USD en OMFi');
      return null;
    }

    const connection = getConnection();
    const repo = connection.getRepository(Moneda);

    let monedaUSD = await repo.findOne({ where: { codigo: 'USD' } });
    if (!monedaUSD) {
      monedaUSD = repo.create({
        codigo: 'USD',
        nombre: 'Dólar Estadounidense',
        tasa_cambio: tasaUSD,
      });
    } else {
      monedaUSD.tasa_cambio = tasaUSD;
    }

    await repo.save(monedaUSD);
    console.log(`✅ Tasa USD actualizada desde OMFi: 1 USD = ${tasaUSD} CUP`);
    return tasaUSD;

  } catch (error) {
    console.error('⚠️ No se pudo conectar a OMFi (bloqueado o sin internet). Usa el botón de actualización manual.');
    return null;
  }
}