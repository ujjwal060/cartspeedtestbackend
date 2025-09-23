import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import admin from 'firebase-admin';
import Notification from '../../models/notificationModel.js';
import fs from "fs";

const secretName = 'cartfirebase';
const client = new SecretsManagerClient({ region: "us-east-1" });

const getFirebaseConfig = async () => {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if ('SecretString' in response) {
      return JSON.parse(response.SecretString);
    } else {
      const buff = Buffer.from(response.SecretBinary, 'base64');
      return JSON.parse(buff.toString('ascii'));
    }
  } catch (err) {
    console.error("Error fetching Firebase secret:", err);
    throw err;
  }
};

const initFirebase = async () => {
  if (!admin.apps.length) {
    const serviceAccount = await getFirebaseConfig();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase initialized with AWS secret");
  }
};

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
        await initFirebase();
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: deviceToken
        };

        const newUser = new Notification({
            userId,
            message:body,
            title,
        });
        await newUser.save();
        await admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error.message);
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