require("dotenv").config();
const express = require('express');
const PORT = process.env.PORT || 3000;
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


server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  // db.sequelize.sync( {alter:true} ) //------------------- Synchronize
});