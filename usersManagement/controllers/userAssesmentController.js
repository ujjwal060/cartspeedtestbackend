import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;
import UserVideoProgress from "../../models/UserVideoProgress.js";
import UserTestAttempts from "../../models/userTestModel.js";
import QuestionModel from "../../models/questionModel.js";
import CertificateModel from "../../models/CertificateModel.js";
import UserModel from "../../models/userModel.js";
import LocationModel from "../../models/locationModel.js";
import userLocationModel from "../../models/userLocationMap.js";
import { logger } from "../../utils/logger.js";
import { generateCertificateImage } from "../../utils/certificateGenerator.js";
import { getNextCertificateNumber } from "../../utils/getNextCertificateNumber.js";

const getAssesmentForUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userLocationData = await userLocationModel.findOne({
      userId: new ObjectId(userId),
      isCurrent: true,
    });

    const userCoordinates = userLocationData.coordinates.coordinates;
    const nearbyLocations = await LocationModel.findOne({
      role: "admin",
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: userCoordinates,
          },
        },
      },
    });

    let selectedLocationId;
    let locationRole = "superAdmin";

     if (nearbyLocations) {
          selectedLocationId = nearbyLocations._id;
          locationRole = "admin";
        } else {
          const superAdminLocation = await LocationModel.findOne({ role: "superAdmin" });
          if (!superAdminLocation) {
            return res.status(404).json({
              status: 404,
              message: ["SuperAdmin location not found"],
            });
          }
          selectedLocationId = superAdminLocation._id;
        }

   const existingTest = await UserTestAttempts.findOne({
      userId,
      locationId: selectedLocationId,
      isSectionCompleted: true,
    });

    if (existingTest) {
      const lastAttempt = existingTest.attempts?.[existingTest.attempts.length - 1];
      if (lastAttempt?.isPassed) {
        return res.status(403).json({
          status: 403,
          message: ["You have already passed this assessment."],
        });
      }
    }

     let questions = await QuestionModel.find({
      locationId: selectedLocationId,
    })
      .limit(10)
      .lean();

      if (questions.length === 0 && locationRole === "admin") {
      const superAdminLocation = await LocationModel.findOne({ role: "superAdmin" });
      selectedLocationId = superAdminLocation._id;

      questions = await QuestionModel.find({
        locationId: selectedLocationId,
      })
        .limit(10)
        .lean();

      isSuperAdmin = true;
    }

    const formattedQuestions = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options.map((opt) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        _id: opt._id,
      })),
    }));

     return res.status(200).json({
      status: 200,
      message: [`${locationRole} questions fetched successfully`],
      data: [
        {
          locationId: selectedLocationId,
          questions: formattedQuestions,
        },
      ],
    });
  } catch (error) {
    logger.error(
      `Error fetching assessment for user: ${req.user?.userId}`,
      error.message
    );
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const submitTestAttempt = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { locationId, questions, duration } = req.body;

    if (!locationId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        status: 400,
        message: ["locationId and questions are required"],
      });
    }

    const questionIds = questions.map((q) => q.questionId);
    const correctQuestions = await QuestionModel.find({
      _id: { $in: questionIds },
    });

    let correctAnswers = 0;

    const evaluatedQuestions = questions.map((q) => {
      const original = correctQuestions.find(
        (oq) => oq._id.toString() === q.questionId.toString()
      );

      const correctOption = original?.options.find((opt) => opt.isCorrect);

      const isCorrect =
        correctOption &&
        correctOption._id.toString() === q.selectedOption.toString();

      if (isCorrect) correctAnswers++;

      return {
        questionId: q.questionId,
        selectedOption: q.selectedOption,
        correctOption: correctOption?._id.toString(),
        isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= 60;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let userTest = await UserTestAttempts.findOne({
      userId,
      locationId,
    });

    if (!userTest) {
      userTest = new UserTestAttempts({
        userId,
        locationId,
        attempts: [],
      });
    }

    const todayAttempts = userTest.attempts.filter(
      (attempt) =>
        new Date(attempt.attemptedAt) >= todayStart &&
        new Date(attempt.attemptedAt) <= todayEnd
    );

    if (todayAttempts.length >= 3) {
      return res.status(400).json({
        status: 400,
        message: ["You have reached today's 3 attempt limit"],
      });
    }

    const attemptNumber = userTest.attempts.length + 1;

    userTest.attempts.push({
      attemptNumber,
      questions: evaluatedQuestions,
      duration,
      attemptedAt: new Date(),
      score,
      isPassed,
      totalQuestions,
      correctAnswers,
    });

    if (isPassed && !userTest.isSectionCompleted) {
      userTest.isSectionCompleted = true;
      userTest.completedAt = new Date();
      userTest.nextSectionUnlocked = true;
    }

    await userTest.save();

    return res.status(200).json({
      message: ["Attempt submitted successfully"],
      status: 200,
      data: {
        score,
        isPassed,
        totalQuestions,
        correctAnswers,
        attemptNumber,
        sectionCompleted: userTest.isSectionCompleted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};


const enrollForCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { locationId } = req.body;
    let userLocationId;

    logger.info(
      `Certificate enrollment initiated - user: ${userId}, location: ${locationId}`
    );

    // const [user, location] = await Promise.all([
    //   UserModel.findById(userId),
    //   LocationModel.findById(locationId),
    // ]);

    const user = await UserModel.findById(userId);
    let location;

    if (locationId) {
      userLocationId = locationId;
      location = await LocationModel.findById(locationId);
    } else {
      location = await LocationModel.findOne({ role: "superAdmin" });
      userLocationId = location._id;
    }

    if (!user)
      return res
        .status(404)
        .json({ status: 404, message: ["User not found."] });
    if (!location)
      return res
        .status(404)
        .json({ status: 404, message: ["Location not found."] });

    const existing = await CertificateModel.findOne({ userId, locationId });
    if (existing) {
      return res.status(200).json({
        message: ["Certificate already generated."],
        status: 200,
        data: existing,
      });
    }

    const certificateNumber = await getNextCertificateNumber();
    const issueDate = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 3);

    const newCertificate = new CertificateModel({
      userId,
      locationId: userLocationId,
      email: user.email,
      certificateNumber,
      certificateName: `Certificate of Completion for, ${location.name}`,
      certificateIssuedBy: "CARTIE APP",
      status: "Active",
      issueDate,
      validUntil,
      certificateUrl: "",
    });

    const certificateUrl = await generateCertificateImage({
      certificateName: newCertificate.certificateName,
      locationName: location.name,
      email: user.email,
      certificateNumber: newCertificate.certificateNumber,
      issueDate: newCertificate.issueDate,
      validUntil: newCertificate.validUntil,
    });

    newCertificate.certificateUrl = certificateUrl;
    await newCertificate.save();

    logger.info(
      `Certificate generated for user: ${userId}, cert#: ${certificateNumber}`
    );

    return res.status(200).json({
      message: ["Certificate generated successfully."],
      status: 200,
      data: newCertificate,
    });
  } catch (error) {
    logger.error(
      `Certificate enrollment error - user: ${req.user?.userId}`,
      error
    );
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

const getAllCerificate = async (req, res) => {
  try {
    const userId = req.user.userId;
    let aggregation = [];

    aggregation.push({
      $match: {
        userId: new ObjectId(userId),
      },
    });

    aggregation.push({
      $lookup: {
        from: "locations",
        localField: "locationId",
        foreignField: "_id",
        as: "locationData",
      },
    });

    aggregation.push({
      $unwind: {
        path: "$locationData",
        preserveNullAndEmptyArrays: true,
      },
    });
    aggregation.push({
      $project: {
        _id: 1,
        locationId: 1,
        certificateNumber: 1,
        certificateName: 1,
        issueDate: 1,
        certificateUrl: 1,
        validUntil: 1,
        status: 1,
        locationName: "$locationData.name",
      },
    });

    const result = await CertificateModel.aggregate(aggregation);

    return res.status(200).json({
      satus: 200,
      message: ["get all certificates"],
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: [error.message],
    });
  }
};

export {
  getAssesmentForUser,
  submitTestAttempt,
  enrollForCertificate,
  getAllCerificate,
};
