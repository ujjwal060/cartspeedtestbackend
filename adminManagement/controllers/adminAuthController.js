import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import adminModel from '../models/adminModel.js'
import { logger } from "../../utils/logger.js";
import { hashPassword } from '../../utils/passwordUtils.js';
import { generateOTP, sendEmail } from '../../utils/otpUtils.js';
import { emailTamplates } from "../../utils/emailTemplate.js";


const adminRegister = async (req, res) => {
    try {
        const { name, email, state, password, role } = req.body;
        logger.info("Incoming request for admin registration", { name, email, role });

        if (role === 'superadmin') {
            const existingSuperAdmin = await adminModel.findOne({ role: 'superadmin' });
            if (existingSuperAdmin) {
                logger.warn("Attempt to create superadmin when one already exists", { email });
                return res.status(400).json({
                    status: 400,
                    message: ['Superadmin already exists'],
                });
            }
        }

        if (role === 'admin') {
            const existingAdmin = await adminModel.findOne({ email });
            if (existingAdmin) {
                logger.warn("Admin with the same email already exists", { email });
                return res.status(400).json({
                    status: 400,
                    message: ['Admin with this email already exists'],
                });
            }
        }

        const hashedPassword = await hashPassword(password);
        const newAdmin = new adminModel({
            name,
            email,
            state,
            password: hashedPassword,
            role,
        });

        await newAdmin.save();
        logger.info("New admin created successfully", { name, email, role });
        const { subject, body } = emailTamplates.sendAdminCurd(name, email, password);
        const emailSent = await sendEmail({ email, subject, body });
        if (!emailSent.success) {
            logger.error("Failed to send email to new admin", { email, error: emailSent.message });
            return res.status(500).json({
                status: 500,
                message: emailSent.message,
            });
        }

        logger.info("Email sent to new admin successfully", { email });
        res.status(201).json({
            status: 201,
            message: ["Register Successfully!"]
        });
    } catch (error) {
        logger.error("Error in admin registration", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const login=async(req,res)=>{
    try{

    }catch(error){
        logger.error("Error in admin login", { error: error.message });
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    adminRegister,
    login
};