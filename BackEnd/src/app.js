import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { initSocket } from "./services/socket.js";

const app = express();

initSocket(app);

app.use(cors({
    origin: "*",
    credentials: true
}))

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
