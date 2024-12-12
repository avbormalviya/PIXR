import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const deleteFeed = async (data) => {

    try {
        const result = await store.dispatch(userApi.endpoints.deleteFeed.initiate(data));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user data:", error);
        return { data: null, error };
    }
};
