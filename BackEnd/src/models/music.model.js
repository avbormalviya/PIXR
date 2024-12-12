import mongoose, { Schema } from "mongoose";

const musicSchema = new Schema(
    {
        musicTitle: {
            type: String,
            required: true
        },

        musicSrc: {
            type: String,
            required: true
        },

        musicCover: {
            type: String,
        },

        musicDuration: {
            type: Number,
        },

        musicOwner: {
            type: Schema.type.ObjectId,
            ref: "User",
        }
    }
)

export const Music = mongoose.model("Music", musicSchema)