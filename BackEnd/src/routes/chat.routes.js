import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    createOrGetOneOnOneChat,
    createOrGetAGroupChat,
    sendMessage

} from "../controllers/chat.controllers.js";

const router = Router();

router.route("/createOrGetOneOnOneChat").post(
    verifyJWT,
    createOrGetOneOnOneChat
);

router.route("/createOrGetAGroupChat/:receiver").post(
    verifyJWT,
    createOrGetAGroupChat
);

router.route("/sendMessage").post(
    verifyJWT,
    upload.single("messageFile"),
    sendMessage
);

export default router;
