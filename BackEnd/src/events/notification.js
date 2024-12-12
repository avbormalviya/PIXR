import { Notification } from "../models/notification.model.js";
import { activeSockets } from "../services/socket.js";

const createNotification = async (io, sender, receiver, message, thumbnail) => {
    try {
        const notification = await Notification.create({
            sender,
            receiver,
            message,
            thumbnail
        });

        const receiverSocket = activeSockets.get(receiver.toString());

        if (!receiverSocket) {
            return;
        }

        io.to(receiverSocket).emit("notification", notification);

        return notification;

    } catch (error) {
        console.error("Error creating notification:", error);

        throw new Error("Error creating notification");
    }
}

export {
    createNotification
}