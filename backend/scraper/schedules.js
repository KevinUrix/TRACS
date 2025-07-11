const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const cache = require('./cache');
const buildingsData = require('../config/buildings');

// Formato de fecha
const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;

// Mecanismo de bloqueo para evitar duplicación en scraping en segundo plano y principal
const activeBackgroundScraping = new Set();
const activeScraping = new Set();

// Función para extraer datos del HTML
const extractData = ($, buildingName) => {
    const results = [];
    // Quitar comentario si falta información
    // let lastValidRow = { nrc: '', code: '', course: '', spots: '', available: '' };

    $('tr').each((_, row) => {
        const columns = $(row).find('td.tddatos');
        const nrc = columns.eq(0).text().trim();
        const code = columns.eq(1).text().trim();
        const course = columns.eq(2).text().trim();
        const spots = columns.eq(5).text().trim();
        const available = columns.eq(6).text().trim();
        if (!nrc && !code && !course) return;
        /*
        QUITAR COMENTARIO EN CASO DE FALTA DE INFORMACIÓN Y BORRAR LO DE ARRIBA
        const columns = $(row).find('td.tddatos');
        const nrc = columns.eq(0).text().trim() || lastValidRow.nrc;
        const code = columns.eq(1).text().trim() || lastValidRow.code;
        const course = columns.eq(2).text().trim() || lastValidRow.course;
        const spots = columns.eq(5).text().trim() || lastValidRow.spots;
        const available = columns.eq(6).text().trim() || lastValidRow.available;
        if (course) {
            lastValidRow = { nrc, code, course, spots, available };
        } */

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
                    .filter(text => {
                        if (!text) return false;
                        const inRange = Number(text) >= 0 && Number(text) <= 9 && text.length <= 2 && text.startsWith('0');
                        return !inRange && !datePattern.test(text);
                    });

                /* 
                Si tienes un error Cannot read properties of undefined (reading 'substring') en un edificio, verifica que los datos estén bien obtenidos. Alguien puede poner un dato mal en SIIU y el sistema provocará error.
                Lo normal es que si el error es en calendar.js:722 puede estar en el schedule (cell[0]), provablemente provocado por la primera celda que dice '01'.
                */

                if (cells.length >= 3 && cells[0] && cells[2]) {
                    return {
                        data: {
                            schedule: cells[0],
                            days: cells[1],
                            building: cells[2],
                            classroom: cells[3] || '',
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
        const scrapeKey = `${cycle}-${edifp}`;

        if (edifp === skipEdifp || activeBackgroundScraping.has(scrapeKey)) return;

        activeBackgroundScraping.add(scrapeKey);

        const cacheKey = `schedule-${cycle}-building-${edifp}`;
        const alreadyCached = await cache.get(cacheKey);

        if (alreadyCached) {
            activeBackgroundScraping.delete(scrapeKey);
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer'
            });

            const decodedData = iconv.decode(response.data, 'latin1');
            const $ = cheerio.load(decodedData);
            const data = extractData($, edifp);

            if (data.length > 0) {
                await cache.set(cacheKey, data);
                console.log(`Datos de ${cycle} - ${edifp} almacenados en caché en segundo plano.`);
            }
            else {
                await cache.set(cacheKey, []);
                console.log(`Datos de ${cycle} - ${edifp} almacenados en caché en segundo plano - Vacios.`);
            }


        } catch (err) {
            console.error(`Error al hacer scraping de ${edifp}:`, err.message);
        } finally {
            activeBackgroundScraping.delete(scrapeKey);
        }
    }));
        await new Promise(res => setTimeout(res, 200));
    }
};

// Scraping principal (directo al usuario)
const scrapeData = async (cycle, edifp, force = false) => {
    const scrapeKey = `${cycle}-${edifp}`;

    // Esperar si ya hay otro scraping en curso para este edificio
    while (activeScraping.has(scrapeKey)) {
        console.log(`Esperando a que termine el scraping directo de ${scrapeKey}`);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    activeScraping.add(scrapeKey);
    
    const cacheKey = `schedule-${cycle}-building-${edifp}`;
    const cachedSchedules = await cache.get(cacheKey);

    if (!force) {
        if (cachedSchedules) {
            console.log(`Datos de ${cycle} - ${edifp} obtenidos desde el caché.`);
            activeScraping.delete(scrapeKey);
            return cachedSchedules;
        }
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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' ,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
            },
            responseType: 'arraybuffer',
        });

        const decodedData = iconv.decode(response.data, 'latin1');
        const $ = cheerio.load(decodedData);
        const data = extractData($, edifp);

        if (data.length > 0) {
            console.log(`Datos de ${cycle} - ${edifp} obtenidos y almacenados en caché.`);
            await cache.set(cacheKey, data);
        }
        else {
            await cache.set(cacheKey, []);
            console.log(`Datos de ${cycle} - ${edifp} obtenidos y almacenados en caché. - Vacios.`);
        }

        // Iniciar el scraping en segundo plano para los demás
        backgroundScraping(cycle, edifp);

        return { data, error: false };

    } catch (err) {
        console.error(`Error al hacer scraping de ${edifp}:`, err.message);
        return { data: [], error: true };
    } finally {
        activeScraping.delete(scrapeKey);
    }
};

module.exports = { scrapeData };