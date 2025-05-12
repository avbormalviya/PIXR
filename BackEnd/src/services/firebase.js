import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your service account JSON file
const serviceAccountPath = `/etc/secrets/FIREBASE_SERVICE_ACCOUNT_KEY`;

// Read the JSON file synchronously
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Debugging: Ensure that serviceAccount is valid
console.log(serviceAccount);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async ({ token, title, body, image, data = {} }) => {
    const message = {
        notification: {
            title,
            body,
            ...(image && { image }), // Only add image if provided
        },
        token,
        data: {
            ...data, // Send custom key-values like type: 'call', postId, etc.
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
