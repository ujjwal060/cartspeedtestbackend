import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import goodLSVRuleModel from "../../models/goodLSVRulesModel.js";
import ruleRagulationLSVModel from "../../models/ruleAndRegulationLSVModel.js";
import UserLocation from "../../models/userLocationMap.js";
import Location from "../../models/locationModel.js";
import { logger } from "../../utils/logger.js";

const getGLSVRule = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userLoc = await UserLocation.findOne({
            userId: new ObjectId(userId),
            isCurrent: true
        });

        if (!userLoc) {
            return res.status(404).json({
                status: 404,
                message: ['Current user location not found']
            });
        }

        const userCoordinates = userLoc.coordinates.coordinates;
        logger.info('User Coordinates:', userCoordinates);

        const nearbyLocations = await Location.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: userCoordinates },
                    distanceField: "distance",
                    spherical: true,
                    maxDistance: 80467.2,
                    distanceMultiplier: 0.001
                }
            }
        ]);

        if (nearbyLocations.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ["No locations found within 50 miles radius"]
            });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);

        let aggregation = await filterAggregation(locationIds, nearbyLocations);

        const lsvRules = await goodLSVRuleModel.aggregate(aggregation)

        logger.info('LSV rules found:', lsvRules.length);

        if (lsvRules.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ["No LSV rules found for nearby locations"]
            });
        }

        return res.json({
            status: 200,
            message: ["Successfully found LSV rules for nearby locations"],
            data: lsvRules[0]
        });

    } catch (error) {
        logger.error('Error in getGLSVRule:', error);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const filterAggregation = async (locationIds, nearbyLocations) => {
    let aggregation = [];
    aggregation.push({
        $match: {
            locationId: { $in: locationIds }
        }
    })

    aggregation.push({
        $sort: {
            createdAt: -1
        }
    })

    aggregation.push({
        $group: {
            _id: "$locationId",
            latestRule: { $first: "$$ROOT" }
        }
    })

    aggregation.push({
        $replaceRoot: {
            newRoot: "$latestRule"
        }
    })

    aggregation.push({
        $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'location'
        }
    })
    aggregation.push({
        $unwind: '$location'
    })

    aggregation.push({
        $addFields: {
            'location.distance': {
                $let: {
                    vars: {
                        locId: '$locationId'
                    },
                    in: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: nearbyLocations,
                                    as: 'nearLoc',
                                    in: {
                                        $cond: {
                                            if: { $eq: ['$$nearLoc._id', '$$locId'] },
                                            then: '$$nearLoc.distance',
                                            else: null
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            'sections': {
                $map: {
                    input: '$sections',
                    as: 'section',
                    in: {
                        $mergeObjects: [
                            '$$section',
                            {
                                description: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: '$$section.description',
                                                find: '<p>',
                                                replacement: ''
                                            }
                                        },
                                        find: '</p>',
                                        replacement: ''
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    })

    aggregation.push({
        $project: {
            _id: 1,
            questions: 1,
            sections: 1,
            guidelines:1,
            createdAt: 1
        }
    })

    return aggregation;
}

const getRRLSVRule = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userLoc = await UserLocation.findOne({
            userId: new ObjectId(userId),
            isCurrent: true
        });

        if (!userLoc) {
            return res.status(404).json({
                status: 404,
                message: ['Current user location not found']
            });
        }

        const userCoordinates = userLoc.coordinates.coordinates;
        logger.info('User Coordinates:', userCoordinates);

        const nearbyLocations = await Location.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: userCoordinates },
                    distanceField: "distance",
                    spherical: true,
                    maxDistance: 80467.2,
                    distanceMultiplier: 0.001
                }
            }
        ]);

        if (nearbyLocations.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ["No locations found within 50 miles radius"]
            });
        }

        const locationIds = nearbyLocations.map(loc => loc._id);

        let aggregation = await filterAggregationRRLSV(locationIds, nearbyLocations);

        const lsvRules = await ruleRagulationLSVModel.aggregate(aggregation)

        logger.info('LSV rules found:', lsvRules.length);

        if (lsvRules.length === 0) {
            return res.status(404).json({
                status: 404,
                message: ["No LSV rules found for nearby locations"]
            });
        }

        return res.json({
            status: 200,
            message: ["Successfully found LSV rules for nearby locations"],
            data: lsvRules[0]
        });

    } catch (error) {
        logger.error('Error in getGLSVRule:', error);
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const filterAggregationRRLSV = async (locationIds, nearbyLocations) => {
    let aggregation = [];
    aggregation.push({
        $match: {
            locationId: { $in: locationIds }
        }
    })

    aggregation.push({
        $sort: {
            createdAt: -1
        }
    })

    aggregation.push({
        $group: {
            _id: "$locationId",
            latestRule: { $first: "$$ROOT" }
        }
    })

    aggregation.push({
        $replaceRoot: {
            newRoot: "$latestRule"
        }
    })

    aggregation.push({
        $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'location'
        }
    })
    aggregation.push({
        $unwind: '$location'
    })

    aggregation.push({
        $addFields: {
            'location.distance': {
                $let: {
                    vars: {
                        locId: '$locationId'
                    },
                    in: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: nearbyLocations,
                                    as: 'nearLoc',
                                    in: {
                                        $cond: {
                                            if: { $eq: ['$$nearLoc._id', '$$locId'] },
                                            then: '$$nearLoc.distance',
                                            else: null
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            'sections': {
                $map: {
                    input: '$sections',
                    as: 'section',
                    in: {
                        $mergeObjects: [
                            '$$section',
                            {
                                description: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: '$$section.description',
                                                find: '<p>',
                                                replacement: ''
                                            }
                                        },
                                        find: '</p>',
                                        replacement: ''
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    })

    aggregation.push({
        $project: {
            _id: 1,
            questions: 1,
            sections: 1,
            guidelines:1,
            createdAt: 1
        }
    })

    return aggregation;
}

export {
    getGLSVRule,
    getRRLSVRule
}