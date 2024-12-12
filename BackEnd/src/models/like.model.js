import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        likeTo: {
            type: mongoose.Schema.Types.ObjectId,
        },

        likeType: {
            type: String,
            enum: ["post", "reel", "story", "comment"],
            required: true,
        },

        likeBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Like = mongoose.model("Like", likeSchema);