import Notification from '../../models/notificationModel.js';

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
        const notifications = await Notification.findOne({userId:userId}).sort({ createdAt: -1 });
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

export{
    createNotification,
    getNotifications,
    deleteNotification
}