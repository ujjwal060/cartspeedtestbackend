import mongoose from "mongoose";
import questionModel from "../../models/questionModel.js";
import LocationVideo from "../../models/videosModel.js";
import adminModel from "../../models/adminModel.js";
import safityVideo from "../../models/saftyVideosModel.js";
import { emailTamplates } from "../../utils/emailTemplate.js";
import { sendEmail } from "../../utils/otpUtils.js";
import { logger } from "../../utils/logger.js";
import ffmpeg from "fluent-ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import fs from "fs";
import axios from "axios";
import tmp from "tmp";

ffmpeg.setFfprobePath(ffprobeInstaller.path);

const addVideos = async (req, res) => {
  try {
    const { title, description, sectionNumber, sectionTitle } = req.body;
    const adminId = req.user.id;
    const url = req.fileLocations[0];

    if (!title || !url || !sectionNumber || !sectionTitle || !adminId) {
      logger.warn("Missing required fields in addVideos");
      return res.status(400).json({
        status: 400,
        message: ["Required fields are missing."],
      });
    }

    const location = await adminModel.findById(adminId);
    if (!location) {
      return res.status(404).json({
        status: 404,
        message: ["No location found for this admin."],
      });
    }
    const locationId = location.location;
    const durationTime = await getVideoDuration(url);
    const videoData = {
      title,
      url,
      description,
      durationTime,
      isActive: true,
    };

    let locationVideo = await LocationVideo.findOne({
      admin: adminId,
      location: locationId,
    });

    if (!locationVideo) {
      locationVideo = new LocationVideo({
        admin: adminId,
        location: locationId,
        sections: [],
      });
    }

    await locationVideo.addOrUpdateVideo(
      parseInt(sectionNumber),
      videoData,
      sectionTitle
    );

    return res.status(201).json({
      status: 201,
      message: ["Video uploaded and added to section successfully."],
    });
  } catch (error) {
    logger.error(`addVideos Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const { filters, sortField, sortBy, offset, limit } = req.body;
    const adminId = req.user.id;
    const role = req.user.role;

    let aggregation = getallAggregation({
      filters,
      adminId,
      role,
      sortField,
      sortBy,
      offset,
      limit,
    });

    const [result] = await LocationVideo.aggregate(aggregation);

    const total = result.totalCount[0]?.count || 0;

    logger.info(
      `Fetched ${result.data.length} videos for user: ${req.user.id}`
    );

    const formatted = result.data.map((item) => ({
      locationName: item.locationName,
      section: `section 0${item.section}`,
      sectionTitle: item.sectionTitle,
      video: item.video,
      adminName: item.adminName,
    }));

    logger.info(`Fetched ${formatted.length} videos for admin: ${adminId}`);

    return res.status(200).json({
      status: 200,
      message: ["Videos fetched successfully."],
      data: formatted,
      total,
    });
  } catch (error) {
    logger.error(`getAllVideos Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const deleteVideos = async (req, res) => {
  try {
    const { videoId } = req.params;

    const locationVideo = await LocationVideo.findOneAndUpdate(
      { "sections.videos._id": videoId },
      {
        $pull: { "sections.$[].videos": { _id: videoId } },
      },
      { new: true }
    );

    if (!locationVideo) {
      logger.warn(`Video not found with ID: ${videoId}`);
      return res.status(404).json({
        status: 404,
        message: ["Video not found."],
      });
    }

    const deletedQuestions = await questionModel.deleteMany({ videoId });
    logger.info(
      `Deleted ${deletedQuestions.deletedCount} questions for video ID: ${videoId}`
    );
    logger.info(
      `Video deleted from section: ${videoId} by admin: ${req.user?.id || "Unknown"
      }`
    );

    return res.status(200).json({
      status: 200,
      message: ["Video and related questions deleted successfully."],
      data: locationVideo,
    });
  } catch (error) {
    logger.error(`deleteVideos Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const videosStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const videoDoc = await LocationVideo.findOne(
      { "sections.videos._id": id },
      { "sections.videos.$": 1 }
    );

    if (!videoDoc || !videoDoc.sections?.[0]?.videos?.[0]) {
      return res.status(404).json({
        status: 404,
        message: ["Video not found"],
      });
    }

    const currentStatus = videoDoc.sections[0].videos[0].isActive;
    const newStatus = !currentStatus;

    const result = await LocationVideo.updateOne(
      { "sections.videos._id": id },
      {
        $set: {
          "sections.$[section].videos.$[video].isActive": newStatus,
        },
      },
      {
        arrayFilters: [{ "section.videos._id": id }, { "video._id": id }],
      }
    );

    return res.status(200).json({
      status: 200,
      message: [`Video status updated to ${newStatus ? "active" : "inactive"}`],
    });
  } catch (error) {
    logger.error(`videosStatus Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const checkExistingSection = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { sectionNumber } = req.body;
    let aggregation = [];

    if (!adminId || !sectionNumber) {
      logger.warn("checkSectionTitle: Missing adminId or sectionNumber");
      return res.status(400).json({
        status: 400,
        message: ["adminId and sectionNumber are required."],
      });
    }

    aggregation.push({
      $match: {
        admin: new mongoose.Types.ObjectId(adminId),
      },
    });

    aggregation.push({
      $unwind: "$sections",
    });

    aggregation.push({
      $match: {
        "sections.sectionNumber": parseInt(sectionNumber),
      },
    });
    aggregation.push({
      $project: {
        _id: 0,
        title: "$sections.title",
      },
    });

    const [result] = await LocationVideo.aggregate(aggregation);
    const title = result?.title || "";

    logger.info(
      `checkExistingSection: Found section title "${title}" for admin ${adminId}`
    );

    return res.status(200).json({
      status: 200,
      message: ["Section title fetched successfully."],
      data: { title },
    });
  } catch (error) {
    logger.error(`checkSectionTitle Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getVideoDuration = async (url) => {
  // return new Promise((resolve, reject) => {
  //     ffmpeg.ffprobe(url, (err, metadata) => {
  //         if (err) return reject(err);
  //         const duration = metadata.format.duration;
  //         resolve(`${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
  //     });
  // });
  const tempFile = tmp.fileSync({ postfix: ".mp4" });
  const writer = fs.createWriteStream(tempFile.name);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(tempFile.name, (err, metadata) => {
      fs.unlinkSync(tempFile.name); // Delete temp file
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(`${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
    });
  });
};

const getallAggregation = ({
  filters,
  adminId,
  role,
  sortField,
  sortBy,
  offset,
  limit,
}) => {
  const parsedOffset = parseInt(offset);
  const parsedLimit = parseInt(limit);
  const aggregation = [];

  if (role === "admin") {
    aggregation.push({
      $match: {
        admin: new mongoose.Types.ObjectId(adminId),
      },
    });
  }

  if (filters?.adminId) {
    aggregation.push({
      $match: {
        admin: new mongoose.Types.ObjectId(filters?.adminId),
      },
    });
  }

  if (role === "superAdmin") {
    aggregation.push({
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "adminsData",
      },
    });

    aggregation.push({
      $unwind: {
        path: "$adminsData",
        preserveNullAndEmptyArrays: true,
      },
    });
  }

  if (filters?.startDate || filters?.endDate) {
    const dateRange = {};

    if (filters.startDate) {
      dateRange.$gte = new Date(
        new Date(filters.startDate).setHours(0, 0, 0, 0)
      );
    }

    if (filters.endDate) {
      dateRange.$lte = new Date(
        new Date(filters.endDate).setHours(23, 59, 59, 999)
      );
    }

    aggregation.push({
      $match: {
        createdAt: dateRange,
      },
    });
  }

  aggregation.push({
    $lookup: {
      from: "locations",
      localField: "location",
      foreignField: "_id",
      as: "locationInfo",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$locationInfo",
      preserveNullAndEmptyArrays: true,
    },
  });

  if (filters?.locationName) {
    aggregation.push({
      $match: {
        "locationInfo.name": { $regex: filters.locationName, $options: "i" },
      },
    });
  }

  aggregation.push({
    $unwind: {
      path: "$sections",
      preserveNullAndEmptyArrays: false,
    },
  });

  if (filters?.section) {
    const sectionNumber = parseInt(filters?.section);
    aggregation.push({
      $match: {
        "sections.sectionNumber": sectionNumber,
      },
    });
  }

  aggregation.push({
    $unwind: {
      path: "$sections.videos",
      preserveNullAndEmptyArrays: false,
    },
  });

  if (filters?.title) {
    aggregation.push({
      $match: {
        "sections.videos.title": {
          $regex: filters?.title,
          $options: "i",
        },
      },
    });
  }

  aggregation.push({
    $project: {
      locationName: "$locationInfo.name",
      section: "$sections.sectionNumber",
      sectionTitle: "$sections.title",
      sectionDurationTime: "$sections.durationTime",
      video: "$sections.videos",
      adminName: role === "superAdmin" ? "$adminsData.name" : null,
    },
  });

  if (sortField) {
    aggregation.push({
      $sort: {
        [sortField]: parseInt(sortBy) === 1 ? 1 : -1,
      },
    });
  }

  aggregation.push({
    $facet: {
      data: [{ $skip: parsedOffset }, { $limit: parsedLimit }],
      totalCount: [{ $count: "count" }],
    },
  });

  return aggregation;
};

const addSafityVideos = async (req, res) => {
  try {
    const { title, description } = req.body;
    const adminId = req.user.id;
    const role = req.user.role;
    const url = req.fileLocations[0];

    if (!title || !url || !adminId) {
      logger.warn("Missing required fields in addVideos");
      return res.status(400).json({
        status: 400,
        message: ["Required fields are missing."],
      });
    }

    let isSuperAdmin = false;

    if (role === "superAdmin") {
      isSuperAdmin = true;
    }

    const location = await adminModel.findById(adminId);
    if (!location || !location.location) {
      return res.status(404).json({
        status: 404,
        message: ["No location found for this admin."],
      });
    }
    let locationId = location.location;

    const durationTime = await getVideoDuration(url);

    const videoData = new safityVideo({
      title,
      url,
      locationId,
      adminId,
      description,
      durationTime,
      isActive: true,
      isSuperAdmin,
    });

    await videoData.save();
    return res.status(201).json({
      status: 201,
      message: ["Video uploaded and added to section successfully."],
    });
  } catch (error) {
    logger.error(`addVideos Error`, error.message);
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getSaftyVideos = async (req, res) => {
  try {
    const adminId = req.user.id;
    const role = req.user.role;
    const { offset, limit, filters } = req.body;
    let aggregation = await gateAggregationSaftyVideo({
      adminId,
      role,
      offset,
      limit,
      filters
    });

    const result = await safityVideo.aggregate(aggregation);

    const videos = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      status: 200,
      message: ["Videos fetched successfully."],
      data: videos,
      total,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const gateAggregationSaftyVideo = async ({
  filters,
  adminId,
  role,
  offset,
  limit,
}) => {
  const parsedOffset = parseInt(offset);
  const parsedLimit = parseInt(limit);
  const aggregation = [];

  if (role === "admin") {
    aggregation.push({
      $match: {
        adminId: new mongoose.Types.ObjectId(adminId),
      },
    });
  }

  if (role === "superAdmin") {
    aggregation.push({
      $lookup: {
        from: "admins",
        localField: "adminId",
        foreignField: "_id",
        as: "adminsData",
      },
    });

    aggregation.push({
      $unwind: {
        path: "$adminsData",
        preserveNullAndEmptyArrays: true,
      },
    });
  }

  if (filters?.startDate || filters?.endDate) {
    const dateRange = {};

    if (filters.startDate) {
      dateRange.$gte = new Date(
        new Date(filters.startDate).setHours(0, 0, 0, 0)
      );
    }

    if (filters.endDate) {
      dateRange.$lte = new Date(
        new Date(filters.endDate).setHours(23, 59, 59, 999)
      );
    }

    aggregation.push({
      $match: {
        createdAt: dateRange,
      },
    });
  }

  if (filters?.title) {
    aggregation.push({
      $match: {
        title: {
          $regex: filters?.title,
          $options: "i",
        },
      },
    });
  }

  aggregation.push({
    $lookup: {
      from: "locations",
      localField: "locationId",
      foreignField: "_id",
      as: "locationInfo",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$locationInfo",
      preserveNullAndEmptyArrays: true,
    },
  });

  if (filters?.locationName) {
    aggregation.push({
      $match: {
        "locationInfo.name": {
          $regex: filters.locationName,
          $options: "i",
        },
      },
    });
  }

  if (role !== "admin") {
    aggregation.push({
      $lookup: {
        from: "admins",
        localField: "adminId",
        foreignField: "_id",
        as: "adminInfo",
      },
    });

    aggregation.push({
      $unwind: {
        path: "$adminInfo",
        preserveNullAndEmptyArrays: true,
      },
    });
  }

  if (filters?.adminName) {
    aggregation.push({
      $match: {
        ...(role === "superAdmin"
          ? { "adminsData.name": { $regex: filters.adminName, $options: "i" } }
          : { "adminInfo.name": { $regex: filters.adminName, $options: "i" } }),
      },
    });
  }

  aggregation.push({
    $project: {
      title: 1,
      description: 1,
      durationTime: 1,
      url: 1,
      locationName: "$locationInfo.name",
      ...(role !== "admin" && { adminName: "$adminInfo.name" }),
      adminName: role === "superAdmin" ? "$adminsData.name" : null,
    },
  });

  aggregation.push({
    $facet: {
      data: [{ $skip: parsedOffset }, { $limit: parsedLimit }],
      totalCount: [{ $count: "count" }],
    },
  });

  return aggregation;
};

const toggleSaftyVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await safityVideo.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.isActive = !video.isActive;
    await video.save();

    res.status(200).json({
      message: `Video status updated to ${video.isActive ? "Active" : "Inactive"
        }`,
      isActive: video.isActive,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

const deleteSaftyVideo = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { id } = req.params;

    const video = await safityVideo.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const videoAdmin = await adminModel.findById(video.adminId);

    await safityVideo.findByIdAndDelete(id);

    if (userRole === "superAdmin" && videoAdmin) {
      const email = videoAdmin.email;
      const { subject, body } = emailTamplates.sendVideoDeletedBySuperAdmin(
        videoAdmin.name,
        video.title,
        video.url
      );
      const emailSent = await sendEmail({ email, subject, body });
      if (!emailSent.success) {
        logger.error("Failed to send email to new admin", {
          email,
          error: emailSent.message,
        });
        return res.status(500).json({
          status: 500,
          message: emailSent.message,
        });
      }
    }

    res.status(200).json({ message: ["Video deleted successfully"] });
  } catch (error) {
    res
      .status(500)
      .json({ message: ["Error deleting video", error.message] });
  }
};

export {
  addVideos,
  getAllVideos,
  deleteVideos,
  videosStatus,
  checkExistingSection,
  addSafityVideos,
  getSaftyVideos,
  toggleSaftyVideoStatus,
  deleteSaftyVideo,
};
