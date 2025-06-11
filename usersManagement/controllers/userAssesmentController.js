import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import UserVideoProgress from '../../models/UserVideoProgress.js';
import UserTestAttempts from '../../models/userTestModel.js';
import QuestionModel from '../../models/questionModel.js';
import VideoModel from '../../models/videosModel.js';
import CertificateModel from '../../models/CertificateModel.js';
import { logger } from '../../utils/logger.js';


const getAssesmentForUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { locationId, sectionNumber, isSectionCompleted, sectionId } = req.body;
        logger.info(`Fetching assessment for user: ${userId}, location: ${locationId}, section: ${sectionNumber}`);

        let aggregation = await getAggregation(userId, locationId, sectionNumber, isSectionCompleted, sectionId);

        const result = await UserVideoProgress.aggregate(aggregation);

        logger.info(`Assessment fetched successfully for user: ${userId}`);

        return res.status(200).json({
            status: 200,
            message: ["video fetched successfully"],
            data: result
        });
    } catch (error) {
        logger.error(`Error fetching assessment for user: ${req.user?.userId}`, error.message);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

// const submitTestAttempt = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const {
//             locationId,
//             sectionId,
//             sectionNumber,
//             questions,
//             duration
//         } = req.body;

//         const questionIds = questions.map(q => q.questionId);
//         const correctQuestions = await QuestionModel.find({ _id: { $in: questionIds } });

//         let correctAnswers = 0;

//         const evaluatedQuestions = questions.map(q => {
//             const original = correctQuestions.find(oq => oq._id.toString() === q.questionId.toString());

//             const correctOption = original?.options.find(opt => opt.isCorrect);

//             const isCorrect = correctOption && correctOption._id.toString() === q.selectedOption.toString();

//             if (isCorrect) correctAnswers++;

//             return {
//                 questionId: q.questionId,
//                 selectedOption: q.selectedOption,
//                 correctOption: correctOption?._id.toString(),
//                 isCorrect
//             };
//         });

//         const totalQuestions = questions.length;
//         const score = Math.round((correctAnswers / totalQuestions) * 100);
//         const isPassed = score >= 60;

//         const todayStart = new Date();
//         todayStart.setHours(0, 0, 0, 0);
//         const todayEnd = new Date();
//         todayEnd.setHours(23, 59, 59, 999);

//         let userTest = await UserTestAttempts.findOne({
//             userId,
//             locationId,
//             sectionId
//         });

//         if (!userTest) {
//             userTest = new UserTestAttempts({
//                 userId,
//                 locationId,
//                 sectionId,
//                 sectionNumber,
//                 attempts: []
//             });
//         }

//         const todayAttempts = userTest.attempts.filter(attempt =>
//             new Date(attempt.attemptedAt) >= todayStart &&
//             new Date(attempt.attemptedAt) <= todayEnd
//         );

//         if (todayAttempts.length >= 3) {
//             return res.status(400).json({ message: "You have reached today's 3 attempt limit" });
//         }

//         const attemptNumber = userTest.attempts.length + 1;

//         userTest.attempts.push({
//             attemptNumber,
//             questions: evaluatedQuestions,
//             duration,
//             attemptedAt: new Date(),
//             score,
//             isPassed,
//             totalQuestions,
//             correctAnswers
//         });

//         if (isPassed && !userTest.isSectionCompleted) {
//             userTest.isSectionCompleted = true;
//             userTest.completedAt = new Date();
//             userTest.nextSectionUnlocked = true;
//         }

//         await userTest.save();

//         return res.status(200).json({
//             message: "Attempt submitted successfully",
//             data: {
//                 score,
//                 isPassed,
//                 totalQuestions,
//                 correctAnswers,
//                 attemptNumber,
//                 sectionCompleted: userTest.isSectionCompleted
//             }
//         });

//     } catch (error) {
//         return res.status(500).json({
//             status: 500,
//             message: [error.message],
//         });
//     }
// }

const submitTestAttempt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            locationId,
            sectionId,
            sectionNumber,
            questions,
            duration
        } = req.body;

        const questionIds = questions.map(q => q.questionId);
        const correctQuestions = await QuestionModel.find({ _id: { $in: questionIds } });

        let correctAnswers = 0;

        const evaluatedQuestions = questions.map(q => {
            const original = correctQuestions.find(oq => oq._id.toString() === q.questionId.toString());
            const correctOption = original?.options.find(opt => opt.isCorrect);
            const isCorrect = correctOption && correctOption._id.toString() === q.selectedOption.toString();
            if (isCorrect) correctAnswers++;
            return {
                questionId: q.questionId,
                selectedOption: q.selectedOption,
                correctOption: correctOption?._id.toString(),
                isCorrect
            };
        });

        const totalQuestions = questions.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const isPassed = score >= 60;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let userTest = await UserTestAttempts.findOne({ userId, locationId, sectionId });

        if (!userTest) {
            userTest = new UserTestAttempts({
                userId,
                locationId,
                sectionId,
                sectionNumber,
                attempts: []
            });
        }

        const todayAttempts = userTest.attempts.filter(attempt =>
            new Date(attempt.attemptedAt) >= todayStart &&
            new Date(attempt.attemptedAt) <= todayEnd
        );

        if (todayAttempts.length >= 3) {
            return res.status(400).json({ message: "You have reached today's 3 attempt limit" });
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
            correctAnswers
        });

        if (isPassed && !userTest.isSectionCompleted) {
            userTest.isSectionCompleted = true;
            userTest.completedAt = new Date();
            userTest.nextSectionUnlocked = true;
        }

        await userTest.save();

        const videoSections = await VideoModel.findOne({ location: locationId });
        if (!videoSections || !videoSections.sections) {
            return res.status(404).json({ message: "No sections found for this location" });
        }

        const sortedSections = [...videoSections.sections].sort((a, b) => a.sectionNumber - b.sectionNumber);
        const lastSection = sortedSections[sortedSections.length - 1];
        const lastSectionId = lastSection._id.toString();

        if (sectionId.toString() === lastSectionId && isPassed) {
            const allTests = await UserTestAttempts.find({ userId, locationId });

            let passedCount = 0;
            let totalScore = 0;

            for (const section of sortedSections) {
                const test = allTests.find(t => t.sectionId.toString() === section._id.toString());

                if (!test || !test.isSectionCompleted || !test.attempts.length) {
                    console.log(`❌ Section not completed or not attempted: ${section._id}`);
                    continue;
                }

                const lastAttempt = test.attempts[test.attempts.length - 1];

                if (lastAttempt.isPassed) {
                    passedCount++;
                    totalScore += lastAttempt.score;
                } else {
                    console.log(`❌ Section not passed: ${section._id}`);
                }
            }

            const isAllPassed = passedCount === sortedSections.length;

            if (isAllPassed) {
                const existing = await CertificateModel.findOne({ userId, locationId });
                if (!existing) {
                    const avgScore = totalScore / sortedSections.length;
                    let grade = '';
                    if (avgScore >= 90) grade = 'A+';
                    else if (avgScore >= 80) grade = 'A';
                    else if (avgScore >= 70) grade = 'B';
                    else if (avgScore >= 60) grade = 'C';
                    else grade = 'D';

                    await CertificateModel.create({
                        userId,
                        locationId,
                        totalScore: avgScore.toFixed(2),
                        grade,
                        issuedAt: new Date()
                    });

                    console.log("✅ Certificate generated for location:", locationId);
                }
            } else {
                console.log(`❌ Not all sections passed: ${passedCount}/${sortedSections.length}`);
            }
        }

        return res.status(200).json({
            message: "Attempt submitted successfully",
            data: {
                score,
                isPassed,
                totalQuestions,
                correctAnswers,
                attemptNumber,
                sectionCompleted: userTest.isSectionCompleted
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
};


const getAggregation = async (userId, locationId, sectionNumber, isSectionCompleted, sectionId) => {
    let aggregation = [];
    aggregation.push({
        $match: {
            userId: new ObjectId(userId)
        }
    })

    aggregation.push({
        $match: {
            locationId: new ObjectId(locationId)
        }
    })

    aggregation.push({
        $unwind: "$sections"
    })
    aggregation.push({
        $match: {
            "sections.sectionId": new ObjectId(sectionId),
        }
    })
    aggregation.push({
        $match: {
            "sections.isSectionCompleted": isSectionCompleted
        }
    })
    aggregation.push({
        $unwind: "$sections.videos"
    })

    aggregation.push({
        $group: {
            _id: "$sections.sectionId",
            videoIds: {
                $addToSet: "$sections.videos.videoId",
            },
        },
    })

    aggregation.push({
        $lookup: {
            from: "questions",
            let: {
                videoIds: "$videoIds",
                sectionId: "$_id"
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $in: ["$videoId", "$$videoIds"] },
                                { $eq: ["$sectionId", "$$sectionId"] },
                                { $eq: ["$locationId", new ObjectId(locationId)] },
                                { $eq: ["$sectionNumber", sectionNumber.toString()] }
                            ]
                        }
                    }
                }
            ],
            as: "questions"
        }
    });

    // aggregation.push({
    //     $project: {
    //         _id: 0,
    //         sectionId: "$_id",
    //         questions: {
    //             $slice: ["$questions", 10]
    //         }
    //     }
    // });

    aggregation.push({
        $project: {
            _id: 0,
            sectionId: "$_id",
            questions: {
                $map: {
                    input: { $slice: ["$questions", 10] },
                    as: "q",
                    in: {
                        _id: "$$q._id",
                        question: "$$q.question",
                        options: {
                            $map: {
                                input: "$$q.options",
                                as: "opt",
                                in: {
                                    text: "$$opt.text",
                                    isCorrect: "$$opt.isCorrect",
                                    _id: "$$opt._id"
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return aggregation;
}

export {
    getAssesmentForUser,
    submitTestAttempt
}