import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Connection } from "../models/connection.model.js";
import { Story } from "../models/story.model.js";
import { Post } from "../models/post.model.js";
import { sendVerificationEmail } from "../utils/mails.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { Like } from "../models/like.model.js";
import { createNotification, deleteNotification } from "../events/notification.js";
import { Notification } from "../models/notification.model.js";
import { Reel } from "../models/reel.model.js";
import { View } from "../models/view.model.js";
import { Save } from "../models/bookmark.model.js";
import { Comment } from "../models/comment.model.js";
import { Report } from "../models/report.model.js";
import { Chat } from "../models/chat.model.js";
import { sendNotification } from "../services/firebase.js";


function euclideanDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

async function matchUser(user, descriptor) {
    if (descriptor) {
        const THRESHOLD = 0.38; // tweak this based on test results

        const dist = euclideanDistance(user.descriptor, descriptor);
        console.log(`Distance to ${user.userName}:`, dist); // helpful debug!
        return dist < THRESHOLD;
    }

    return false;
}


const cookieOptions = {
    accessToken: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: "pixr-backend.onrender.com",
        maxAge: process.env.ACCESS_TOKEN_EXPIRY
    },

    refreshToken: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: "pixr-backend.onrender.com",
        maxAge: process.env.REFRESH_TOKEN_EXPIRY
    },

    removeCookieOptions: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: "pixr-backend.onrender.com",
        path: "/",
    }
}

const generateAccessAndRefreshToken = async (user_id) => {
    try {
        const user = await User.findById(user_id);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh token");
    }
}


const registerUser = asyncHandler( async (req, res) => {
    const { email, password, userName } = req.body;

    if (email?.trim() == "") {
        throw new ApiError(400, "Email cannot be empty");
    }

    if (
        [ password, userName ].some(
            (field) => field ?.trim() === ""
        )
    ) {
        throw new ApiError(400, `${field} cannot be empty`);
    }

    const existedUser = await User.findOne({
        $or: [
            { email },
            { userName }
        ]
    });

    if (existedUser) {
        throw new ApiError(400, "User already exists");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const user = await User.create({
        email,
        password,
        userName,
        verificationCode,
        verificationCodeExpiresAt: Date.now() + 10 * 60 * 1000,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken").lean();

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    // try {
    //     await sendVerificationEmail(email, userName, verificationCode);
    // } catch (error) {
    //     throw new ApiError(500, "Failed to send verification email", error);
    // }

    res.status(201).json(
        new ApiResponse(200, createdUser, "Mail sent successfully")
    )
})


const verifyEmail = asyncHandler( async (req, res) => {
    const { verificationCode } = req.body;

    const user = await User.findOne({ verificationCode });

    if (!user) {
        throw new ApiError(400, "Invalid verification code");
    }

    if (Date.now() > user.verificationCodeExpiresAt) {
        throw new ApiError(400, "Verification code expired");
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions.accessToken)
        .cookie("refreshToken", refreshToken, cookieOptions.refreshToken)
        .json(
            new ApiResponse(200, {accessToken, refreshToken}, "User verified successfully")
        )
})


const userProfile = asyncHandler( async (req, res) => {
    const { fullName, birthDate, descriptor } = req.body;

    if (!fullName?.trim()) {
        throw new ApiError(400, "Full name cannot be empty");
    }
    if (!birthDate?.trim()) {
        throw new ApiError(400, "Birth date cannot be empty");
    }

    const profilePic = req.files["profilePic"]?.[0];
    const faceId = req.files["faceId"]?.[0];

    const profilePicCloudPath = await uploadOnCloudinary(profilePic?.path);
    const faceIdCloudPath = await uploadOnCloudinary(faceId?.path);

    if (!profilePicCloudPath) {
        throw new ApiError(500, "Failed to upload profile picture");
    }

    if (!faceIdCloudPath) {
        throw new ApiError(500, "Failed to upload face id");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(500, "Failed to update user profile");
    }

    user.fullName = fullName;
    user.birthDate = birthDate;
    user.profilePic = profilePicCloudPath.secure_url;
    user.faceId = faceIdCloudPath.secure_url;

    let plainDescriptor = [];

    if (typeof descriptor === "string") {
        plainDescriptor = descriptor.split(",").map(Number);
    } else {
        plainDescriptor = descriptor;
    }

    user.descriptor = plainDescriptor;

    await user.save({ validateBeforeSave: false });

    sendNotification({
        token: user.fcmToken,
        title: "Welcome to Pixr",
        body: "Your profile has been created successfully",
        image: profilePicCloudPath.secure_url,
        data: {
            type: "image"
        }
    })

    res.status(200).json(
        new ApiResponse(200, user, "User profile created successfully")
    )
})


const loginUser = asyncHandler( async (req, res) => {
    const { userName, email, password, descriptor } = req.body;

    const trimmedUserName = userName?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if ((!trimmedUserName && !trimmedEmail) || (!trimmedPassword && !descriptor)) {
        throw new ApiError(400, "All fields are required");
    }

    const query = {};
    if (trimmedUserName) query.userName = trimmedUserName;
    if (trimmedEmail) query.email = trimmedEmail;

    const user = await User.findOne(query);

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    let isMatch = false;

    if (password?.trim()) {
        isMatch = await user.matchPassword(password);
    } else if (descriptor) {
        isMatch = await matchUser(user, descriptor);
    }

    if (!isMatch) {
        const type = trimmedPassword ? "password" : "face descriptor";
        throw new ApiError(400, `Incorrect ${type}`);
    }

    let filteredUser = user.toObject();
    delete filteredUser.password;
    delete filteredUser.refreshToken;
    delete filteredUser.descriptor;

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions.accessToken)
        .cookie("refreshToken", refreshToken, cookieOptions.refreshToken)
        .json(
            new ApiResponse(200, {user: filteredUser, accessToken, refreshToken}, "Login successful")
        )

})


const logoutUser = asyncHandler( async (req, res) => {
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {
            new: true
        }
    )

    res
        .status(200)
        .clearCookie("accessToken", cookieOptions.removeCookieOptions)
        .clearCookie("refreshToken", cookieOptions.removeCookieOptions)
        .json(
            new ApiResponse(200, null, "Logout successful")
        )
})


const refreshAccessToken = asyncHandler( async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        throw new ApiError(400, "unauthorized access");
    }

    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
        throw new ApiError(400, "unauthorized access");
    }

    if (user.refreshToken !== refreshToken) {
        throw new ApiError(400, "unauthorized access");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user);

    user.refreshToken = newRefreshToken;
    user.save({ validateBeforeSave: false });

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions.accessToken)
        .cookie("refreshToken", newRefreshToken, cookieOptions.refreshToken)
        .json(
            new ApiResponse(200, user, "Refresh access token successful")
        )
})


const changePassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if ( !oldPassword?.trim() || !newPassword?.trim() ) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
        throw new ApiError(400, "Incorrect password");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
    )
})


const saveFCMToken = asyncHandler( async (req, res) => {
    const { fcmToken } = req.body;

    if (!fcmToken?.trim()) {
        throw new ApiError(400, "FCM token is required");
    }

    await User.findOneAndUpdate(
        { _id: req.user._id },
        {
            $set: {
                fcmToken
            }
        },
        {
            new: true
        }
    )

    res.status(200).json(
        new ApiResponse(200, null, "FCM token saved successfully")
    )
})


const getUser = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField: "user",
                as: "stories"
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                profilePic: 1,
                Private: 1,
                stories: 1,
                fcmToken: 1
            }
        }
    ])

    if (!user.length) {
        throw new ApiError(400, "User not found");
    }

    res.status(200).json(
        new ApiResponse(200, user[0], "User retrieved successfully")
    )
})


const getUserProfile = asyncHandler( async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "User name is required");
    }

    const profile = await User.aggregate([
        {
            $match: {
                userName: username?.trim()
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "followed",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "follower",
                as: "followings"
            }
        },
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField: "user",
                as: "stories"
            }
        },
        {
            $addFields: {
                followersCount: {
                    $size: "$followers"
                },
                followingCount: {
                    $size: "$followings"
                },
                isFollower: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$followers.follower"]
                        },
                        then: true,
                        else: false
                    }
                },
                hasStories: {
                    $cond: {
                        if: { $gt: [{ $size: "$stories" }, 0] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                profilePic: 1,
                followersCount: 1,
                followingCount: 1,
                isFollower: 1,
                Private: 1,
                hasStories: 1,
                bio: 1,
                role: 1,
            }
        }
    ])

    if (!profile.length) {
        throw new ApiError(400, "User not found");
    }

    const visitedUser = await User.findById(req.user._id);

    sendNotification({
        token: profile[0].fcmToken,
        title: `${visitedUser.userName} viewed your profile`,
        body: `Someone’s curious about you.`,
        data: {
            type: "profile_visit",
            visitorUsername: visitedUser.userName,
        }
    })

    res.status(200).json(
        new ApiResponse(200, profile[0], "User profile retrieved successfully")
    )
})


