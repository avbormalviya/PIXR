import { store } from "../store/reduxStore";
import { chatApi } from "../api/chatApi";

export const createOrGetOneOnOneChat = async (userName) => {

    try {
        const result = await store.dispatch(chatApi.endpoints.createOrGetOneOnOneChat.initiate(userName));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user data:", error);
        return { data: null, error };
    }
};
