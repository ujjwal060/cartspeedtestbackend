import admin from 'firebase-admin';
import Notification from '../../models/notificationModel.js';
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync(new URL("../../firebase-service-account.json", import.meta.url)));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const createNotification = async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        const newNotification = new Notification({ userId, title, message });
        await newNotification.save();

        return res.status(200).json({
            status: 200,
            message: ['Notification created successfully.'],
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await Notification.find({ userId: userId }).sort({ createdAt: -1 });
        return res.status(200).json({
            status: 200,
            data: notifications,
            message: ['Get All Notification.'],
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        return res.status(200).json({
            status: 200,
            message: ['Notification deleted successfully.'],
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: [error.message],
        });
    }
}

const notification = async (userId, title, body, deviceToken) => {
    try {
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: deviceToken
        };

        const newUser = new Notification({
            userId,
            body,
            title,
        });
        await newUser.save();
        await admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });
    } catch (error) {
       console.error("❌ Notification error:", error.message);
    }
}


export {
    createNotification,
    getNotifications,
    deleteNotification,
    notification
}