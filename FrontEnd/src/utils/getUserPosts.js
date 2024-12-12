import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const fetchAndSetUserPosts = async (username) => {
    try {
        const result = await store.dispatch(userApi.endpoints.getUserPosts.initiate(username));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user posts:", error);
        return { data: null, error };
    }
};
