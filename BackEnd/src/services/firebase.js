import admin from 'firebase-admin';
import fs from 'fs';

let serviceAccount;

const secretFilePath = `/etc/secrets/FIREBASE_SERVICE_ACCOUNT_KEY`;

if (fs.existsSync(secretFilePath)) {
    serviceAccount = JSON.parse(fs.readFileSync(secretFilePath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
    console.warn('[Firebase] No service account found. Push notifications disabled.');
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


export const sendNotification = async ({ token, title, body, image, data = {} }) => {
    if (!serviceAccount) return; // skip silently in local dev
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

    console.log('Sending message:', message);

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
