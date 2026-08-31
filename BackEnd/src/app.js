import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { initSocket } from "./services/socket.js";

const app = express();

initSocket(app);

app.get("/ping", (req, res) => {
    res.status(200).send("pong");
});

app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? "*" : (origin, callback) => {
        // Allow any origin for now to prevent CORS issues on different Vercel deployments
        callback(null, true);
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
