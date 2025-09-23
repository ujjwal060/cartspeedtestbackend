import cron from 'node-cron';
import { notification } from '../usersManagement/controllers/notificationController.js';
import certificateModel from '../models/CertificateModel.js';
import userModel from '../models/userModel.js';

cron.schedule('0 2 * * *', async () => {
    try {
        const today = new Date();

        const certificates = await certificateModel.find({
            $expr: {
                $and: [
                    { $eq: [{ $year: "$validUntil" }, today.getFullYear()] },
                    { $eq: [{ $month: "$validUntil" }, today.getMonth() + 1] },
                    { $eq: [{ $dayOfMonth: "$validUntil" }, today.getDate()] }
                ]
            }
        }).populate("userId").populate("locationId");

        for (const cert of certificates) {
            if (cert?.userId?.deviceToken) {
                await notification(
                    cert.userId._id,
                    "Certificate Expiry Alert",
                    `Your certificate "${cert.certificateName}" at "${cert?.locationId?.name}" will expire today`,
                    cert.userId.deviceToken
                );
            }
        }
        console.log("✅ Daily certificate expiry check completed.");
    } catch (error) {
        console.error("❌ Error in cron job:", error.message);
    }
});