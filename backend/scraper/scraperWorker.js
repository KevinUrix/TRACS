const { parentPort, workerData } = require('worker_threads');
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
                        if (text === '') return true; 
                        
                        const inRange = Number(text) >= 0 && Number(text) <= 9 && text.length <= 2 && text.startsWith('0');
                        return !inRange && !datePattern.test(text);
                    });

                if (cells.length >= 2 && cells[0]) {
                    const buildingName = cells[2] || 'SIN EDIFICIO'; 
                    const classroom = cells[3] || ''; 
                    
                    if (!groupedResults[buildingName]) {
                        groupedResults[buildingName] = [];
                    }

                    groupedResults[buildingName].push({
                        data: {
                            schedule: cells[0],
                            days: cells[1] || '',
                            building: buildingName,
                            classroom: classroom,
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

try {
    const decodedData = iconv.decode(workerData.buffer, 'latin1');
    const $ = cheerio.load(decodedData);
    const globalData = extractAllData($);
    
    parentPort.postMessage({ data: globalData, error: false });
} catch (err) {
    parentPort.postMessage({ data: {}, error: true, message: err.message });
}