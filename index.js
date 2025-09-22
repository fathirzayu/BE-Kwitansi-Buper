require("dotenv").config();
const express = require('express');
const PORT = 8000;
const server = express();
const db = require('./models');
const cors = require('cors');



server.use(express.json());
server.use(cors());
server.use(express.static("./public"));

const { authRouter, mahasiswaRouter, kwitansiRouter, } = require('./routers');
server.use('/api/auth', authRouter);
server.use('/api/mahasiswa', mahasiswaRouter);
server.use('/api/kwitansi', kwitansiRouter);


server.get('/', (req, res) => {
    res.status(200).send('This is my API for backend');
})


server.listen(PORT, () => {
    console.log(`Server running at Port ${PORT}`);
    // db.sequelize.sync( {alter:true} ) //------------------- Synchronize

})