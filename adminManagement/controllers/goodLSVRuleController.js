import goodLSVRulesModel from "../../models/goodLSVRulesModel.js";
import adminModel from "../../models/adminModel.js";
import ruleRagulationLSVModel from "../../models/ruleAndRegulationLSVModel.js";
import { logger } from "../../utils/logger.js";
import mongoose from "mongoose";

const createLSVRule = async (req, res) => {
  try {
    const adminId = req.user.id;
    const role = req.user.role;
    let whatIsLSV, importance, safety;
    try {
      whatIsLSV = JSON.parse(req.body.whatIsLSV || "[]");
      importance = JSON.parse(req.body.importance || "[]");
      safety = JSON.parse(req.body.safety || "[]");
    } catch (parseError) {
      return res.status(400).json({
        status: 400,
        message: ["Invalid JSON format in request data"],
      });
    }

    if (!adminId || (!whatIsLSV.length && !importance.length && !safety.length)) {
      return res.status(400).json({
        status: 400,
        message: ["All required fields must be provided."],
      });
    }

    let isSuperAdmin = false;

    if (role === "superAdmin") {
      isSuperAdmin = true;
    }

    const location = await adminModel.findById(adminId);
    if (!location) {
      return res.status(404).json({
        status: 404,
        message: ["No location found for this admin."],
      });
    }
    let locationId = location.location;

    let fileIndex = 0;
    const processSection = (sections, files) => {
      if (!Array.isArray(sections)) return [];
      const isFilesArray = Array.isArray(files);
      return sections.map((section) => ({
        title: section.title,
        description: section.description,
        guidelines: (section.guidelines || []).map((guideline) => {
          let assignedImageUrl = guideline.imageUrl || null;
          if (isFilesArray && files[fileIndex]) {
            assignedImageUrl = files[fileIndex];
            fileIndex += 1;
          }
          return {
            ...guideline,
            imageUrl: assignedImageUrl,
          };
        }),
      }));
    };

    const newRule = new goodLSVRulesModel({
      locationId,
      adminId,
      whatIsLSV: processSection(whatIsLSV, req.fileLocations),
      importance: processSection(importance, req.fileLocations),
      safety: processSection(safety, req.fileLocations),
      isSuperAdmin,
    });

    const savedRule = await newRule.save();

    return res.status(201).json({
      status: 201,
      message: ["LSV Rule created successfully."],
      data: savedRule
    });
  } catch (error) {
    logger.error("admin-createGLSV Error:", error);
    return res.status(500).json({
      status: 500,
      message: [error.message || "Internal server error"],
    });
  }
};

const getGLSVRules = async (req, res) => {
  try {
    const adminId = req.user.id;
    const role = req.user.role;
    const { offset = 0, limit = 10 } = req.body;
    const parsedOffset = parseInt(offset);
    const parsedLimit = parseInt(limit);
    let aggregation = [];

    if (role === "admin") {
      aggregation.push({
        $match: { adminId: new mongoose.Types.ObjectId(adminId) },
      });
    }

    aggregation.push(
      {
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $unwind: { path: "$location", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          adminId: 1,
          isSuperAdmin: 1,
          locationId: "$location._id",
          locationName: "$location.name",
          whatIsLSV: 1,
          importance: 1,
          safety: 1,
          createdAt: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: parsedOffset }, { $limit: parsedLimit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const [rules] = await goodLSVRulesModel.aggregate(aggregation);
    const total = rules.totalCount[0]?.count || 0;

     const formattedData = rules.data.map(rule => ({
      ...rule,
      whatIsLSV: Array.isArray(rule.whatIsLSV) ? rule.whatIsLSV[0] || {} : rule.whatIsLSV,
      importance: Array.isArray(rule.importance) ? rule.importance[0] || {} : rule.importance,
      safety: Array.isArray(rule.safety) ? rule.safety[0] || {} : rule.safety,
    }));

    return res.status(200).json({
      status: 200,
      message: "LSV Rules fetched successfully",
      data: formattedData,
      total,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const deleteGLSV = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.id);
    const { id } = req.params;

    const deletedDoc = await goodLSVRulesModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      adminId: adminId,
    });

    if (!deletedDoc) {
      return res.status(404).json({
        status: 404,
        message: ["Document not found or unauthorized"],
      });
    }

    return res.status(200).json({
      status: 200,
      message: ["Document deleted successfully"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const createRRLSV = async (req, res) => {
  try {
    const adminId = req.user.id;
    const role = req.user.role;
    let questions, sections, guidelines;

    try {
      questions = JSON.parse(req.body.questions);
      sections = JSON.parse(req.body.sections);
      guidelines = JSON.parse(req.body.guidelines);
    } catch (parseError) {
      return res.status(400).json({
        status: 400,
        message: ["Invalid JSON format in request data"],
      });
    }

    if (!adminId || !questions || !sections) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    let isSuperAdmin = false;

    if (role === "superAdmin") {
      isSuperAdmin = true;
    }

    const location = await adminModel.findById(adminId);
    if (!location) {
      return res.status(404).json({
        status: 404,
        message: ["No location found for this admin."],
      });
    }
    let locationId = location.location;

    const processedGuidelines = guidelines.map((guideline, index) => {
      return {
        ...guideline,
        imageUrl: req.fileLocations?.[index] || null,
      };
    });

    const newRule = new ruleRagulationLSVModel({
      locationId,
      adminId,
      questions,
      sections,
      guidelines: processedGuidelines,
      isSuperAdmin
    });
    const savedRule = await newRule.save();

    res.status(201).json({
      status: 201,
      message: "RRLSV Rule created successfully.",
    });
  } catch (error) {
    logger.error(`admin-createGLSV Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getRRLSVRules = async (req, res) => {
  try {
    const adminId = req.user.id;
    const role = req.user.role;
    const { offset, limit } = req.body;
    const parsedOffset = parseInt(offset);
    const parsedLimit = parseInt(limit);
    let aggregation = [];

    if (role == "admin") {
      aggregation.push({
        $match: {
          adminId: new mongoose.Types.ObjectId(adminId),
        },
      });
    }

    aggregation.push({
      $lookup: {
        from: "locations",
        localField: "locationId",
        foreignField: "_id",
        as: "location",
      },
    });

    aggregation.push({
      $unwind: { path: "$location", preserveNullAndEmptyArrays: true },
    });

    aggregation.push({
      $project: {
        _id: 1,
        ruleName: 1,
        description: 1,
        locationId: "$location._id",
        locationName: "$location.name",
        questions: 1,
        sections: 1,
        guidelines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    aggregation.push({
      $facet: {
        data: [{ $skip: parsedOffset }, { $limit: parsedLimit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [rules] = await ruleRagulationLSVModel.aggregate(aggregation);
    const total = rules.totalCount[0]?.count || 0;
    return res.status(200).json({
      status: 200,
      message: "RRLSV Rules fetched successfully",
      data: rules.data,
      total,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const deleteRRLSV = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.id);
    const { id } = req.params;

    const deletedDoc = await ruleRagulationLSVModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      adminId: adminId,
    });

    if (!deletedDoc) {
      return res.status(404).json({
        status: 404,
        message: ["Document not found or unauthorized"],
      });
    }

    return res.status(200).json({
      status: 200,
      message: ["Document deleted successfully"],
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

export {
  createLSVRule,
  getGLSVRules,
  createRRLSV,
  getRRLSVRules,
  deleteGLSV,
  deleteRRLSV,
};
