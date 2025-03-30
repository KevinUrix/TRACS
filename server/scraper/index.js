const { scrapeData } = require('./schedules');
const { extractCicle } = require('./selects');

(async () => {
    console.log("Iniciando scraper...");
    // scrapeData();
    // console.log(await extractCicle());
    extractCicle();
})();