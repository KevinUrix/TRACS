const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const extractData = ($, buildingName) => {
    const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;
    let results = [];
    let lastNrc = "";
    let lastCode = "";
    let lastCourse = "";
    let lastSpots = "";
    let lastAvailable = "";

    $('tr').each((_, row) => {
        let nrc = $(row).find('td.tddatos').eq(0).text().trim(); // Obtiene el td que contiene el nrc
        let code = $(row).find('td.tddatos').eq(1).text().trim(); // Obtiene el td que contiene la clave
        let course = $(row).find('td.tddatos').eq(2).text().trim(); // Obtiene el td que contiene la materia
        let spots = $(row).find('td.tddatos').eq(5).text().trim(); // Obtiene el td que contiene los cupos
        let available = $(row).find('td.tddatos').eq(6).text().trim(); // Obtiene el td que contiene los disponibles
        const table = $(row).find('table.td1');
        const professors = $(row).find('td.tdprofesor');

        if (course) {
            lastNrc = nrc;
            lastCode = code; // Si existe la materia, actualizar la última válida
            lastCourse = course;
            lastSpots = spots;
            lastAvailable = available;
        } else {
            nrc = lastNrc;
            course = lastCourse; // Si no hay materia en el td, usa la última materia válida
            code = lastCode;
            course = lastCourse;
            spots = lastSpots;
            available = lastAvailable;
        }

        const students = spots - available;

        if (table.length) {
            table.find('tr').each((_, tableRow) => {
                if (!$(tableRow).find('td').toArray().some(cell => $(cell).text().includes(buildingName))) return;
                
                const cells = $(tableRow).find('td')
                    .toArray()
                    .map(cell => $(cell).text().trim())
                    .filter(text => text !== "01" && text !== "04" && !datePattern.test(text));

                if (cells.length < 4) return;
                
                if (cells[2] === "") return;
                
                const formattedData = {
                    "schedule": cells[0],
                    "days": cells[1],
                    "building": cells[2],
                    "classroom": cells[3],
                    "nrc": nrc,
                    "code": code,
                    "students": students,
                    "course": course
                };

                results.push({
                    data: formattedData,
                    professor: professors.eq(1).text().trim()
                });
                // console.log(cells.filter(text => text !== "01" && !datePattern.test(text)).join(","), course, professors.eq(1).text().trim());
            });
        }
    });
    return results
};

const scrapeData = async (cycle, edifp) => {
    const url = 'http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta';

    const formData = new URLSearchParams({
        ciclop: cycle,
        cup: 'D',
        edifp,
        mostrarp: '6000'
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
        const data = extractData($, edifp);
        return data;

    } catch (err) {
        console.error(`Error al obtener datos de ${edifp}:`, err.message);
        return [];
    }
};


module.exports = { scrapeData };