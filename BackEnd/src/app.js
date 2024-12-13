import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { initSocket } from "./services/socket.js";

const app = express();

initSocket(app);

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))

app.use(cors({
    origin: (origin, callback) => {
        console.log("Incoming request origin:", origin);
        const allowedOrigins = [
            "https://pixr-six.vercel.app",
            "http://192.168.29.35:5173",
            "http://localhost:5173"
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error("Blocked origin:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(express.json({
    limit: "10mb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}))

app.use(express.static("public"))

app.use(cookieParser())


import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/chats", chatRoutes);

app.use(errorHandler)


export default app;
