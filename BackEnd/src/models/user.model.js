import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema  = new Schema(
    {
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullName: {
            type: String,
            trim: true,
            index: true
        },

        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        password: {
            type: String,
            required: true
        },

        profilePic: {
            type: String
        },

        birthDate: {
            type: Date,
        },

        Private: {
            type: Boolean,
            default: false
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        bio: {
            type: String,
            default: "New on Pixr"
        },

        role: {
            type: String,
            default: "PixrStar"
        },

        verificationCode: {
            type: String
        },

        verificationCodeExpiresAt: {
            type: Date
        },

        recentProfileVisits: [
            {
                type: String
            }
        ],

        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            mobileNumber: this.mobileNumber
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)