require('dns').setServers(['8.8.8.8', '8.8.4.4']);

'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 3000;

connectDB();

app.listen(port, () => {
    console.log('Servidor corriendo en http://localhost:' + port);
});