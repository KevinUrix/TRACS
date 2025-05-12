const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const NodeCache = require('node-cache');

// Crear instancia de caché
const cache = new NodeCache({ stdTTL: 43200, checkperiod: 120 });

// Expresión regular para fechas
const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;

// Función para extraer datos de cada fila
const extractData = ($) => {
    const results = [];
    let lastValidRow = { nrc: "", code: "", course: "", spots: "", available: "" };

    $('tr').each((_, row) => {
        const columns = $(row).find('td.tddatos');

        // Extraemos datos de la fila
        const nrc = columns.eq(0).text().trim() || lastValidRow.nrc;
        const code = columns.eq(1).text().trim() || lastValidRow.code;
        const course = columns.eq(2).text().trim() || lastValidRow.course;
        const spots = columns.eq(5).text().trim() || lastValidRow.spots;
        const available = columns.eq(6).text().trim() || lastValidRow.available;

        if (course) {
            // Actualizamos los valores válidos
            lastValidRow = { nrc, code, course, spots, available };
        }

        // Calculamos estudiantes solo si los valores son válidos
        const students = parseInt(spots) - parseInt(available);

        // Obtenemos la tabla y los profesores
        const table = $(row).find('table.td1');
        const professor = $(row).find('td.tdprofesor').eq(1).text().trim();

        if (table.length) {
            const rows = table.find('tr').toArray();
            const formattedRows = rows.map(row => {
                const cells = $(row).find('td')
                    .toArray()
                    .map(cell => $(cell).text().trim())
                    .filter(text => text !== "01" && text !== "04" && !datePattern.test(text));

                if (cells.length >= 4 && cells[2] && cells[3]) {
                    return {
                        data: {
                            "schedule": cells[0],
                            "days": cells[1],
                            "building": cells[2],
                            "classroom": cells[3],
                            "nrc": nrc,
                            "code": code,
                            "students": students,
                            "course": course
                        },
                        professor
                    };
                }
            }).filter(Boolean); // Removemos valores nulos

            results.push(...formattedRows);
        }
    });

    return results;
};

const searchProfessor = async (cycle) => {
    const cacheKey = `schedule-${cycle}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        console.log("Datos obtenidos desde el caché.");
        return cachedData;
    }

    const url = 'http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta';

    const formData = new URLSearchParams({
        ciclop: cycle,
        cup: 'D',
        mostrarp: '7000'
    });

    try {
        const response = await axios.post(url, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            responseType: 'arraybuffer'
        });

        const decodedData = iconv.decode(response.data, 'latin1');
        const $ = cheerio.load(decodedData);
        const data = extractData($);

        // Solo almacenar en caché si hay datos
        if (data.length > 0) {
            cache.set(cacheKey, data);
            console.log("Datos obtenidos y almacenados en caché.");
        } else {
            console.warn("No se encontraron datos válidos, no se guardarán en caché.");
        }

        return data;

    } catch (err) {
        console.error(`Error al obtener datos del ciclo - ${cycle}:`, err.message);
        return [];
    }
};

module.exports = { searchProfessor };