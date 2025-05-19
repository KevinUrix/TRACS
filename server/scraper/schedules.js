const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const cache = require('./cache');
const buildingsData = require('../config/buildings');

// Formato de fecha
const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;

// Mecanismo de bloqueo para evitar duplicación en scraping en segundo plano
const activeBackgroundScraping = new Set();

// Función para extraer datos del HTML
const extractData = ($, buildingName) => {
    const results = [];
    let lastValidRow = { nrc: '', code: '', course: '', spots: '', available: '' };

    $('tr').each((_, row) => {
        const columns = $(row).find('td.tddatos');
        const nrc = columns.eq(0).text().trim() || lastValidRow.nrc;
        const code = columns.eq(1).text().trim() || lastValidRow.code;
        const course = columns.eq(2).text().trim() || lastValidRow.course;
        const spots = columns.eq(5).text().trim() || lastValidRow.spots;
        const available = columns.eq(6).text().trim() || lastValidRow.available;

        if (course) {
            lastValidRow = { nrc, code, course, spots, available };
        }

        const students = parseInt(spots) - parseInt(available);
        const table = $(row).find('table.td1');
        const professor = $(row).find('td.tdprofesor').eq(1).text().trim();

        if (table.length) {
            const rows = table.find('tr').toArray();
            const formattedRows = rows.map(tableRow => {
                if (!$(tableRow).find('td').toArray().some(cell => $(cell).text().includes(buildingName))) {
                    return null;
                }
                const cells = $(tableRow).find('td')
                    .toArray()
                    .map(cell => $(cell).text().trim())
                    .filter(text => text !== '01' && text !== '04' && !datePattern.test(text));

                if (cells.length >= 4 && cells[2] && cells[3]) {
                    return {
                        data: {
                            schedule: cells[0],
                            days: cells[1],
                            building: cells[2],
                            classroom: cells[3],
                            nrc,
                            code,
                            students,
                            course
                        },
                        professor
                    };
                }
            }).filter(Boolean);

            results.push(...formattedRows);
        }
    });

    return results;
};

// Scraping en segundo plano (background)
const backgroundScraping = async (cycle, skipEdifp = null) => {
    const chunkSize = 6;
    for (let i = 0; i < buildingsData.edifp.length; i += chunkSize) {
        const chunk = buildingsData.edifp.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (building) => {
        const edifp = building.value;
        if (edifp === skipEdifp || activeBackgroundScraping.has(edifp)) return;

        activeBackgroundScraping.add(edifp);

        const cacheKey = `schedule-${cycle}-building-${edifp}`;
        if (cache.get(cacheKey)) {
            activeBackgroundScraping.delete(edifp);
            return;
        }

        try {
            const url = 'http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta';
            const formData = new URLSearchParams({
                ciclop: cycle,
                cup: 'D',
                edifp,
                mostrarp: '7000'
            });

            const response = await axios.post(url, formData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                responseType: 'arraybuffer'
            });

            const decodedData = iconv.decode(response.data, 'latin1');
            const $ = cheerio.load(decodedData);
            const data = extractData($, edifp);

            if (data.length > 0) {
                cache.set(cacheKey, data);
                console.log(`Datos de ${edifp} almacenados en caché en segundo plano.`);
            }


        } catch (err) {
            console.error(`Error al hacer scraping de ${edifp}:`, err.message);
        } finally {
            activeBackgroundScraping.delete(edifp);
        }
    }));
}
};

// Scraping principal (directo al usuario)
const scrapeData = async (cycle, edifp) => {
    const cacheKey = `schedule-${cycle}-building-${edifp}`;
    const cachedSchedules = cache.get(cacheKey);

    if (cachedSchedules) {
        console.log('Datos obtenidos desde el caché.');
        return cachedSchedules;
    }

    console.log('Datos no encontrados en caché, iniciando scraping principal...');

    const url = 'http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta';
    const formData = new URLSearchParams({
        ciclop: cycle,
        cup: 'D',
        edifp,
        mostrarp: '7000'
    });

    try {
        const response = await axios.post(url, formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'arraybuffer'
        });

        const decodedData = iconv.decode(response.data, 'latin1');
        const $ = cheerio.load(decodedData);
        const data = extractData($, edifp);

        if (data.length > 0) {
            console.log(`Datos de ${edifp} obtenidos y almacenados en caché.`);
            cache.set(cacheKey, data);
        }

        // Iniciar el scraping en segundo plano para los demás
        backgroundScraping(cycle, edifp);

        return data;

    } catch (err) {
        console.error(`Error al hacer scraping de ${edifp}:`, err.message);
        return [];
    }
};

module.exports = { scrapeData };