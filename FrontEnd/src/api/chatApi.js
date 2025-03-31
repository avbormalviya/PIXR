import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setError } from "../features/statusSlice/error/errorSlice"
import { setLoading } from "../features/statusSlice/loader/loaderSlice";

const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: "https://pixr-backend.onrender.com/api/v1/chats/",
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
    })
})

export const {
    createOrGetOneOnOneChat,
    sendMessage
} = chatApi;
