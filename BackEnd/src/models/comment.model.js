import mongoose, { Schema } from "mongoose";

const CommentSchema = new Schema(
    {
        message: {
            type: String,
            required: true
        },

        commentTo: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'commentToType'
        },

        commentToType: {
            type: String,
            required: true,
            enum: ['post', 'reel']
        },

        commentBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Comment = mongoose.model("Comment", CommentSchema);
