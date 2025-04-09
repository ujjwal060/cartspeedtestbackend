import nodemailer from 'nodemailer'
import {logger} from "./logger.js";
import { loadConfig } from '../config/loadConfig.js';


const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const config = await loadConfig();

const sendEmail = async ({email, subject, body}) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: config.EMAIL_USER,
            to: email,
            subject:subject,
            text:body
        };

        await transporter.sendMail(mailOptions);
        logger.info(`OTP sent successfully to ${email}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send OTP to ${email}. Error: ${error}`);
        return { success: false, message: [error.message] };
    }
};

export {
    generateOTP,
    sendEmail
}