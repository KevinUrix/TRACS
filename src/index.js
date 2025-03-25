const { scrapeData } = require('./scraper');

(async () => {
    console.log("Iniciando scraper...");
    await scrapeData();
})();