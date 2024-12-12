import { store } from "../store/reduxStore";
import { chatApi } from "../api/chatApi";

export const sendMessage = async (chatId, message) => {
    try {
        const result = await store.dispatch(chatApi.endpoints.sendMessage.initiate({ chatId, message }));

        if (result?.data) {
            return { data: result.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user data:", error);
        return { data: null, error };
    }
};
