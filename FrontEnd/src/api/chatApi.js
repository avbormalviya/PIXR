import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setError } from "../features/statusSlice/error/errorSlice"
import { setLoading } from "../features/statusSlice/loader/loaderSlice";

const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/v1/chats/`,
        credentials: "include",
    });

    const userBaseQuery = fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/`,
        credentials: "include",
    });

    api.dispatch(setLoading(true));

    let accessToken = localStorage.getItem("accessToken");
    const formattedArgs = typeof args === "string" ? { url: args } : { ...args };

    let result = await baseQuery(
        {
            ...formattedArgs,
            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}`, ...(formattedArgs.headers || {}) }
                : formattedArgs.headers,
        },
        api,
        extraOptions
    );

    // If 401 Unauthorized (access token expired), try to silently refresh token
    if (result.error && (result.error.status === 401 || result.error.status === 400)) {
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedRefreshToken) {
            const refreshResult = await userBaseQuery(
                {
                    url: "refreshToken",
                    method: "POST",
                    body: { refreshToken: storedRefreshToken },
                    headers: { Authorization: `Bearer ${storedRefreshToken}` }
                },
                api,
                extraOptions
            );

            if (refreshResult?.data) {
                const newAccessToken = refreshResult.data.data?.accessToken;
                const newRefreshToken = refreshResult.data.data?.refreshToken;

                if (newAccessToken) {
                    localStorage.setItem("accessToken", newAccessToken);
                }
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }

                // Retry original request with new access token
                result = await baseQuery(
                    {
                        ...formattedArgs,
                        headers: newAccessToken
                            ? { Authorization: `Bearer ${newAccessToken}`, ...(formattedArgs.headers || {}) }
                            : formattedArgs.headers,
                    },
                    api,
                    extraOptions
                );
            } else {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
        }
    }

    api.dispatch(setLoading(false));

    if (result.error && result.error.status !== 401) {
        api.dispatch(setError(result.error));
    }

    return result;
};

export default baseQueryWithErrorHandling;


export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: baseQueryWithErrorHandling,

    endpoints: (builder) => ({
        // searchUser: builder.query({
        //     query: (searchTerm) => ({
        //         url: `searchUser?query=${encodeURIComponent(searchTerm)}`,
        //         method: "GET"
        //     })
        // }),

        createOrGetOneOnOneChat: builder.mutation({
            query: (data) => ({
                url: `createOrGetOneOnOneChat?receiver=${data}`,
                method: "POST",
            })
        }),

        sendMessage: builder.mutation({
            query: ({ chatId, message }) => ({
                url: `sendMessage?chatId=${chatId}&message=${message}`,
                method: "POST",
            })
        }),

        deleteChat: builder.mutation({
            query: (chatId) => ({
                url: `${chatId}`,
                method: "DELETE",
            })
        }),
    })
})

export const {
    createOrGetOneOnOneChat,
    sendMessage,
    deleteChat
} = chatApi;
