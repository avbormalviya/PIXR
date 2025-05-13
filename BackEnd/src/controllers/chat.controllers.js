import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { activeSockets } from "../services/socket.js";

import { Chat } from "../models/chat.model.js";
import { ChatMessage } from "../models/message.mdel.js";
import { emit } from "../events/emit.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

import { sendNotification } from "../services/firebase.js";


export const chatCommonAggregation = (currentUserId) => [
    // Fetch all messages related to this chat
    {
        $lookup: {
            from: "chatmessages",
            localField: "_id",
            foreignField: "chat",
            as: "messages",
            pipeline: [
                {
                    $project: {
                        content: 1,
                        attachments: 1,
                        type: 1,
                        sender: 1,
                        createdAt: 1
                    }
                },
                { $sort: { createdAt: -1 } }, // latest first
                { $limit: 30 } // send recent 30 messages
            ]
        }
    },
    // Populate participants' details
    {
        $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
            pipeline: [
                {
                    $project: {
                        fullName: 1,
                        userName: 1,
                        profilePic: 1,
                        lastSeen: 1
                    }
                }
            ]
        }
    },
    // Exclude current user from participant list for frontend display
    {
        $addFields: {
            otherParticipant: {
                $first: {
                    $filter: {
                        input: "$participantDetails",
                        as: "user",
                        cond: { $ne: ["$$user._id", currentUserId] }
                    }
                }
            },
            lastMessage: { $first: "$messages" }
        }
    },
    {
        $project: {
            messages: 1,
            lastMessage: 1,
            otherParticipant: 1
        }
    }
];



// const chatMessageCommonAggregation = [
//     {
//         $lookup: {
//             from: "users",
//             localField: "sender",
//             foreignField: "_id",
//             as: "sender",
//             pipeline: [
//                 {
//                     $project: {
//                         profilePic: 1,
//                         username: 1,
//                         createdAt: 1,
//                     }
//                 }
//             ]
//         }
//     },
//     {
//         $addFields: {
//             sender: { $first: "$sender" }
//         }
//     }
// ]

const createOrGetOneOnOneChat = asyncHandler(async (req, res) => {
    const { receiver } = req.query;

    if (!receiver) {
        throw new ApiError(400, "receiver is required");
    }

    const user = await User.findOne({ userName: receiver });

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const existingChat = await Chat.aggregate([
        {
            $match: {
                participants: {
                    $all: [user._id, req.user._id]
                }
            }
        },
        ...chatCommonAggregation(req.user._id)
    ]);

    if (existingChat && existingChat.length > 0) {
        // Reset unreadCount for current user
        await Chat.findByIdAndUpdate(existingChat[0]._id, {
            $set: { [`unreadCount.${req.user._id}`]: 0 }
        });

        return res.status(200).json(
            new ApiResponse(200, existingChat[0], "Chat found")
        );
    }

    // Create new chat if not found
    const newChat = await Chat.create({
        participants: [user._id, req.user._id]
    });

    // Return chat with populated data (run aggregation again)
    const populatedNewChat = await Chat.aggregate([
        {
            $match: { _id: newChat._id }
        },
        ...chatCommonAggregation(req.user._id)
    ]);

    res.status(200).json(
        new ApiResponse(200, populatedNewChat[0], "Chat created successfully")
    );
});



const createOrGetAGroupChat = asyncHandler(async (req, res) => {

});


const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, message, messageType, tempId } = req.body;

    if (!chatId) throw new ApiError(400, "chatId is required");
    if (!message && !req.file) throw new ApiError(400, "message is required");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(400, "Chat not found");

    let messageFiles = null;

    if (req.file) {
        messageFiles = await uploadOnCloudinary(req.file.path);

        if (!messageFiles) throw new ApiError(400, "Failed to upload attachment");
    }

    if (messageFiles) {
        req.app.get("io").to(chatId).emit("attachment", {
            id: tempId,
            url: messageFiles.url
        })
    }

    const newMessage = await ChatMessage.create({
        sender: req.user._id,
        content: message,
        attachments: messageFiles?.url || null,
        type: messageType || 'TEXT',
        chat: chatId
    });

    if (!newMessage) throw new ApiError(400, "Failed to send message");

    const participants = chat.participants.filter(id => id.toString() !== req.user._id.toString());

    const updateUnreadCount = {};
    participants.forEach(id => {
        updateUnreadCount[`unreadCount.${id.toString()}`] = 1;
    });

    const updatedChat = await Chat.findByIdAndUpdate(chatId, {
        lastMessage: newMessage._id,
        $inc: updateUnreadCount
    }, { new: true });

    participants.forEach(id => {
        const socketId = activeSockets.get(id.toString());
        if (!socketId) return;  // they’re offline or not connected

        // Make sure you’re using the same key type that your schema uses (Map vs Object)
        const unreadTotal = updatedChat.unreadCount.get
          ? updatedChat.unreadCount.get(id.toString())     // if you used a Map in Mongoose
          : updatedChat.unreadCount[id.toString()];       // if you used a plain object

        req.app.get("io").to(socketId).emit("unreadCountUpdated", {
            chatId,
            senderId: req.user._id.toString(),
            unreadCount: unreadTotal || 0
        });
    });

    const fullMessage = await ChatMessage.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(newMessage._id) } },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    { $project: { userName: 1, fullName: 1, profilePic: 1 } }
                ]
            }
        },
        { $unwind: "$sender" }
    ]);

    if (!fullMessage?.[0]) throw new ApiError(400, "Failed to fetch message");

    sendNotification({
        token: updatedChat.participants.find(id => id.toString() !== req.user._id.toString()).fcmToken,
        title: "New message from ${fullMessage[0].sender.username}",
        body: `"${message}" - Open Pixr to reply.`,
        image: sender.profilePic,
        data: {
            type: "new_message",
            senderId: sender.id,
            messageId: newMessage._id
        }
    })



    res.status(200).json(
        new ApiResponse(200, fullMessage[0], "Message sent successfully")
    );
});



export {
    createOrGetOneOnOneChat,
    createOrGetAGroupChat,
    sendMessage
}
