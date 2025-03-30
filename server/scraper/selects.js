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

// 
// 
// 
// 
// 


const getBuildings = (folderPath) => {
  try {
    return fs.readdirSync(folderPath)
      .filter(file => fs.lstatSync(path.join(folderPath, file)).isFile())
      .map(file => path.parse(file).name); // Extraer solo el nombre sin la extensión
  } catch (err) {
    console.error('Error al leer la carpeta:', err);
    return [];
  }
};

// Guarda los nombres en un JSON
const saveJSON = (fileNames, outputFilePath) => {
    const jsonData = {
      edifp: fileNames
    };
  
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
};

const getBuildingsSelect = () => {
    const folderPath = '../data/buildings/';
    // const outputFilePath = '../data/selects/buildings.json';
    const outputFilePath = '../../public/data/selects/buildings.json';


    const fileNames = getBuildings(folderPath);
    if (fileNames.length > 0) {
        saveJSON(fileNames, outputFilePath);
    } else {
        console.log('No se encontraron archivos para guardar.');
    }
};


module.exports = { extractCicle, getBuildingsSelect };
