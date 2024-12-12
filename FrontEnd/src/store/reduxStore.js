import { configureStore } from "@reduxjs/toolkit";

import { userApi } from "../api/userApi";
import { chatApi } from "../api/chatApi";
import userReducer from "../features/user/useSlice";
import globalErrorReducer from "../features/statusSlice/error/errorSlice"
import globalLoaderReducer from "../features/statusSlice/loader/loaderSlice"


export const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
        user: userReducer,
        globalError: globalErrorReducer,
        globalLoader: globalLoaderReducer
    },

    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware()
            .concat(userApi.middleware)
            .concat(chatApi.middleware)
    }
})