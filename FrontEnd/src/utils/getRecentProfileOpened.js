import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const getRecentProfileOpened = async () => {
    try {
        const result = await store.dispatch(userApi.endpoints.getRecentProfileOpened.initiate());

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user Reels:", error);
        return { data: null, error };
    }
};
