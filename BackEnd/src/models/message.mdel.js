import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        content: {
            type: String,
        },

        attachments: {
            type: [ {
                    url: String,
                    localPath: String,
                },
            ],

            default: [],
        },

        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
        },
    },
    {
        timestamps: true
    }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);