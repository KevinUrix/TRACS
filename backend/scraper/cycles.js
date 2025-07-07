const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const scrapeCycles = async () => {
    const url = 'http://consulta.siiau.udg.mx/wco/sspseca.forma_consulta';

    try {
        const response = await axios.get(url,
            {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
            },
            responseType: 'arraybuffer'
        });
        const decodedData = iconv.decode(response.data, 'latin1');
        const $ = cheerio.load(decodedData);

        const cycles = [];

        $('select[name="ciclop"] option').each((_, option) => {
            const value = $(option).attr('value')?.trim();
            const text = $(option).text().trim();
            if (value) {
                cycles.push({ value, text });
            }
        });

        return cycles;
    } catch (err) {
        console.error('Error al obtener ciclos:', err.message);
        return [];
    }
};

module.exports = { scrapeCycles };
