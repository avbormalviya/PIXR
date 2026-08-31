import { chatApi } from "../api/chatApi";
import { store } from "../store/reduxStore";

export const deleteChat = async (chatId) => {
    try {
        const result = await store.dispatch(chatApi.endpoints.deleteChat.initiate(chatId));
        return result;
    } catch (error) {
        console.error("Error deleting chat:", error);
        return { error };
    }
};
