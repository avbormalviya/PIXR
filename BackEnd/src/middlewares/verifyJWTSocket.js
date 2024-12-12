// verifyJWTSocket.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWTSocket = async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) throw new ApiError(401, "No token provided. Unauthorized access");

        const token = cookieHeader
            .split('; ')
            .find(c => c.startsWith("accessToken="))
            ?.split("=")[1];

        if (!token) throw new ApiError(401, "Token not found in cookies. Unauthorized access");

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (!user) throw new ApiError(401, "User not found. Unauthorized access");

        socket.user = user;
        next();

    } catch (error) {
        next(new Error("Invalid or expired token. Unauthorized access"));
    }
};
