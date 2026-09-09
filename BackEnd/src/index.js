import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        // HTTP server is started by initSocket() in socket.js via httpServer.listen()
        // Do NOT call app.listen() here — that would bind a second server on the same port
        console.log("✅ MongoDB connected. Socket server is running on port 8000");
    })
    .catch((error) => {
        console.log("ERROR: error to connect to db ||", error);
    })