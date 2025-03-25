const puppeteer = require('puppeteer');
const cheerio = require('cheerio');


const randomUserAgent = () => {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
};


const configureBrowser = async () => {
    return await puppeteer.launch({
        headless: true,
        args: [
            "--disable-gpu",
            `--user-agent=${randomUserAgent()}`
        ]
    });
};


const fillForm = async (page, ciclo, cup, edifp) => {
    await page.select('select[name="ciclop"]', ciclo.toString());
    await page.select('select[name="cup"]', cup);
    await page.type('input[name="edifp"]', edifp);
    await page.click('input[name="mostrarp"][value="500"]');
    await page.click('#idConsultar');
};


const waitTable = async (page, timeout = 5000) => {
    try {
        console.log("Esperando a que la tabla esté disponible...");
        await page.waitForSelector('table', { timeout });
        await page.waitForNetworkIdle({ idleTime: 900, timeout });
    } catch (error) {
        console.error(`Error: La tabla no apareció a tiempo después de ${timeout / 1000} segundos.`);
    }
};


const getHTML = async (page) => {
    return await page.content();
};


const filterRows = ($, edificeName) => {
    const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;
    
    $('tr').each((_, row) => {
        const table = $(row).find('table.td1');
        const professors = $(row).find('td.tdprofesor');

        if (table.length) {
            table.find('tr').each((_, tableRow) => {
                const containsEdificeName = $(tableRow).find('td').toArray().some(cell => $(cell).text().includes(edificeName));
                
                if (!containsEdificeName) return;
                
                const cells = $(tableRow).find('td').toArray().map(cell => $(cell).text().trim());
                
                console.log(cells.filter(text => text !== "01" && !datePattern.test(text)).join(","), professors.eq(1).text().trim());
            });
        }
    });
};


const processForm = async (page, ciclo, cup, edifp, filter) => {
    await fillForm(page, ciclo, cup, edifp);
    
    while (true) {
        // Usamos la función waitTable con el timeout por defecto de 15 segundos
        await waitTable(page); 
        
        let html = await getHTML(page);
        let $ = cheerio.load(html);
        
        if ($('table').length === 0) {
            console.error("Error: No se encontró la tabla en la página");
            break;
        }
        
        filterRows($, filter);

        try {
            const nextButton = await page.waitForSelector('input[value="500 Próximos"]', { timeout: 2000 }).catch(() => null);

            if (nextButton) {
                console.log("Botón encontrado. Esperando 5 segundos antes de hacer clic...");
                await page.waitForTimeout(50000);
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
};


const scrapeData = async () => {
    const browser = await configureBrowser();
    const page = await browser.newPage();
    
    await page.goto('https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta', { waitUntil: 'domcontentloaded' });
    await processForm(page, "202510", "D", "DUCT1", "DUCT1");
    
    console.log("===============================================");
    
    await page.goto('https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta', { waitUntil: 'domcontentloaded' });
    await processForm(page, "202510", "D", "DUCT2", "DUCT2");
    
    await browser.close();
};

module.exports = { scrapeData };