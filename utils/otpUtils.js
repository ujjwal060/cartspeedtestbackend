import twilio from 'twilio';
import {logger} from "./logger.js";

const accountSid = process.env.twilio_account_sid;
const authToken =  process.env.twilio_auth_token;
const serviceId =  process.env.twilio_service_sid;

const client = twilio(accountSid, authToken);

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendOTP = async (mobile, otp) => {
    try {
        await client.messages.create({
            body: `Your verification code is ${otp}. It will expire in 10 minutes.`,
            messagingServiceSid: serviceId,
            to: mobile,
        });
        logger.info(`OTP sent successfully to ${mobile}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send OTP to ${mobile}. Error: ${error}`);
        return { success: false, message: [error.message] };
    }
};

export {
    generateOTP,
    sendOTP
}