const { scrapeData } = require('./schedules');
const { extractCicle, getBuildingsSelect } = require('./selects');

(async () => {
    console.log("Iniciando scraper...");
    scrapeData();
    // console.log(await extractCicle());
    // extractCicle();
    // getBuildingsSelect();
})();