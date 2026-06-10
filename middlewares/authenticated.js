'use strict';

const jwt = require('jsonwebtoken');
const jwtService = require('../services/jwt.service');

const ensureAuth = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'No autenticado'
            });
        }

        const payload = jwt.verify(token, jwtService.accessSecret);

        req.user = payload;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: false,
                message: 'Token expirado'
            });
        }

        return res.status(401).json({
            status: false,
            message: 'Token inválido'
        });
    }
};

module.exports = {
    ensureAuth
};