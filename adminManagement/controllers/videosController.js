import mongoose from "mongoose";
import videoModel from "../models/videosModel.js";
import { logger } from "../../utils/logger.js";

const addVideos = async (req, res) => {
    try {
        const { title, description, locationState } = req.body;
        const uploadedBy = req.user.id;
        const url=req.fileLocations[0];

        if (!title || !url || !locationState || !uploadedBy) {
            return res.status(400).json({
                status: 400,
                message: ['Required fields are missing.'],
            });
        }

        const newVideo = new videoModel({
            title,
            url,
            description,
            locationState,
            uploadedBy
        });

        const savedVideo = await newVideo.save();

        return res.status(201).json({
            status: 201,
            message: ['Video uploaded successfully.'],
            data: savedVideo
        });

    } catch (error) {
        logger.error(`addVideos Error`, error.message );
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getAllVideos=async(req,res)=>{
    try{

    }catch(error){
        logger.error(`getAllVideos Error`, error.message );
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}
export {
    addVideos,
    getAllVideos
}