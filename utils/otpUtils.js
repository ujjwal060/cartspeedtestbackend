import nodemailer from 'nodemailer'
import { logger } from "./logger.js";
import { loadConfig } from '../config/loadConfig.js';


const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};


// const sendEmail = async ({ email, subject, body }) => {
//     try {
//         const config = await loadConfig();

//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: config.EMAIL_USER,
//                 pass: config.EMAIL_PASS
//             }
//         });

//         const mailOptions = {
//             from: config.EMAIL_USER,
//             to: email,
//             subject: subject,
//             text: body
//         };

//         await transporter.sendMail(mailOptions);
//         logger.info(`OTP sent successfully to ${email}`);
//         return { success: true };
//     } catch (error) {
//         logger.error(`Failed to send OTP to ${email}. Error: ${error}`);
//         return { success: false, message: [error.message] };
//     }
// };

const sendEmail = async ({ email, subject, body }) => {
    try {
        const config = await loadConfig();

        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: config.EMAIL_USER,
        //         pass: config.EMAIL_PASS
        //     }
        // });

        // const mailOptions = {
        //     from: config.EMAIL_USER,
        //     to: email,
        //     subject: subject,
        //     text: body
        // };

        // await transporter.sendMail(mailOptions);
        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: config.EMAIL_USER,
            port: 587,
            secure: false,
            auth: {
              user: config.EMAIL_USER,
              pass: config.EMAIL_PASS,
            },
          });
          
          const mailDetails = {
            from: config.EMAIL_USER,
            to: email,
            subject: subject,
            html: body,
          };
          let info = transporter.sendMail(mailDetails, (error, info) => {
            if (error) {
              console.log("Error sending email: ", error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        logger.info(`OTP sent successfully to ${email}`);
        return { success: true ,info};
    } catch (error) {
        logger.error(`Failed to send OTP to ${email}. Error: ${error}`);
        return { success: false, message: [error.message] };
    }
};

export {
    generateOTP,
    sendEmail
}