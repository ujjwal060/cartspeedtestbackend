import goodLSVRulesModel from '../../models/goodLSVRulesModel.js';
import adminModel from "../../models/adminModel.js";
import { logger } from "../../utils/logger.js";

const createLSVRule = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { questions, sections } = req.body;

        if (!adminId || !questions || !sections) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        const location = await adminModel.findById(adminId);
        if (!location) {
            return res.status(404).json({
                status: 404,
                message: ['No location found for this admin.'],
            });
        }
        const locationId = location.location;

        const newRule = new goodLSVRulesModel({
            locationId,
            adminId,
            questions,
            sections
        });
        const savedRule = await newRule.save();

        res.status(201).json({
            status: 201,
            message: 'LSV Rule created successfully.',
            data: savedRule
        });
    } catch (error) {
        logger.error(`admin-createGLSV Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getGLSVRules = async (req, res) => {
    try {
        const adminId = req.user.id;

        const rules = await goodLSVRulesModel.find({ adminId }).populate('locationId', 'name');

        return res.status(200).json({
            status: 200,
            message: 'LSV Rules fetched successfully',
            data: rules
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

export {
    createLSVRule,
    getGLSVRules
}