import cron from 'node-cron';
import { notification } from '../usersManagement/controllers/notificationController.js';
import certificateModel from '../models/CertificateModel.js';
import userModel from '../models/userModel.js';

cron.schedule('0 0 * * *', async () => {
    try {
        // const today = new Date();
        // const next7days = new Date();
        // next7days.setDate(today.getDate() + 7);

        const expiringCertificates = await certificateModel.find({
            // expiryDate: { $lte: next7days }
        }).populate("userId");

        for (const cert of expiringCertificates) {
            if (cert.userId?.deviceToken) {
                await notification(
                    cert.userId._id,
                    "Certificate Expiry Alert",
                    `Your certificate "${cert.name}" will expire on ${cert.expiryDate.toDateString()}`,
                    cert.userId.deviceToken
                );
            }
        }
        console.log("✅ Daily certificate expiry check completed.");
    } catch (error) {
        console.error("❌ Error in cron job:", error.message);
    }
});