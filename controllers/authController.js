const db = require('../models');
const user = db.Users;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const mailer = require('../helper/mailer');
const fs = require('fs');
const handlebars = require('handlebars');
const { Op } = require('sequelize');

module.exports = {
    register: async (req, res) => {
        try {
            const {
                fullname,
                username,
                email,
                password,
                confirmPassword,
                jabatan
            } = req.body;
            if (password !== confirmPassword) {
                throw ('Password not match')
            }
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            const result = await user.create({
                fullname,
                username,
                email,
                password: hashPassword,
                jabatan
            });

            res.status(200).send({
                status: true,
                massage: 'Register success',
                result
            });
        } catch (err) {
            console.log(err);
            res.status(400).send(err);
        };
    },
    login: async (req, res) => {
        try {
        const { identifier, password } = req.body;

        const checkLogin = await user.findOne({
            where: {
            [Op.or]: [
                { username: identifier },
                { email: identifier }
            ]
            }
        });

        if (!checkLogin) throw { message: "User not found" };

        const isValid = await bcrypt.compare(password, checkLogin.password);
        if (!isValid) throw { message: "Wrong password" };

        const payload = { id: checkLogin.id };
        const token = jwt.sign(payload, process.env.KEY_JWT, { expiresIn: "6h" });

        res.status(200).send({
            status: true,
            message: "Login success",
            token,
            checkLogin
        });
        } catch (err) {
        console.log(err);
        res.status(400).send(err);
        }
    },
    keeplogin: async (req, res) => {
        try {
            const result = await user.findOne({
                where: {
                    id: req.user.id
                }
            });
            res.status(200).send(result);
        } catch (err) {
            console.log(err);
            res.status(400).send(err);
        };
    },
    resetPassword: async (req, res) => {
        try {
            const { email, password } = req.body;

            const checkUser = await user.findOne({ where: { email } });
            if (!checkUser) throw { message: "User not found" };

            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            const result = await user.update(
            { password: hashPassword },
            { where: { email } }
            );

            if (result[0] === 0) throw { message: "Password failed to change" };

            res.status(200).send({
            message: "Password changed successfully",
            });
        } catch (err) {
            console.log(err);
            res.status(400).send(err);
        }
    },
    addAvatar: async (req, res) => {
        try {
            if (req.file.size > 1024 * 1024) throw {
                status: false,
                message: "file size to large"
            }
            const result = await user.update({
                imgProfile: req.file.filename
            }, {
                where: {
                    id: req.user.id
                }
            })
            res.status(200).send({
                result,
                status: true,
            });
        } catch (err) {
            console.log(err);
            res.status(400).send(err);
        }
    },
};

// Contoh nodeMailer
// forgetPassword: async (req, res) => {
//         try {
//             const result = await user.findOne({
//                 where: {
//                     email: req.body.email
//                 }
//             });
//             if (!result) throw {
//                 message: "Email not found"
//             };
//             const payload = {
//                 email: req.body.email
//             };
//             const token = jwt.sign(payload, process.env.KEY_JWT, {
//                 expiresIn: "1h"
//             });
//             const data = await fs.readFileSync('./src/resetPass.html', 'utf-8');
//             const tempCompile = await handlebars.compile(data);
//             const tempResult = tempCompile({
//                 token
//             });
//             await mailer.sendMail({
//                 from: process.env.TRANSPORTER_EMAIL,
//                 to: req.body.email,
//                 subject: 'Reset Password',
//                 html: tempResult
//             });
//             res.status(200).send({
//                 message: "Please Check your E-mail!",
//                 token
//             });
//         } catch (err) {
//             console.log(err);
//             res.status(400).send(err);
//         };
//     },