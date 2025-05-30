import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    registerUser,
    verifyEmail,
    userProfile,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    saveFCMToken,
    getUser,
    getUserProfile,
    getUserFollowerAndFollowing,
    searchUser,
    followUser,
    getSuggestedUsers,
    addStory,
    getStories,
    getStoryViews,
    getStoryOnlyFollowers,
    getChatFollowings,
    uploadPost,
    getUserPosts,
    getPosts,
    uploadReel,
    getUserReels,
    getReels,
    deleteFeed,
    addLike,
    getNotifications,
    markNotificationAsRead,
    addView,
    addRecentProfileOpened,
    getRecentProfileOpened,
    addBookmark,
    getBookmarks,
    addComment,
    getComments,
    getExploreFeeds,
    getUserAccount,
    updateAccount,
    getFeed,
    addReport

} from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(
    registerUser
);

router.route("/verifyEmail").post(
    verifyEmail
);

router.route("/userProfile").post(
    verifyJWT,
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "faceId", maxCount: 1 },
    ]),
    userProfile
)

router.route("/login").post(
    loginUser
);

router.route("/logout").post(
    verifyJWT,
    logoutUser
);

router.route("/refreshToken").post(
    refreshAccessToken
);

router.route("/changePassword").post(
    verifyJWT,
    changePassword
);

router.route("/saveFCMToken").post(
    verifyJWT,
    saveFCMToken
);

router.route("/getUser").get(
    verifyJWT,
    getUser
);

router.route("/getUserProfile/:username").get(
    verifyJWT,
    getUserProfile
);

router.route("/getUserFollowerAndFollowing/:username").get(
    verifyJWT,
    getUserFollowerAndFollowing
);

router.route("/getChatFollowings").get(
    verifyJWT,
    getChatFollowings
);

router.route("/searchUser").get(
    verifyJWT,
    searchUser
);

router.route("/followUser").post(
    verifyJWT,
    followUser
);

router.route("/getSuggestedUsers").get(
    verifyJWT,
    getSuggestedUsers
);

router.route("/addStory").post(
    verifyJWT,
    upload.array("storyFiles"),
    addStory
);

router.route("/getStories/:userName").get(
    verifyJWT,
    getStories
)

router.route("/getStoryViews/:storyId").get(
    verifyJWT,
    getStoryViews
);

router.route("/getStoryOnlyFollowers").get(
    verifyJWT,
    getStoryOnlyFollowers
);

router.route("/uploadPost").post(
    verifyJWT,
    upload.array("postFiles"),
    uploadPost
);

router.route("/getUserPosts/:username").get(
    verifyJWT,
    getUserPosts
);

router.route("/getPosts").get(
    verifyJWT,
    getPosts
);

router.route("/uploadReel").post(
    verifyJWT,
    upload.single("reelFiles"),
    uploadReel
);

router.route("/getUserReels/:username").get(
    verifyJWT,
    getUserReels
);

router.route("/getReels").get(
    verifyJWT,
    getReels
);

router.route("/deleteFeed").delete(
    verifyJWT,
    deleteFeed
);

router.route("/addLike").post(
    verifyJWT,
    upload.single("thumbnail"),
    addLike
);

router.route("/addView").post(
    verifyJWT,
    addView
);

router.route("/getNotifications").get(
    verifyJWT,
    getNotifications
);

router.route("/markNotificationAsRead").post(
    verifyJWT,
    markNotificationAsRead
);

router.route("/addRecentProfileOpened").post(
    verifyJWT,
    addRecentProfileOpened
);

router.route("/getRecentProfileOpened").get(
    verifyJWT,
    getRecentProfileOpened
);

router.route("/addBookmark").post(
    verifyJWT,
    addBookmark
);

router.route("/getBookmarks").get(
    verifyJWT,
    getBookmarks
);

router.route("/addComment").post(
    verifyJWT,
    addComment
);

router.route("/getComments/:id").get(
    verifyJWT,
    getComments
);

router.route("/getExploreFeeds").get(
    verifyJWT,
    getExploreFeeds
);

router.route("/getUserAccount").get(
    verifyJWT,
    getUserAccount
);

router.route("/updateAccount").post(
    verifyJWT,
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "faceId", maxCount: 1 },
    ]),
    updateAccount
);

router.route("/getFeed/:feedId/:feedType").get(
    verifyJWT,
    getFeed
);

router.route("/addReport").post(
    verifyJWT,
    addReport
);

export default router;
