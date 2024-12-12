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


const chatCommonAggregation = [
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
                }
            ]
        }
    },
]


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
        ...chatCommonAggregation
    ]);

    if (existingChat && existingChat.length > 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                existingChat[0],
                "Chat found"
            )
        );
    }

    const participantsIds = [user._id, req.user._id];

    const newChat = await Chat.create({
        participants: participantsIds,
    });
    
    if (!newChat) {
        throw new ApiError(400, "Failed to create chat");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            newChat,
            "Chat created successfully"
        )
    );
});


const createOrGetAGroupChat = asyncHandler(async (req, res) => {

});


const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, message } = req.query;

    if (!chatId) {
        throw new ApiError(400, "chatId is required");
    }

    if (!message && !req.files?.length) {
        throw new ApiError(400, "message is required");
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(400, "Chat not found");
    }
    
    const messageFiles = await Promise.all(
        (req.files || [])?.map( async (file) => {
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

    if (!newMessage) {
        throw new ApiError(400, "Failed to send message");
    }

    const updatedChat = await Chat.findByIdAndUpdate(chatId, {
        lastMessage: newMessage._id
    }, {
        new: true
    });

    if (!updatedChat) {
        throw new ApiError(400, "Failed to update chat");
    }

    const receivedMessage = await ChatMessage.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(newMessage._id)
            }
        },
    ]);

    if (!receivedMessage) {
        throw new ApiError(400, "Failed to get message");
    }

    emit(req.app.get("io"), chatId, "receiveMessage", receivedMessage[0]);

    res.status(200).json(
        new ApiResponse(
            200,
            newMessage,
            "Message sent successfully"
        )
    )
});


export {
    createOrGetOneOnOneChat,
    createOrGetAGroupChat,
    sendMessage
}
