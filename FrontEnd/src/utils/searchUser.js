import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const searchUser = async (searchTerm) => {
    try {
        const result = await store.dispatch(userApi.endpoints.searchUser.initiate(searchTerm));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user posts:", error);
        return { data: null, error };
    }
};
