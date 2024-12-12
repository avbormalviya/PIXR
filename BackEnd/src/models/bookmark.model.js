import mongoose, { Schema } from "mongoose";

const saveFeedSchema = new Schema(
    {
        saveTo: {
            type: mongoose.Schema.Types.ObjectId,
        },

        saveType: {
            type: String,
            enum: ["post", "reel", "story", "comment"],
            required: true,
        },

        saveBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Save = mongoose.model("Save", saveFeedSchema);