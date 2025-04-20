import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const updateLastOnline = async (userId) => {
    const user = await User.findById(userId);

    // Set the current date and time as the last online time
    user.lastSeen = new Date(); // Current timestamp
    await user.save();
};


export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "No token provided. Unauthorized access");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "User not found. Unauthorized access");
        }

        await updateLastOnline(user._id);

        req.user = user;

        next();

    } catch (error) {
        throw new ApiError(401, "Invalid or expired token. Unauthorized access");
    }
});
