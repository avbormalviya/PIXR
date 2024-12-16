import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setError } from "../features/statusSlice/error/errorSlice"
import { setLoading } from "../features/statusSlice/loader/loaderSlice";

const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: "https://pixr-backend.onrender.com/api/v1/users/",
        credentials: "include",
    });

    api.dispatch(setLoading(true));

    const result = await baseQuery(args, api, extraOptions);

    api.dispatch(setLoading(false));

    if (result.error) {
        api.dispatch(setError(result.error));
    }

    return result;
};

export default baseQueryWithErrorHandling;


export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: baseQueryWithErrorHandling,

    endpoints: (builder) => ({
        getUser: builder.query({
            query: () => "getUser"
        }),

        searchUser: builder.query({
            query: (searchTerm) => ({
                url: `searchUser?query=${encodeURIComponent(searchTerm)}`,
                method: "GET"
            })
        }),

        registerUser: builder.mutation({
            query: (data) => ({
                url: "register",
                method: "POST",
                body: data
            })
        }),

        verifyEmail: builder.mutation({
            query: (data) => ({
                url: "verifyEmail",
                method: "POST",
                body: data
            })
        }),

        userProfile: builder.mutation({
            query: (data) => ({
                url: "userProfile",
                method: "POST",
                body: data
            })
        }),

        loginUser: builder.mutation({
            query: (data) => ({
                url: "login",
                method: "POST",
                body: data
            })
        }),

        logoutUser: builder.mutation({
            query: () => ({
                url: "logout",
                method: "POST"
            })
        }),

        refreshAccessToken: builder.mutation({
            query: () => ({
                url: "refreshToken",
                method: "POST"
            })
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: "changePassword",
                method: "POST",
                body: data
            })
        }),

        getUserProfile: builder.query({
            query: (data) => ({
                url: `getUserProfile/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getUserFollowerAndFollowing: builder.query({
            query: (data) => ({
                url: `getUserFollowerAndFollowing/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        followUser: builder.mutation({
            query: (data) => ({
                url: "followUser",
                method: "POST",
                body: data
            })
        }),

        getSuggestedUsers: builder.query({
            query: () => ({
                url: "getSuggestedUsers",
                method: "GET"
            })
        }),

        getStories: builder.query({
            query: (userName) => ({
                url: `getStories/${encodeURIComponent(userName)}`,
                method: "GET"
            }),
        }),

        getStoryViews: builder.query({
            query: (storyId) => ({
                url: `getStoryViews/${encodeURIComponent(storyId)}`,
                method: "GET"
            }),
        }),

        getStoryOnlyFollowers: builder.query({
            query: () => ({
                url: "getStoryOnlyFollowers",
                method: "GET"
            }),
        }),

        getUserPosts: builder.query({
            query: (data) => ({
                url: `getUserPosts/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getPosts: builder.query({
            query: ({lastPostId, limit}) => ({
                url: `getPosts?lastPostId=${lastPostId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        getUserReels: builder.query({
            query: (data) => ({
                url: `getUserReels/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getReels: builder.query({
            query: ({lastReelId, limit}) => ({
                url: `getReels?lastReelId=${lastReelId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        deleteFeed: builder.query({
            query: (data) => ({
                url: "deleteFeed",
                method: "DELETE",
                body: data
            }),
        }),

        getNotifications: builder.query({
            query: ({ lastNotificationId, limit }) => ({
                url: `getNotifications?lastNotificationId=${lastNotificationId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        markNotificationAsRead: builder.mutation({
            query: () => ({
                url: "markNotificationAsRead",
                method: "POST",
            })
        }),

        addRecentProfileOpened: builder.mutation({
            query: (data) => ({
                url: "addRecentProfileOpened",
                method: "POST",
                body: data
            })
        }),

        getRecentProfileOpened: builder.query({
            query: () => ({
                url: "getRecentProfileOpened",
                method: "GET"
            })
        }),

        addBookmark: builder.mutation({
            query: (data) => ({
                url: "addBookmark",
                method: "POST",
                body: data
            })
        }),

        getBookmarks: builder.query({
            query: () => ({
                url: "getBookmarks",
                method: "GET"
            })
        }),

        addComment: builder.mutation({
            query: (data) => ({
                url: "addComment",
                method: "POST",
                body: data
            })
        }),

        getComments: builder.query({
            query: (id) => ({
                url: `getComments/${id}`,
                method: "GET"
            }),
        }),

        getExploreFeeds: builder.query({
            query: () => ({
                url: "getExploreFeeds",
                method: "GET"
            }),
        }),

        getUserAccount: builder.query({
            query: () => ({
                url: `getUserAccount`,
                method: "GET"
            }),
        }),

        updateAccount: builder.mutation({
            query: (data) => ({
                url: "updateAccount",
                method: "POST",
                body: data
            })
        }),

        getFeed: builder.query({
            query: ({ feedId, feedType }) => ({
                url: `getFeed/${encodeURIComponent(feedId)}/${encodeURIComponent(feedType)}`,
                method: "GET",
            }),
        }),

        addReport: builder.mutation({
            query: (data) => ({
                url: "addReport",
                method: "POST",
                body: data
            })
        }),

    })
})

export const {
    useGetUserQuery,
    useSearchUserQuery,
    useRegisterUserMutation,
    useVerifyEmailMutation,
    useUserProfileMutation,
    useLoginUserMutation,
    useLogoutUserMutation,
    useRefreshAccessTokenMutation,
    useChangePasswordMutation,
    useGetUserProfileQuery,
    useGetUserFollowerAndFollowingQuery,
    useFollowUserMutation,
    useGetSuggestedUsersQuery,
} = userApi;