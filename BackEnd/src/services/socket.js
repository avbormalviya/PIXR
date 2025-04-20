import { createServer } from "http";
import { Server } from "socket.io";
import { verifyJWTSocket } from "../middlewares/verifyJWTSocket.js";
import { Chat } from "../models/chat.model.js";

const activeSockets = new Map();

const initSocket = (app) => {
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    "https://pixr-six.vercel.app",
                    "http://192.168.29.35:5173",
                    "http://localhost:5173"
                ];
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true
        }
    });

    io.use(verifyJWTSocket);
    app.set("io", io);

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        activeSockets.set(userId, socket.id);

        // Tell *everyone else* that this user is now online
        socket.broadcast.emit("userOnline", { userId });

        socket.on("onlineUsers", () => {
            const currentlyOnline = Array.from(activeSockets.keys()).filter((id) => id !== userId);
            socket.emit("onlineUsers", currentlyOnline);
        });

        console.log("New user connected:", userId, socket.id);


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
            console.log(`Received call-request from ${socket.user._id} to ${to}`);

            const recipientSocketId = activeSockets.get(to);
            console.log(`Recipient socket ID:`, recipientSocketId);

            if (recipientSocketId) {
                console.log(`Emitting call-request to ${recipientSocketId}`);
                socket.to(recipientSocketId).emit("call-request", { from: socket.user });
            } else {
                console.warn(`User ${to} is not connected.`);
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
            socket.to(roomId).emit("typing", { userName: socket.user.userName });
        });

        socket.on("stopTyping", (roomId) => {
            socket.to(roomId).emit("stopTyping", { userName: socket.user.userName });
        });

        // Leave Room
        socket.on("leaveRoom", (roomId) => {
            socket.leave(roomId);
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", userId, socket.id);
            socket.broadcast.emit("userOffline", { userId });
            activeSockets.delete(userId);
        });
    });

    httpServer.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://localhost:8000`);
    });
};

export { initSocket, activeSockets };
