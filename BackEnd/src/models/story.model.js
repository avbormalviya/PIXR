import mongoose, { Schema } from "mongoose";

const storySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        story: [
            {
                type: String,
                required: true
            }
        ]
    },
    {
        timestamps: true
    }
)

export const Story = mongoose.model("Story", storySchema);