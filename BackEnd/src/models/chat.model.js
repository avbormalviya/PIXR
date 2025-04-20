import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
    {
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage"
        },

        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        unreadCount: {
            type: Map,
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true
    }
)

export const Chat = mongoose.model("Chat", chatSchema);
