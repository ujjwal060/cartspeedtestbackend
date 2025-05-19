import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import UserVideoProgress from '../../models/UserVideoProgress.js';
import { logger } from '../../utils/logger.js';


const getAssesmentForUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { locationId, sectionNumber, isSectionCompleted, sectionId } = req.body;

        let aggregation = await getAggregation(userId, locationId, sectionNumber, isSectionCompleted, sectionId);

        const result = await UserVideoProgress.aggregate(aggregation);

        return res.status(200).json({
            status: 200,
            message: ["video fetched successfully"],
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

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
    getAssesmentForUser
}