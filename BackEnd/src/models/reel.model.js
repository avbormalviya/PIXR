import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const reelSchema = new Schema(
    {
        reelTitle: {
            type: String,
            required: true
        },

        reelFile: {
            type: String,
            required: true
        },

        reelMp3: {
            type: Schema.Types.ObjectId,
            ref: "Music"
        },

        reelOwner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        reelHideLikes: {
            type: Boolean,
            default: false
        },

        reelHideViews: {
            type: Boolean,
            default: false
        },

        reelCommentsDisabled: {
            type: Boolean,
            default: false
        },

        reelAiLabel: {
            type: Boolean,
            default: false
        }
    }
)

reelSchema.plugin(aggregatePaginate);

export const Reel = mongoose.model("Reel", reelSchema);