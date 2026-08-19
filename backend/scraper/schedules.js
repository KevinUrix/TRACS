const axios = require('axios');
const { Worker } = require('worker_threads');
const path = require('path');

const scrapeData = async (cycle) => {
    console.log(`Iniciando petición global al SIIAU para el ciclo ${cycle}...`);

    const url = 'https://siiauescolar.siiau.udg.mx/wal/sspseca.consulta_oferta';
    // const url = 'http://consulta.siiau.udg.mx/wco/sspseca.forma_consulta';

    const formData = new URLSearchParams({ ciclop: cycle, cup: 'D', mostrarp: '10000' });

    try {
        const response = await axios.post(url, formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'arraybuffer',
        });

        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'scraperWorker.js'), {
                workerData: { buffer: response.data }
            });

            worker.on('message', (msg) => resolve(msg));
            worker.on('error', (err) => {
                console.error('Error en el worker:', err);
                resolve({ data: {}, error: true });
            });
            worker.on('exit', (code) => {
                if (code !== 0) resolve({ data: {}, error: true });
            });
        });

    } catch (err) {
        console.error(`Error al consultar SIIAU:`, err.message);
        return { data: {}, error: true };
    }
};

module.exports = { scrapeData };