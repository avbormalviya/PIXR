import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createNotification } from "../events/notification.js";

import { Chat } from "../models/chat.model.js";
import { ChatMessage } from "../models/message.mdel.js";
import { emit } from "../events/emit.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


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
    const { chatId, message } = req.query;

    if (!chatId) throw new ApiError(400, "chatId is required");
    if (!message && !req.files?.length) throw new ApiError(400, "message is required");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(400, "Chat not found");

    const messageFiles = await Promise.all(
        (req.files || []).map(async (file) => {
            const url = await uploadOnCloudinary(file);
            return url;
        })
    );

    const newMessage = await ChatMessage.create({
        sender: req.user._id,
        content: message,
        attachments: messageFiles,
        chat: chatId
    });

    if (!newMessage) throw new ApiError(400, "Failed to send message");

    // Update the last message of the chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id }, { new: true });

    // Increment unreadCount for the recipient(s), not the sender
    const participants = chat.participants.filter(
        (participantId) => participantId.toString() !== req.user._id.toString()
    );

    for (const participantId of participants) {
        const updatedChat = await Chat.findById(chatId);

        // Ensure unreadCount exists
        if (!updatedChat.unreadCount) updatedChat.unreadCount = {};

        // Increment unreadCount for the recipient
        updatedChat.unreadCount[participantId] = (updatedChat.unreadCount[participantId] || 0) + 1;

        await updatedChat.save();
    }

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

    res.status(200).json(
        new ApiResponse(200, fullMessage[0], "Message sent successfully")
    );
});



export {
    createOrGetOneOnOneChat,
    createOrGetAGroupChat,
    sendMessage
}
