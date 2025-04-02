const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { configureBrowser } = require('./browserUtils');


const fillForm = async (page, ciclo, cup, edifp) => {
    await page.select('select[name="ciclop"]', ciclo.toString());
    await page.select('select[name="cup"]', cup);
    await page.type('input[name="edifp"]', edifp);
    await page.click('input[name="mostrarp"][value="500"]');
    await page.click('#idConsultar');
};


const waitTable = async (page, timeout = 5000, maxAttempts = 3) => {
    let attempt = 0;
    let tableFound = false;

    while (attempt < maxAttempts && !tableFound) {
        try {
            console.log(`Esperando a que la tabla esté disponible... Intento ${attempt + 1} de ${maxAttempts}`);
            
            await page.waitForFunction(() => {
                return document.querySelector('table') !== null && document.querySelector('table').rows.length > 0;
            }, { timeout });

            await page.waitForNetworkIdle({ idleTime: 1000, timeout });
            tableFound = true;
        } catch (error) {
            console.error(`Error: La tabla no apareció a tiempo después de ${timeout / 1000} segundos.`);
            attempt++;

            if (attempt < maxAttempts) {
                console.log("Reintentando...");
            } else {
                console.log("Se alcanzó el número máximo de intentos.");
            }
        }
        if (!tableFound) {
            console.error("La tabla no se encontró después de múltiples intentos.");
        }
    }
};

const extractData = ($, buildingName) => {
    const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;
    let results = [];
    let lastCode = "";
    let lastCourse = "";
    let lastSpots = "";
    let lastAvailable = "";

    $('tr').each((_, row) => {
        let code = $(row).find('td.tddatos').eq(1).text().trim(); // Obtiene el td que contiene la clave
        let course = $(row).find('td.tddatos').eq(2).text().trim(); // Obtiene el td que contiene la materia
        let spots = $(row).find('td.tddatos').eq(5).text().trim(); // Obtiene el td que contiene los cupos
        let available = $(row).find('td.tddatos').eq(6).text().trim(); // Obtiene el td que contiene los disponibles
        const table = $(row).find('table.td1');
        const professors = $(row).find('td.tdprofesor');

        if (course) {
            lastCode = code; // Si existe la materia, actualizar la última válida
            lastCourse = course;
            lastSpots = spots;
            lastAvailable = available;
        } else {
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
                    .filter(text => text !== "01" && !datePattern.test(text));

                if (cells.length < 4) return;
                
                const formattedData = {
                    "schedule": cells[0],
                    "days": cells[1],
                    "building": cells[2],
                    "classroom": cells[3],
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


const processForm = async (page, ciclo, cup, edifp, filter) => {
    await fillForm(page, ciclo, cup, edifp);
    let allData = [];
    
    while (true) {
        await waitTable(page); 
        let $ = cheerio.load(await page.content());
        
        if ($('table').length === 0) {
            console.error("Error: No se encontró la tabla en la página");
            break;
        }
        
        allData = allData.concat(extractData($, filter));

        try {
            const nextButton = await page.$('input[value="500 Próximos"]');

            if (nextButton) {
                console.log("Botón encontrado. Esperando 5 segundos antes de hacer clic...");
                await page.waitForSelector('input[value="500 Próximos"]:not([disabled])');
                await nextButton.click();
            } else {
                console.log("No hay más páginas disponibles.");
                break;
            }
        } catch (error) {
            console.error("Error al intentar hacer clic en '500 Próximos'", error);
            break;
        }
    }
    return allData;
};


const scrapeData = async () => {
    const browser = await configureBrowser();
    const page = await browser.newPage();
    const url = 'https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta';
    let buildingName = "DEDG";
    const fileName = `${buildingName}.json`
    const filePath = path.join(__dirname, '../../public/data/buildings/', fileName);
    
    const fetchData = async (edifp) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return await processForm(page, "202510", "D", edifp, edifp);
    };
    

    const result = {
        DEDG: await fetchData(buildingName)
    };
    
    console.log("===============================================");
    
    // await page.goto('https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta', { waitUntil: 'domcontentloaded' });
    // await processForm(page, "202510", "D", "DUCT2", "DUCT2");
    
    await browser.close();
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
};

module.exports = { scrapeData };