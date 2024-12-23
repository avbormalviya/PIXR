import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const getStories = async (userName) => {
    try {
        const result = await store.dispatch(userApi.endpoints.getStories.initiate(userName));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user memoir only follower :", error);
        return { data: null, error };
    }
};