const getUserFollowerAndFollowing = asyncHandler( async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "User name is required");
    }

    const followersAndFollowing = await User.aggregate([
        {
            $match: {
                userName: username?.trim()
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "followed",
                as: "followers",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "follower",
                            foreignField: "_id",
                            as: "userDetails",
                            pipeline: [
                                {
                                    $project: {
                                        password: 0,
                                        refreshToken: 0,
                                        email: 0,
                                        isVerified: 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$userDetails"
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                _id: "$userDetails._id",
                                fullName: "$userDetails.fullName",
                                userName: "$userDetails.userName",
                                profilePic: "$userDetails.profilePic",
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "follower",
                as: "followings",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "followed",
                            foreignField: "_id",
                            as: "userDetails",
                            pipeline: [
                                {
                                    $project: {
                                        password: 0,
                                        refreshToken: 0,
                                        email: 0,
                                        isVerified: 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$userDetails"
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                _id: "$userDetails._id",
                                fullName: "$userDetails.fullName",
                                userName: "$userDetails.userName",
                                profilePic: "$userDetails.profilePic",
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                followers: 1,
                followings: 1,
            }
        }
    ])

    if (!followersAndFollowing.length) {
        throw new ApiError(400, "Followers and followings not found");
    }

    res.status(200).json(
        new ApiResponse(200, followersAndFollowing[0], "Followers and followings retrieved successfully")
    )
})

const getChatFollowings = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Step 1: Get followings of the current user
        const followings = await Connection.find({ follower: currentUserId })
            .populate({
                path: "followed",
                select: "fullName userName profilePic isOnline"
            });

        const chatList = [];

        for (const following of followings) {
            const user = following.followed;

            if (!user) continue;

            // Step 2: Get the existing chat between the current user and the following user
            const existingChat = await Chat.findOne({
                participants: { $all: [currentUserId, user._id] }
            })
                .populate({
                    path: 'lastMessage',
                    populate: {
                        path: 'sender', // Populate sender of the last message
                        select: 'userName' // Select only the userName of the sender
                    }
                })
                .lean();

            chatList.push({
                _id: user._id,
                fullName: user.fullName,
                userName: user.userName,
                profilePic: user.profilePic,
                chatId: existingChat?._id || null,
                lastMessage: existingChat?.lastMessage ? {
                    content: existingChat.lastMessage.content,
                    sender: existingChat.lastMessage.sender.userName // Include sender's userName
                } : null,
                unreadCount: existingChat?.unreadCount?.[currentUserId] || 0,
            });
        }

        res.status(200).json(
            new ApiResponse(200, chatList, "Chat followings loaded")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});




const searchUser = asyncHandler( async (req, res) => {
    const userName = req.query.query;

    if (!userName?.trim()) {
        throw new ApiError(400, "User name is required");
    }

const users = await User.aggregate([
        {
            $match: {
                userName: {
                    $regex: userName?.trim(),
                    $options: 'i'
                },
                _id: { $ne: req.user._id },
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "followed",
                as: "followers"
            }
        },
        {
            $addFields: {
                isFollower: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$followers.follower"]
                        },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                profilePic: 1,
                isFollower: 1
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, users, "User profile retrieved successfully")
    )
})


const followUser = asyncHandler( async (req, res) => {
    const { userName } = req.body;

    if (!userName?.trim()) {
        throw new ApiError(400, "User name is required");
    }

    const user = await User.findById(req.user?._id);
    const followedUser = await User.findOne({ userName: userName?.trim() });

    if (!followedUser || !user) {
        throw new ApiError(400, "User not found");
    }

    if (user._id.toString() === followedUser._id.toString()) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    const isFollowing = await Connection.exists({
        follower: user._id,
        followed: followedUser._id
    });

    const isFollowedBack = await Connection.exists({
        follower: followedUser._id,
        followed: user._id
    });

    const connection = await Connection.findOne({ follower: user._id, followed: followedUser._id });

    if (connection) {
        await Connection.deleteOne({ follower: user._id, followed: followedUser._id });

        await createNotification(
            req.app.get("io"),
            req.user._id,
            followedUser._id,
            `has unFollowed you.`,
            "empty"
        );

        return res.status(200).json(
            new ApiResponse(200, null, "User unfollowed successfully")
        )
    }

    else if (followedUser.Private) {
        await createNotification(
            req.app.get("io"),
            req.user._id,
            followedUser._id,
            isFollowedBack ? `has started following you back.` : `has sent a follow request.`,
            isFollowedBack ? "empty" : "Accept",
        );

        return res.status(200).json(
            new ApiResponse(200, null, "Follow request sent successfully")
        )
    }

    else {
        const newConnection = await Connection.create({
            follower: user._id,
            followed: followedUser._id
        })

        sendNotification({
            token: followedUser.fcmToken,
            title: "You’ve got a new follower!",
            body: `${user.userName} just started following you.`,
            data: {
                type: "new_follower",
                followerUsername: user.userName
            }
        })


        await createNotification(
            req.app.get("io"),
            req.user._id,
            followedUser._id,
            `is now following you.`,
            isFollowedBack ? "empty" : "Follow Back"
        );
    }


    const followersCount = await Connection.countDocuments({ followed: followedUser._id });
    const isFollower = await Connection.findOne({ follower: user._id, followed: followedUser._id });

    res.status(200).json(
        new ApiResponse(200, { followersCount, isFollower }, "User followed successfully")
    )
})


const getSuggestedUsers = asyncHandler( async (req, res) => {
    const users = await User.aggregate([
        {
            $match: {
                _id: { $ne: req.user?._id }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: 6
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "followed",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField: "user",
                as: "stories"
            }
        },
        {
            $addFields: {
                hasStories: {
                    $cond: {
                        if: { $gt: [{ $size: "$stories" }, 0] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                isFollower: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$followers.follower"]
                        },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                profilePic: 1,
                hasStories: 1,
                isFollower: 1
            }
        }
    ]);

    if (!users.length) {
        throw new ApiError(500, "Internal server error");
    }

    res.status(200).json(
        new ApiResponse(200, users, "Suggested users retrieved successfully")
    )
})


const addStory = asyncHandler( async (req, res) => {
    const storyFiles = req.files;

    if (!storyFiles?.length) {
        throw new ApiError(400, "Story is required");
    }

    const storyUrls = await Promise.all(
        storyFiles.map(async (file) => {
            const url = await uploadOnCloudinary(file.path);

            if (!url) {
                throw new ApiError(500, "Internal server error during file upload");
            }

            return url.secure_url;
        })
    );

    if (!storyUrls.length) {
        throw new ApiError(500, "Internal server error");
    }

    const existingStory = await Story.findOne({ user: req.user?._id });

    if (existingStory) {
        existingStory.story = [...existingStory.story, ...storyUrls];

        await existingStory.save();

        res.status(200).json(
            new ApiResponse(200, existingStory, "Story added successfully")
        )
    }

    else {
        const newStory = await Story.create({
            user: req.user._id,
            story: storyUrls
        })

        res.status(200).json(
            new ApiResponse(200, newStory, "Story added successfully")
        )
    }
})


const getStories = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    const user = await User.findOne({ userName });

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    if (user._id.toString() !== req.user._id.toString() && user.Private) {
        const isFollower = await Connection.exists({
            followed: user._id,
            follower: req.user._id,
        });

        if (!isFollower) {
            throw new ApiError(400, "User is private");
        }
    }

    const stories = await Story.aggregate([
        {
            $match: {
                user: user._id,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: "$user",
        },
        {
            $project: {
                story: 1,
                userInfo: {
                    _id: "$user._id",
                    fullName: "$user.fullName",
                    userName: "$user.userName",
                    profilePic: "$user.profilePic",
                },
            },
        },
    ]);

    if (!stories || stories.length === 0) {
        throw new ApiError(500, "No stories found");
    }

    const viewer = await View.findOne({
        _id: req.user._id,
    });

    sendNotification({
        token: user.fcmToken,
        title: `${viewer.userName} viewed your story`,
        body: `See who else has watched it on Pixr.`,
        data: {
            type: "story_view",
            viewerUsername: viewer.userName
        }
    })

    res.status(200).json(
        new ApiResponse(200, stories, "Stories retrieved successfully")
    );
});


const getStoryViews = asyncHandler(async (req, res) => {

    const { storyId } = req.params;

    const stories = await View.aggregate([
        {
            $match: {
                viewTo: new mongoose.Types.ObjectId(storyId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "viewBy",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $group: {
                _id: "$viewBy",
                user: { $first: "$user" }
            }
        },
        {
            $project: {
                user: {
                    fullName: 1,
                    userName: 1,
                    profilePic: 1
                }
            }
        }
    ]);


    res.status(200).json(
        new ApiResponse(200, stories, "Stories retrieved successfully")
    )
})


const deleteFeed = asyncHandler(async (req, res) => {
    const { feedId, feedType } = req.body;

    if (!feedId || !feedType) {
        throw new ApiError(400, "Feed id and type are required");
    }

    if (feedType === "reel") {
        const reel = await Reel.findById(feedId);
        if (reel && reel.reelOwner.toString() === req.user._id.toString()) {
            await Reel.findByIdAndDelete(feedId);
        }
    }
    else if (feedType === "story") {
        const story = await Story.findById(feedId);
        if (story && story.user.toString() === req.user._id.toString()) {
            await Story.findByIdAndDelete(feedId);
        }
    }
    else if (feedType === "post") {
        const post = await Post.findById(feedId);
        if (post && post.postOwner.toString() === req.user._id.toString()) {
            await Post.findByIdAndDelete(feedId);
        }
    }
    else {
        throw new ApiError(400, "Invalid feed type");
    }

    res.status(200).json(
        new ApiResponse(200, null, "Feed deleted successfully")
    )
})


const getStoryOnlyFollowers = asyncHandler(async (req, res) => {

    const followersWithStories = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "connections",
                localField: "_id",
                foreignField: "follower",
                as: "following"
            }
        },
        {
            $unwind: "$following"
        },
        {
            $lookup: {
                from: "stories",
                localField: "following.followed",
                foreignField: "user",
                as: "story"
            }
        },
        {
            $unwind: "$story"
        },
        {
            $lookup: {
                from: "users",
                localField: "story.user",
                foreignField: "_id",
                as: "storyUser"
            }
        },
        {
            $unwind: "$storyUser"
        },
        {
            $group: {
                _id: "$storyUser.userName",
                userInfo: {
                    $first: {
                        userName: "$storyUser.userName",
                        profilePic: "$storyUser.profilePic"
                    }
                },
                stories: { $addToSet: "$story" }
            }
        },
        {
            $sort: {
                "stories.updatedAt": -1,
                "stories.createdAt": -1
            }
        },
        {
            $project: {
                _id: 0,
                userInfo: 1,
                stories: 1
            }
        }
    ]);


    res.status(200).json(
        new ApiResponse(200, followersWithStories, "Followers with stories retrieved successfully")
    );
});


const uploadPost = asyncHandler( async (req, res) => {
    const { postTitle, postHideLikes, postHideViews, postCommentsDisabled, postAiLabel } = req.body;

    if (!postTitle) {
        throw new ApiError(400, "Post title is required");
    }

    const postFilesArray = req.files;

    if (!postFilesArray) {
        throw new ApiError(400, "Post files are required");
    }

    const postUrls = await Promise.all(
        postFilesArray.map(async (file) => {
            const url = await uploadOnCloudinary(file.path);

            if (!url) {
                throw new ApiError(500, "Internal server error during file upload");
            }

            return url.secure_url;
        })
    );

    const newPost = await Post.create({
        postTitle,
        postFiles: postUrls,
        postOwner: req.user._id,
        postHideLikes,
        postHideViews,
        postCommentsDisabled,
        postAiLabel
    })

    res.status(200).json(
        new ApiResponse(200, newPost, "Post created successfully")
    )
})


const getUserPosts = asyncHandler( async (req, res) => {

    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "User name is required");
    }

    const user = await User.findOne({ userName: username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const posts = await Post.aggregate([
        {
            $match: {
                postOwner: user._id
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likeTo",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }
            }
        }
    ]);

    if (user.Private && !req.user._id.equals(user._id)) {

        const connection = await Connection.findOne({
            follower: req.user._id,
            followed: user._id
        });

        if (!connection) {
            return res.status(200).json(
                new ApiResponse(200, null, "User is private")
            )
        }


        return res.status(200).json(
            new ApiResponse(200, posts, "User posts retrieved successfully")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, posts, "Posts retrieved successfully")
    )
})


const getPosts = asyncHandler(async (req, res) => {
    const { limit = 10, lastPostId } = req.query;

    const parsedLimit = parseInt(limit, 10);

    let query = {};

    if (lastPostId && mongoose.Types.ObjectId.isValid(lastPostId)) {
        query = { _id: { $lt: new mongoose.Types.ObjectId(lastPostId) } };
    }

    const posts = await Post.aggregate([
        {
            $match: query
        },
        {
            $sort: { _id: -1 }
        },
        {
            $limit: parsedLimit
        },
        {
            $lookup: {
                from: "users",
                localField: "postOwner",
                foreignField: "_id",
                as: "postOwner"
            }
        },
        {
            $unwind: "$postOwner"
        },
        {
            $lookup: {
                from: "connections",
                localField: "postOwner._id",
                foreignField: "followed",
                as: "followers"
            }
        },
        {
            $addFields: {
                isFollower: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$followers.follower"]
                        },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likeTo",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "saves",
                localField: "_id",
                foreignField: "saveTo",
                as: "savedFeeds"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "commentTo",
                as: "comments"
            }
        },
        {
            $lookup: {
                from: "stories",
                localField: "postOwner._id",
                foreignField: "user",
                as: "stories"
            }
        },
        {
            $addFields: {
                hasStories: {
                    $cond: {
                        if: { $gt: [{ $size: "$stories" }, 0] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }
            }
        },
        {
            $addFields: {
                isLiked: { $in: [req.user._id, "$likes.likeBy"] }
            }
        },
        {
            $addFields: {
                isBookmarked: { $in: [req.user._id, "$savedFeeds.saveBy"] }
            }
        },
        {
            $addFields: {
                commentCount: { $size: "$comments" }
            }
        },
        {
            $project: {
                _id: 1,
                postTitle: 1,
                postFiles: 1,
                isFollower: 1,
                hasStories: 1,
                postLikes: {
                    $cond: {
                        if: { $eq: ["$postHideLikes", false] },
                        then: "$likeCount",
                        else: false
                    }
                },
                isLiked: 1,
                isBookmarked: 1,
                commentCount: 1,
                postCommentsDisabled: 1,
                postOwner: {
                    _id: "$postOwner._id",
                    userName: "$postOwner.userName",
                    fullName: "$postOwner.fullName",
                    profilePic: "$postOwner.profilePic"
                },
                createdAt: 1
            }
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, posts, "Posts retrieved successfully")
    );
});


const uploadReel = asyncHandler( async (req, res) => {
    const { reelTitle, reelHideLikes, reelHideViews, reelCommentsDisabled, reelAiLabel } = req.body;

    if (!reelTitle) {
        throw new ApiError(400, "Reel title is required");
    }

    const reelFile = req.file;

    if (!reelFile) {
        throw new ApiError(400, "Reel file are required");
    }

    const reelUrl = await uploadOnCloudinary(reelFile.path);

    if (!reelUrl) {
        throw new ApiError(500, "Internal server error during file upload");
    }

    const newReel = await Reel.create({
        reelTitle,
        reelFile: reelUrl.secure_url,
        reelOwner: req.user._id,
        reelHideLikes,
        reelHideViews,
        reelCommentsDisabled,
        reelAiLabel
    })

    res.status(200).json(
        new ApiResponse(200, newReel, "Post created successfully")
    )
})


const getUserReels = asyncHandler( async (req, res) => {

    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "User name is required");
    }

    const user = await User.findOne({ userName: username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const reels = await Reel.aggregate([
        {
            $match: {
                reelOwner: user._id
            }
        },
        {
            $lookup: {
                from: "views",
                localField: "_id",
                foreignField: "viewTo",
                as: "views"
            }
        },
        {
            $addFields: {
                viewCount: { $size: "$views" }
            }
        }
    ]);

    if (user.Private && !req.user._id.equals(user._id)) {

        const connection = await Connection.findOne({
            follower: req.user._id,
            followed: user._id
        });


        if (!connection) {
            return res.status(200).json(
                new ApiResponse(200, null, "User is private")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, reels, "User reels retrieved successfully")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, reels, "Reels retrieved successfully")
    )
})


const getReels = asyncHandler(async (req, res) => {
    const { limit = 10, lastReelId } = req.query;

    const parsedLimit = parseInt(limit, 10);

    let query = {};

    if (lastReelId && mongoose.Types.ObjectId.isValid(lastReelId)) {
        query = { _id: { $lt: new mongoose.Types.ObjectId(lastReelId) } };
    }

    const reels = await Reel.aggregate([
        {
            $match: query
        },
        {
            $sort: { _id: -1 }
        },
        {
            $limit: parsedLimit
        },
        {
            $lookup: {
                from: "users",
                localField: "reelOwner",
                foreignField: "_id",
                as: "reelOwner"
            }
        },
        {
            $unwind: "$reelOwner"
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likeTo",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "saves",
                localField: "_id",
                foreignField: "saveTo",
                as: "savedFeeds"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "commentTo",
                as: "comments"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }
            }
        },
        {
            $addFields: {
                isLiked: { $in: [req.user._id, "$likes.likeBy"] }
            }
        },
        {
            $addFields: {
                isBookmarked: { $in: [req.user._id, "$savedFeeds.saveBy"] }
            }
        },
        {
            $addFields: {
                commentCount: { $size: "$comments" }
            }
        },
        {
            $project: {
                _id: 1,
                reelTitle: 1,
                reelFile: 1,
                reelLikes: {
                    $cond: {
                        if: { $eq: ["$reelHideLikes", false] },
                        then: "$likeCount",
                        else: false
                    }
                },
                isLiked: 1,
                isBookmarked: 1,
                commentCount: 1,
                reelCommentsDisabled: 1,
                reelOwner: {
                    _id: "$reelOwner._id",
                    userName: "$reelOwner.userName",
                    fullName: "$reelOwner.fullName",
                    profilePic: "$reelOwner.profilePic"
                },
                createdAt: 1
            }
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, reels, "Reels retrieved successfully")
    );
});


const addLike = asyncHandler(async (req, res) => {
    const { likeTo, likeType, thumbnail } = req.body;

    if (!likeTo || !likeType || !thumbnail) {
        throw new ApiError(400, "Required fields are missing");
    }

    let targetModel;
    let targetField;

    switch (likeType) {
        case "post":
            targetModel = Post;
            targetField = "postOwner";
            break;
        case "reel":
            targetModel = Reel;
            targetField = "reelOwner";
            break;
        case "comment":
            targetModel = Comment;
            targetField = "commentOwner";
            break;
        default:
            throw new ApiError(400, "Invalid like type");
    }

    const target = await targetModel.findOne({ _id: likeTo });
    if (!target) {
        throw new ApiError(404, `${likeType} not found`);
    }

    const existingLike = await Like.findOne({
        likeTo,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });

        await deleteNotification(
            req.user._id,
            target[targetField],
            `liked your ${likeType}`,
            thumbnail
        );

        return res.status(200).json(
            new ApiResponse(200, existingLike, "Unliked successfully")
        );
    }

    const like = await Like.create({
        likeTo,
        likeType,
        likeBy: req.user._id,
    });

    await createNotification(
        req.app.get("io"),
        req.user._id,
        target[targetField],
        `liked your ${likeType}`,
        thumbnail
    );

    const liker = await User.findById(req.user._id);
    const targetUser = await User.findById(target[targetField]);

    sendNotification({
        token: targetUser.fcmToken,
        title: "New like on your post",
        body: `${liker.userName} just hit the heart on your photo.`,
        data: {
            type: "post_like",
            likerUsername: liker.userName,
        }
    })


    res.status(200).json(
        new ApiResponse(200, like, "Like created successfully")
    );
});



const addView = asyncHandler(async (req, res) => {
    const { viewTo, viewType } = req.body;

    if (!viewTo || !viewType) {
        throw new ApiError(400, "Required fields are missing");
    }

    const view = await View.create({
        viewTo,
        viewType,
        viewBy: req.user._id
    })

    res.status(200).json(
        new ApiResponse(200, view, "Like created successfully")
    )
})


const getNotifications = asyncHandler(async (req, res) => {
    const { limit = 10, lastNotificationId } = req.query;

    const parsedLimit = parseInt(limit, 10);

    let query = {};

    if (lastNotificationId && mongoose.Types.ObjectId.isValid(lastNotificationId)) {
        query = { _id: { $lt: new mongoose.Types.ObjectId(lastNotificationId) } };
    }

    const notifications = await Notification.aggregate([
        {
            $match: {
                receiver: req.user._id,
            },
        },
        {
            $match: query,
        },
        {
            $match: {
                $expr: { $ne: ["$sender", "$receiver"] },
            },
        },
        {
            $sort: { _id: -1 },
        },
        {
            $limit: parsedLimit,
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
            },
        },
        {
            $unwind: "$sender",
        },
        {
            $project: {
                message: 1,
                sender: {
                    _id: "$sender._id",
                    userName: "$sender.userName",
                    profilePic: "$sender.profilePic",
                },
                thumbnail: 1,
                asRead: 1,
                createdAt: 1,
            },
        },
    ]);


    if (!notifications) {
        throw new ApiError(404, "Notifications not found");
    }

    res.status(200).json(
        new ApiResponse(200, notifications, "Notifications retrieved successfully")
    )
})


const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notifications = await Notification.updateMany(
        { receiver: req.user._id, asRead: false },
        { $set: { asRead: true } }
    );

    if (!notifications) {
        throw new ApiError(404, "Notifications not found");
    }

    res.status(200).json(
        new ApiResponse(200, notifications, "Notifications marked as read successfully")
    )
})


