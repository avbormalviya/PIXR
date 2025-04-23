// verifyJWTSocket.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";


export const verifyJWTSocket = async (socket, next) => {
    try {
        // 1. Try from cookie header
        const cookieHeader = socket.handshake.headers.cookie || "";
        const cookieToken = cookieHeader
            .split('; ')
            .find(c => c.startsWith("accessToken="))
            ?.split("=")[1];

        // 2. Try from Authorization header
        const authHeader = socket.handshake.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;

        const token = cookieToken || bearerToken;

        if (!token) throw new ApiError(401, "No token found. Unauthorized access");

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (!user) throw new ApiError(401, "User not found. Unauthorized access");

        socket.user = user;
        next();

    } catch (error) {
        next(new Error("Invalid or expired token. Unauthorized access"));
    }
};
