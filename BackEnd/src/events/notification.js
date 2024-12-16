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

const deleteNotification = async (sender, receiver, message, thumbnail) => {
    try {
        await Notification.findOneAndDelete({
            sender,
            receiver,
            message,
            thumbnail
        });        
    } catch (error) {
        console.error("Error deleting notification:", error);        
    }
}

export {
    createNotification,
    deleteNotification
}