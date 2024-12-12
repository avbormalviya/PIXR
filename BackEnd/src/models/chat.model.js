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
    },
    {
        timestamps: true
    }
)

export const Chat = mongoose.model("Chat", chatSchema);