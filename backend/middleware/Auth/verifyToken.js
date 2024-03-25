const jwt = require('jsonwebtoken');
const { defaultLogger, createLogger } = require('../../logging/logger');
const verifyTokenLogger = createLogger('VerifyToken');

const verifyToken = (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
        token = authHeader.split(' ')[1];
    }

    // Fallback to checking for token in cookies
    if (!token && req.cookies) {
        token = req.cookies['token'];
    }

    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }

        verifyTokenLogger.info("decoded:", decoded);

        req.userId = decoded.userId;
        req.clientId = decoded.clientId;
        req.therapistId = decoded.therapistId;
        next();
    });
};

module.exports = verifyToken;
