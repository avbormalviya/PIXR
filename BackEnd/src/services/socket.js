import { createServer } from "https";
import { Server } from "socket.io";
import fs from 'fs';
import { verifyJWTSocket } from "../middlewares/verifyJWTSocket.js";
import { Chat } from "../models/chat.model.js";

const activeSockets = new Map();

const sslOptions = {
    key: fs.readFileSync("/etc/secrets/key"),
    cert: fs.readFileSync("/etc/secrets/cert"),
};

const initSocket = (app) => {
    const httpServer = createServer(sslOptions, app);
    const io = new Server(httpServer, {
        cors: {
            origin: [ "https://pixr-six.vercel.app", "http://192.168.29.35:5173", "http://localhost:5173" ],
            credentials: true
        }
    });

    io.use(verifyJWTSocket);
    app.set("io", io);

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        activeSockets.set(userId, socket.id);

        console.log("New user connected:", userId, socket.id);

        // Join Room
        socket.on("joinRoom", async (roomId) => {
            try {
                const chat = await Chat.findById(roomId);
                if (chat && chat.participants.includes(socket.user._id)) {
                    socket.join(roomId);
                } else {
                    console.error("Chat not found or user is not a participant");
                }
            } catch (error) {
                console.error("Error finding chat:", error);
            }
        });

        // Call Events
        socket.on("call-request", ({ to }) => {
            const recipientSocketId = activeSockets.get(to);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("call-request", { from: socket.user });
            }
        });

        socket.on("call-accepted", ({ from }) => {
            const callerSocketId = activeSockets.get(from);
            if (callerSocketId) {
                socket.to(callerSocketId).emit("call-accepted", { to: socket.user._id });
            }
        });

        socket.on("call-rejected", ({ from }) => {
            const callerSocketId = activeSockets.get(from);
            if (callerSocketId) {
                socket.to(callerSocketId).emit("call-rejected", { to: socket.user._id });
            }
        });

        socket.on("signal", ({ to, data }) => {
            const recipientSocketId = activeSockets.get(to);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("signal", { data, from: socket.user._id });
            }
        });

        // Toggle Remote Camera
        socket.on("toggleCamera", ({ to, enabled }) => {
            const recipientSocketId = activeSockets.get(to);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("toggleCamera", { enabled });
            }
        });

        // Typing Indicators
        socket.on("typing", (roomId) => {
            socket.to(roomId).emit("typing", { userId: socket.user._id });
        });

        socket.on("stopTyping", (roomId) => {
            socket.to(roomId).emit("stopTyping", { userId: socket.user._id });
        });

        // Leave Room
        socket.on("leaveRoom", (roomId) => {
            socket.leave(roomId);
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", userId, socket.id);
            activeSockets.delete(userId);
        });
    });

    httpServer.listen(process.env.PORT || 4000, () => {
        console.log(`Server is running on http://localhost:4000`);
    });
};

export { initSocket, activeSockets };
