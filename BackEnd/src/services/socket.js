import { createServer } from "http";
import { Server } from "socket.io";
import { verifyJWTSocket } from "../middlewares/verifyJWTSocket.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { sendNotification } from "./firebase.js";

const activeSockets = new Map();


const updateLastOnline = async (userId) => {
    const user = await User.findById(userId);

    // Set the current date and time as the last online time
    user.lastSeen = new Date(); // Current timestamp
    await user.save();
};

const initSocket = (app) => {
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        pingTimeout: 20000,
        pingInterval: 10000,
        transports: ["websocket", "polling"],
        cors: {
            origin: (origin, callback) => {
                // Allow any origin for now to prevent CORS issues on different Vercel deployments
                callback(null, true);
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
        socket.on("call-request", async ({ to, signalData }) => {
            console.log(`Received call-request from ${socket.user._id} to ${to}`);

            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            console.log(`Recipient socket ID for ${targetId}:`, recipientSocketId);

            if (recipientSocketId) {
                console.log(`Emitting call-request to ${recipientSocketId}`);
                socket.to(recipientSocketId).emit("call-request", { from: socket.user, signalData });
            }

            // Always attempt FCM push notification in background/offline
            try {
                const targetUser = await User.findById(to).select("fcmToken");
                if (targetUser?.fcmToken) {
                    await sendNotification({
                        token: targetUser.fcmToken,
                        title: `📞 Incoming Call from ${socket.user.userName || socket.user.fullName || "Someone"}`,
                        body: "Tap to open PIXR and accept the video call.",
                        data: {
                            type: "incoming_call",
                            senderId: socket.user._id.toString(),
                            url: `/chat/call/${socket.user._id}`
                        }
                    });
                }
            } catch (fcmErr) {
                console.error("Call FCM Push Error:", fcmErr);
            }
        });


        socket.on("call-accepted", ({ from }) => {
            const targetId = from ? String(from) : null;
            const callerSocketId = activeSockets.get(targetId);
            if (callerSocketId) {
                socket.to(callerSocketId).emit("call-accepted", { to: socket.user._id });
            }
        });

        socket.on("call-rejected", ({ from }) => {
            const targetId = from ? String(from) : null;
            const callerSocketId = activeSockets.get(targetId);
            if (callerSocketId) {
                socket.to(callerSocketId).emit("call-rejected", { to: socket.user._id });
                socket.to(callerSocketId).emit("call-ended", { to: socket.user._id });
            }
        });

        socket.on("end-call", ({ to }) => {
            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("call-ended", { from: socket.user._id });
                socket.to(recipientSocketId).emit("call-rejected", { from: socket.user._id });
            }
        });

        socket.on("signal", ({ to, data }) => {
            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("signal", { data, from: socket.user._id });
            }
        });

        // Toggle Remote Camera
        socket.on("toggleCamera", ({ to, enabled }) => {
            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("toggleCamera", { enabled });
            }
        });

        socket.on("toggleMicrophone", ({ to, enabled }) => {
            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("toggleMicrophone", { enabled });
            }
        });

        socket.on("receiveMessage", ({ to, message }) => {
            const targetId = to ? String(to) : null;
            const recipientSocketId = activeSockets.get(targetId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit("receiveMessage", message); // send only message
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
            if (activeSockets.get(userId) === socket.id) {
                activeSockets.delete(userId);
                socket.broadcast.emit("userOffline", { userId });
                ( async () => await updateLastOnline(userId))();
            }
        });
    });

    httpServer.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://localhost:8000`);
    });
};

export { initSocket, activeSockets };
