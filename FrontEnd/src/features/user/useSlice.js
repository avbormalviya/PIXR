import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,

    followersCount: 0,
    followingCount: 0,

    followers: [],
    followings: [],

    suggestedUsers: [],

    myMemoir: [],
    memoirLoading: false,

    memoirs: [],

    notification: false,

    feedUpload: false,

    verificationCode: "",
}

const userSlice = createSlice({
    name: 'user',

    initialState,

    reducers: {
        setUserData: (state, action) => {
            state.user = action.payload;
        },

        deleteUserData: (state) => {
            state.user = null;
        },

        setFollowersCount: (state, action) => {
            state.followersCount = action.payload;
        },

        setFollowingCount: (state, action) => {
            state.followingCount = action.payload;
        },

        setFollowers: (state, action) => {
            state.followers = action.payload;
        },

        setFollowing: (state, action) => {
            state.followings = action.payload;
        },
        
        setSuggestedUsers: (state, action) => {
            state.suggestedUsers = action.payload;
        },

        setMemoirs: (state, action) => {
            state.memoirs = action.payload;
        },

        setMyMemoir: (state, action) => {
            state.myMemoir = action.payload;
        },

        setMemoirLoading: (state, action) => {
            state.memoirLoading = action.payload;
        },

        setNotification: (state, action) => {
            state.notification = action.payload;
        },

        setFeedUpload: (state, action) => {
            state.feedUpload = action.payload;
        },

        setVerificationCode: (state, action) => {
            state.verificationCode = action.payload;
        }
    },
});

export const {
    setUserData,
    deleteUserData,
    setFollowersCount,
    setFollowingCount,
    setFollowers,
    setFollowing,
    setSuggestedUsers,
    setMemoirs,
    setMyMemoir,
    setMemoirLoading,
    setNotification,
    setFeedUpload,
    setVerificationCode,

} = userSlice.actions;
export default userSlice.reducer;
