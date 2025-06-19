import goodLSVRulesModel from '../../models/goodLSVRulesModel.js';
import adminModel from "../../models/adminModel.js";
import ruleRagulationLSVModel from "../../models/ruleAndRegulationLSVModel.js";
import { logger } from "../../utils/logger.js";

const createLSVRule = async (req, res) => {
    try {
        const adminId = req.user.id;
        let questions, sections, guidelines;
        try {
            questions = JSON.parse(req.body.questions);
            sections = JSON.parse(req.body.sections);
            guidelines = JSON.parse(req.body.guidelines);
        } catch (parseError) {
            return res.status(400).json({
                status: 400,
                message: ['Invalid JSON format in request data']
            });
        }

        if (!adminId || !questions || !sections) {
            return res.status(400).json({
                status: 400,
                message: ['All required fields must be provided.']
            });
        }

        const location = await adminModel.findById(adminId);
        if (!location) {
            return res.status(404).json({
                status: 404,
                message: ['No location found for this admin.']
            });
        }
        const locationId = location.location;

        const processedGuidelines = guidelines.map((guideline, index) => {
            return {
                ...guideline,
                imageUrl: (req.fileLocations?.[index]) || null
            };
        });

        const newRule = new goodLSVRulesModel({
            locationId,
            adminId,
            questions,
            sections,
            guidelines: processedGuidelines
        });

        const savedRule = await newRule.save();

        return res.status(201).json({
            status: 201,
            message: ['LSV Rule created successfully.'],
        });

    } catch (error) {
        logger.error('admin-createGLSV Error:', error);
        return res.status(500).json({
            status: 500,
            message: [error.message || 'Internal server error']
        });
    }
}

const getGLSVRules = async (req, res) => {
    try {
        const adminId = req.user.id;
        const role = req.user.role;
        let query = {};
        if (role == 'admin') {
            query.adminId = adminId;
        }
        const rules = await goodLSVRulesModel.find(query).populate('locationId', 'name');

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

const createRRLSV = async (req, res) => {
    try {
        const adminId = req.user.id;
        let questions, sections, guidelines;

        try {
            questions = JSON.parse(req.body.questions);
            sections = JSON.parse(req.body.sections);
            guidelines = JSON.parse(req.body.guidelines);
        } catch (parseError) {
            return res.status(400).json({
                status: 400,
                message: ['Invalid JSON format in request data']
            });
        }

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
        const processedGuidelines = guidelines.map((guideline, index) => {
            return {
                ...guideline,
                imageUrl: (req.fileLocations?.[index]) || null
            };
        });

        const newRule = new ruleRagulationLSVModel({
            locationId,
            adminId,
            questions,
            sections,
            guidelines: processedGuidelines
        });
        const savedRule = await newRule.save();

        res.status(201).json({
            status: 201,
            message: 'RRLSV Rule created successfully.',
        });
    } catch (error) {
        logger.error(`admin-createGLSV Error`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getRRLSVRules = async (req, res) => {
    try {
        const adminId = req.user.id;
        const role = req.user.role;
        let query = {};
        if (role == 'admin') {
            query.adminId = adminId;
        }
        const rules = await ruleRagulationLSVModel.find(query).populate('locationId', 'name');

        return res.status(200).json({
            status: 200,
            message: 'RRLSV Rules fetched successfully',
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
    getGLSVRules,
    createRRLSV,
    getRRLSVRules
}