import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        message: {
            type: String
        },

        thumbnail: {
            type: String
        },

        asRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export const Notification = mongoose.model("Notification", notificationSchema);