const addRecentProfileOpened = asyncHandler(async (req, res) => {
    const { userName } = req.body;

    if (!userName) {
        throw new ApiError(400, "User name is required");
    }

    await User.updateOne(
        {
            _id: req.user._id
        },
        {
            $push: {
                recentProfileVisits: userName
            }
        }
    )

    const visit = await User.findOne({ userName });
    const visitor = await User.findById(req.user._id);

    sendNotification({
        token: visit.fcmToken,
        title: `${visitor.userName} viewed your profile`,
        body: `Someone’s curious about you.`,
        data: {
            type: "profile_visit",
            visitorUsername: visitor.userName
        }
    })


    res.status(200).json(
        new ApiResponse(200, null, "recent Profile added successfully")
    )
})


const getRecentProfileOpened = asyncHandler(async (req, res) => {
    const recentProfileOpened = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "recentProfileVisits",
                foreignField: "userName",
                as: "recentProfileOpened"
            }
        },
        {
            $unwind: "$recentProfileOpened"
        },
        {
            $sort: {
                "recentProfileOpened._id": -1
            }
        },
        {
            $project: {
                _id: 0,
                userName: "$recentProfileOpened.userName",
                profilePic: "$recentProfileOpened.profilePic",
                fullName: "$recentProfileOpened.fullName"
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, recentProfileOpened, "Recent Profile opened retrieved successfully")
    )
})


