import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
    {
        postTitle: {
            type: String,
            required: true
        },

        postFiles: {
            type: Array,
            required: true
        },

        postMp3: {
            type: Schema.Types.ObjectId,
            ref: "Music"
        },

        postOwner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        postHideLikes: {
            type: Boolean,
            default: false
        },

        postHideViews: {
            type: Boolean,
            default: false
        },

        postCommentsDisabled: {
            type: Boolean,
            default: false
        },

        postAiLabel: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export const Post = mongoose.model("Post", postSchema)