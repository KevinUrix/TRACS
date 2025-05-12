const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 43200, checkperiod: 120 });

module.exports = cache;