const addBookmark = asyncHandler(async (req, res) => {
    const { feedId, feedType } = req.body;

    try {
        if (!["post", "reel", "music"].includes(feedType)) {
            throw new ApiError(400, "Invalid feed type");
        }

        const existingBookmark = await Save.findOne({
            saveTo: feedId,
            saveBy: req.user._id
        })

        if (existingBookmark) {
            await Save.deleteOne({
                saveTo: feedId,
            })

            return res.status(200).json(
                new ApiResponse(200, null, "Bookmark removed successfully")
            )
        }

        const saveFeed = await Save.create({
            saveTo: feedId,
            saveType: feedType,
            saveBy: req.user._id
        })

        res.status(200).json(
            new ApiResponse(200, saveFeed, "Bookmark added successfully")
        )

    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


const getBookmarks = asyncHandler(async (req, res) => {
    const bookmarks = await Save.aggregate([
        {
            $match: {
                saveBy: req.user._id
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "saveTo",
                foreignField: "_id",
                as: "post"
            }
        },
        {
            $lookup: {
                from: "reels",
                localField: "saveTo",
                foreignField: "_id",
                as: "reel"
            }
        },
        {
            $project: {
                saveType: 1,
                thumbnail: {
                    $cond: [
                        { $eq: ["$saveType", "reel"] },
                        { $arrayElemAt: ["$reel.reelFile", 0] },
                        { $arrayElemAt: [{ $arrayElemAt: ["$post.postFiles", 0] }, 0] }
                    ]
                },
                _id: {
                    $cond: [
                        { $eq: ["$saveType", "reel"] },
                        { $arrayElemAt: ["$reel._id", 0] },
                        { $arrayElemAt: ["$post._id", 0] }
                    ]
                }
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, bookmarks, "Bookmarks retrieved successfully")
    )
})


const addComment = asyncHandler(async (req, res) => {
    const { message, commentTo, commentToType, thumbnail } = req.body;

    if (!message || !commentTo || !commentToType) {
        throw new ApiError(400, "All fields are required");
    }

    if (!["post", "reel"].includes(commentToType)) {
        throw new ApiError(400, "Invalid feed type");
    }

    let targetModel;
    let targetField;

    switch (commentToType) {
        case "post":
            targetModel = Post;
            targetField = "postOwner";
            break;
        case "reel":
            targetModel = Reel;
            targetField = "reelOwner";
            break;
        default:
            throw new ApiError(400, "Invalid like type");
    }

    const target = await targetModel.findOne({ _id: commentTo });
    if (!target) {
        throw new ApiError(404, `${commentToType} not found`);
    }

    const comment = await Comment.create({
        message,
        commentTo,
        commentToType,
        commentBy: req.user._id
    })

    await createNotification(req.app.get("io"), req.user._id, target[targetField], `commented on your ${commentToType}`, thumbnail);

    const commenter = await User.findById(req.user._id);
    const targetUser = await User.findById(target[targetField]);

    sendNotification({
        token: targetUser.fcmToken,
        title: `${commenter.userName} left a comment on your ${commentToType}`,
        body: `"${message}" - Read the full comment.`,
        data: {
            type: "reel_comment",
            commenterUsername: commenter.userName,
        }
    })


    res.status(200).json(
        new ApiResponse(200, {message: comment.message, createdAt: comment.createdAt}, "Comment created successfully")
    )
})


const getComments = asyncHandler(async (req, res) => {
    const comments = await Comment.aggregate([
        {
            $match: {
                commentTo: new mongoose.Types.ObjectId(req.params.id),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "commentBy",
                foreignField: "_id",
                as: "commentBy"
            }
        },
        {
            $unwind: "$commentBy"
        },
        {
            $project: {
                _id: 0,
                message: 1,
                commentBy: {
                    _id: 1,
                    userName: 1,
                    profilePic: 1,
                },
                createdAt: 1
            }
        }
    ])

    res.status(200).json(
        new ApiResponse(200, comments, "Comments retrieved successfully")
    )
})


const getExploreFeeds = asyncHandler(async (req, res) => {
    try {
        const posts = await Post.find({}, { postFiles: 1, createdAt: 1 }).lean();
        const reels = await Reel.find({}, { reelFile: 1, createdAt: 1 }).lean();

        const formattedPosts = posts.map(post => ({
            ...post,
            type: 'post',
            file: post.postFiles[0],
        }));

        const formattedReels = reels.map(reel => ({
            ...reel,
            type: 'reel',
            file: reel.reelFile,
        }));

        const combinedData = [...formattedPosts, ...formattedReels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const page = parseInt(req.query.page) || 1;
        const limit = 200;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedData = combinedData.slice(startIndex, endIndex);

        res.status(200).json(
            new ApiResponse(200, paginatedData, "Feeds retrieved successfully")
        )
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


const getUserAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -isVerified -refreshToken -recentProfileVisits -savedFeeds");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(
        new ApiResponse(200, user, "User retrieved successfully")
    )
})

const updateAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // if (req.body.password) {
    //     req.body.password = await bcrypt.hash(req.body.password, 10);
    // }

    if (req.files) {
        const profilePic = req.files["profilePic"]?.[0];
        const faceId = req.files["faceId"]?.[0];

        if (profilePic) {
            const profilePicUrl = await uploadOnCloudinary(req.files["profilePic"]?.[0].path);
            req.body.profilePic = profilePicUrl.secure_url;
        }

        if (faceId) {
            const faceUrl = await uploadOnCloudinary(req.files["faceId"]?.[0].path);
            req.body.faceId = faceUrl.secure_url;
        }
    }

    let plainDescriptor = [];

    if (typeof req.body.descriptor === "string") {
        plainDescriptor = req.body.descriptor.split(",").map(Number);
    } else {
        plainDescriptor = req.body.descriptor;
    }

    req.body.descriptor = plainDescriptor;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });

    res.status(200).json(
        new ApiResponse(200, null, "User updated successfully")
    )
})


const getFeed = asyncHandler(async (req, res) => {
    const { feedId, feedType } = req.params;

    const getContentPipeline = (type, query, userId) => {
        const ownerField = type === "reel" ? "reelOwner" : "postOwner";
        const hideLikesField = type === "reel" ? "reelHideLikes" : "postHideLikes";
        const titleField = type === "reel" ? "reelTitle" : "postTitle";
        const filesField = type === "reel" ? "reelFile" : "postFiles";

        return [
            { $match: { _id: new mongoose.Types.ObjectId(feedId) } },
            {
                $lookup: {
                    from: "users",
                    localField: ownerField,
                    foreignField: "_id",
                    as: ownerField,
                },
            },
            { $unwind: `$${ownerField}` },
            ...(type === "post"
                ? [
                    {
                        $lookup: {
                            from: "connections",
                            localField: `${ownerField}._id`,
                            foreignField: "followed",
                            as: "followers",
                        },
                    },
                    {
                        $addFields: {
                            isFollower: {
                                $cond: {
                                    if: { $in: [userId, "$followers.follower"] },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "stories",
                            localField: `${ownerField}._id`,
                            foreignField: "user",
                            as: "stories",
                        },
                    },
                    {
                        $addFields: {
                            hasStories: {
                                $cond: {
                                    if: { $gt: [{ $size: "$stories" }, 0] },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                ]
                : []),
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "likeTo",
                    as: "likes",
                },
            },
            {
                $lookup: {
                    from: "saves",
                    localField: "_id",
                    foreignField: "saveTo",
                    as: "savedFeeds",
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "commentTo",
                    as: "comments",
                },
            },
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    isLiked: { $in: [userId, "$likes.likeBy"] },
                    isBookmarked: { $in: [userId, "$savedFeeds.saveBy"] },
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $project: {
                    _id: 1,
                    [titleField]: 1,
                    [filesField]: 1,
                    [`${type}Likes`]: {
                        $cond: {
                            if: { $eq: [`$${hideLikesField}`, false] },
                            then: "$likeCount",
                            else: false,
                        },
                    },
                    isLiked: 1,
                    isBookmarked: 1,
                    commentCount: 1,
                    [`${type}CommentsDisabled`]: 1,
                    [ownerField]: {
                        _id: `$${ownerField}._id`,
                        userName: `$${ownerField}.userName`,
                        fullName: `$${ownerField}.fullName`,
                        profilePic: `$${ownerField}.profilePic`,
                    },
                    createdAt: 1,
                    ...(type === "post"
                        ? { isFollower: 1, hasStories: 1 }
                        : {}),
                },
            },
        ];
    };

    const targetFeed = feedType == "reel" ? Reel : Post;

    res.status(200).json(
        new ApiResponse(200, await targetFeed.aggregate(getContentPipeline(feedType, feedId, req.user._id)), "Feed retrieved successfully")
    )
})


const addReport = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        throw new ApiError(400, "Message is required");
    }

    const report = await Report.create({ reportBy: req.user._id, report: message });

    const user = await User.findById(req.user._id);

    sendNotification({
        token: user.fcmToken,
        title: "Bug report received!",
        body: "Thanks for your feedback. Our team will work on fixing it ASAP.",
        data: {
            type: "bug_report_acknowledgment"
        }
    })

    res.status(200).json(
        new ApiResponse(200, report, "Report added successfully")
    )
})


export {
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
    getChatFollowings,
    searchUser,
    followUser,
    getSuggestedUsers,
    addStory,
    getStories,
    getStoryViews,
    getStoryOnlyFollowers,
    uploadPost,
    getUserPosts,
    getPosts,
    uploadReel,
    getUserReels,
    getReels,
    deleteFeed,
    addLike,
    addView,
    getNotifications,
    markNotificationAsRead,
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
}
