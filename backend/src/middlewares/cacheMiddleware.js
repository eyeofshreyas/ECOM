const NodeCache = require('node-cache');

// Standard TTL of 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        return res.json(cachedResponse);
    } else {
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, body);
            res.sendResponse(body);
        };
        next();
    }
};

const clearCache = (prefix = '') => {
    const keys = cache.keys();
    if (prefix) {
        const keysToDelete = keys.filter(key => key.startsWith(prefix));
        cache.del(keysToDelete);
    } else {
        cache.flushAll();
    }
};

module.exports = { cacheMiddleware, clearCache };
