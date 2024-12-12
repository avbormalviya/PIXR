import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setError } from "../features/statusSlice/error/errorSlice"
import { setLoading } from "../features/statusSlice/loader/loaderSlice";

const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: "https://pixr-backend.vercel.app",
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
                url: `/api/v1/users/searchUser?query=${encodeURIComponent(searchTerm)}`,
                method: "GET"
            })
        }),

        registerUser: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/register",
                method: "POST",
                body: data
            })
        }),

        verifyEmail: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/verifyEmail",
                method: "POST",
                body: data
            })
        }),

        userProfile: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/userProfile",
                method: "POST",
                body: data
            })
        }),

        loginUser: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/login",
                method: "POST",
                body: data
            })
        }),

        logoutUser: builder.mutation({
            query: () => ({
                url: "/api/v1/users/logout",
                method: "POST"
            })
        }),

        refreshAccessToken: builder.mutation({
            query: () => ({
                url: "/api/v1/users/refreshToken",
                method: "POST"
            })
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/changePassword",
                method: "POST",
                body: data
            })
        }),

        getUserProfile: builder.query({
            query: (data) => ({
                url: `/api/v1/users/getUserProfile/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getUserFollowerAndFollowing: builder.query({
            query: (data) => ({
                url: `/api/v1/users/getUserFollowerAndFollowing/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        followUser: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/followUser",
                method: "POST",
                body: data
            })
        }),

        getSuggestedUsers: builder.query({
            query: () => ({
                url: "/api/v1/users/getSuggestedUsers",
                method: "GET"
            })
        }),

        getStories: builder.query({
            query: (userName) => ({
                url: `/api/v1/users/getStories/${encodeURIComponent(userName)}`,
                method: "GET"
            }),
        }),

        getStoryViews: builder.query({
            query: (storyId) => ({
                url: `/api/v1/users/getStoryViews/${encodeURIComponent(storyId)}`,
                method: "GET"
            }),
        }),

        getStoryOnlyFollowers: builder.query({
            query: () => ({
                url: "/api/v1/users/getStoryOnlyFollowers",
                method: "GET"
            }),
        }),

        getUserPosts: builder.query({
            query: (data) => ({
                url: `/api/v1/users/getUserPosts/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getPosts: builder.query({
            query: ({lastPostId, limit}) => ({
                url: `/api/v1/users/getPosts?lastPostId=${lastPostId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        getUserReels: builder.query({
            query: (data) => ({
                url: `/api/v1/users/getUserReels/${encodeURIComponent(data)}`,
                method: "GET"
            }),
        }),

        getReels: builder.query({
            query: ({lastReelId, limit}) => ({
                url: `/api/v1/users/getReels?lastReelId=${lastReelId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        deleteFeed: builder.query({
            query: (data) => ({
                url: "/api/v1/users/deleteFeed",
                method: "DELETE",
                body: data
            }),
        }),

        getNotifications: builder.query({
            query: ({ lastNotificationId, limit }) => ({
                url: `/api/v1/users/getNotifications?lastNotificationId=${lastNotificationId}&limit=${limit}`,
                method: "GET"
            }),
        }),

        markNotificationAsRead: builder.mutation({
            query: () => ({
                url: "/api/v1/users/markNotificationAsRead",
                method: "POST",
            })
        }),

        addRecentProfileOpened: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/addRecentProfileOpened",
                method: "POST",
                body: data
            })
        }),

        getRecentProfileOpened: builder.query({
            query: () => ({
                url: "/api/v1/users/getRecentProfileOpened",
                method: "GET"
            })
        }),

        addBookmark: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/addBookmark",
                method: "POST",
                body: data
            })
        }),

        getBookmarks: builder.query({
            query: () => ({
                url: "/api/v1/users/getBookmarks",
                method: "GET"
            })
        }),

        addComment: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/addComment",
                method: "POST",
                body: data
            })
        }),

        getComments: builder.query({
            query: (id) => ({
                url: `/api/v1/users/getComments/${id}`,
                method: "GET"
            }),
        }),

        getExploreFeeds: builder.query({
            query: () => ({
                url: "/api/v1/users/getExploreFeeds",
                method: "GET"
            }),
        }),

        getUserAccount: builder.query({
            query: () => ({
                url: `/api/v1/users/getUserAccount`,
                method: "GET"
            }),
        }),

        updateAccount: builder.mutation({
            query: (data) => ({
                url: "/api/v1/users/updateAccount",
                method: "POST",
                body: data
            })
        }),

        getFeed: builder.query({
            query: ({ feedId, feedType }) => ({
                url: `/api/v1/users/getFeed/${encodeURIComponent(feedId)}/${encodeURIComponent(feedType)}`,
                method: "GET",
            }),
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