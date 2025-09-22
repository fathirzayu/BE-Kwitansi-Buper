const nodeMailer = require('nodemailer');

const mailer = nodeMailer.createTransport({
    service: 'gmail',
    auth : {
        user: process.env.USER_MAILER,
        pass: process.env.PASS_MAILER
    },
    tls : {
        rejectUnauthorized: false
    }
})

module.exports = mailer