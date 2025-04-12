const puppeteer = require('puppeteer');

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

module.exports = { randomUserAgent, configureBrowser };