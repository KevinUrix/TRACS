const { configureBrowser } = require('./browserUtils');
const fs = require('fs');
const path = require('path');


const extractCicle = async () => {
    const browser = await configureBrowser();
    const page = await browser.newPage();
    const url = 'https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const filePath = path.join(__dirname, '../../public/data/selects/', 'cicles.json');

    const options = await page.evaluate(() =>
        Array.from(document.querySelector('select[name="ciclop"]')?.options || []).map(option => ({
            value: option.value,
            text: option.textContent.trim()
        }))
    );

    await browser.close();
    // return JSON.stringify(options, null, 2);
    fs.writeFileSync(filePath, JSON.stringify(options, null, 2));
    
};

module.exports = { extractCicle };
