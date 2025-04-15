import express from 'express';

const bodyParserMiddleware = express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl === '/payment/webhook') {
            req.rawBody = buf.toString();
        }
    },
});

export default bodyParserMiddleware;
