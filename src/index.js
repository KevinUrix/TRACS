const { scrapeData } = require('./scraper');

(async () => {
    console.log("Iniciando scraper...");
    scrapeData();
})();