const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;

const mapProfessorName = (name) => {
    if (!name || name.trim() === "") return "PROFESOR NO ASIGNADO";
    return name;
};

const extractAllData = ($) => {
    const groupedResults = {};

    $('tr').each((_, row) => {
        const columns = $(row).find('td.tddatos');
        const nrc = columns.eq(0).text().trim();
        const code = columns.eq(1).text().trim();
        const course = columns.eq(2).text().trim();
        const spots = columns.eq(5).text().trim();
        const available = columns.eq(6).text().trim();
        
        if (!nrc && !code && !course) return;

        const students = parseInt(spots) - parseInt(available);
        const table = $(row).find('table.td1');
        let professor = $(row).find('td.tdprofesor').eq(1).text().trim();
        professor = mapProfessorName(professor);

        if (table.length) {
            table.find('tr').each((_, tableRow) => {
                const cells = $(tableRow).find('td')
                    .toArray()
                    .map(cell => $(cell).text().trim())
                    .filter(text => {
                        if (!text) return false;
                        const inRange = Number(text) >= 0 && Number(text) <= 9 && text.length <= 2 && text.startsWith('0');
                        return !inRange && !datePattern.test(text);
                    });

                if (cells.length >= 3 && cells[0] && cells[2]) {
                    const buildingName = cells[2]; 
                    
                    if (!groupedResults[buildingName]) {
                        groupedResults[buildingName] = [];
                    }

                    groupedResults[buildingName].push({
                        data: {
                            schedule: cells[0],
                            days: cells[1],
                            building: buildingName,
                            classroom: cells[3] || '',
                            nrc,
                            code,
                            students,
                            course
                        },
                        professor
                    });
                }
            });
        }
    });

    return groupedResults;
};

const scrapeData = async (cycle) => {
    console.log(`Iniciando petición global al SIIAU para el ciclo ${cycle}...`);

    const url = 'https://siiauescolar.siiau.udg.mx/wal/sspseca.consulta_oferta';
    // const url = 'http://consulta.siiau.udg.mx/wco/sspseca.forma_consulta';
    const formData = new URLSearchParams({
        ciclop: cycle,
        cup: 'D',
        mostrarp: '10000'
    });

    try {
        const response = await axios.post(url, formData.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
            },
            responseType: 'arraybuffer',
        });

        const decodedData = iconv.decode(response.data, 'latin1');
        const $ = cheerio.load(decodedData);
        
        const globalData = extractAllData($);
        return { data: globalData, error: false };

    } catch (err) {
        console.error(`Error al consultar SIIAU:`, err.message);
        return { data: {}, error: true };
    }
};

module.exports = { scrapeData };