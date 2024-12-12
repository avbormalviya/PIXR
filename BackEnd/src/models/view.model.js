import mongoose, { Schema } from "mongoose";

const viewSchema = new Schema(
    {
        viewTo: {
            type: mongoose.Schema.Types.ObjectId,
        },

        viewType: {
            type: String,
            enum: ["post", "reel", "story"],
            required: true,
        },

        viewBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

export const View = mongoose.model("View", viewSchema);