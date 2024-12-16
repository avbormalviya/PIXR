import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
    {
        reportBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        
        report: {
            type: "String",
            required: true
        }
    }
)

export const Report = mongoose.model("Report", reportSchema);