import admin from 'firebase-admin';
import fs from 'fs';

// Path to your service account JSON file
const serviceAccountPath = `/etc/secrets/FIREBASE_SERVICE_ACCOUNT_KEY`;

// Read the JSON file synchronously
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


export const sendNotification = async ({ token, title, body, image, data = {} }) => {
    const message = {
        token,
        notification: {
            title,
            body,
            ...(image && { image }),
        },
        data: {
            ...data,
        },
        webpush: {
            notification: {
                title,
                body,
                ...(image && { image }),
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
