import { store } from "../store/reduxStore";
import { setSuggestedUsers } from "../features/user/useSlice";
import { userApi } from "../api/userApi";

export const fetchAndSetSuggestedUsers = async () => {
    try {
        const result = await store.dispatch(userApi.endpoints.getSuggestedUsers.initiate());

        if (result?.data) {
            store.dispatch(setSuggestedUsers(result.data.data));
        }

        return { data: result.data, error: result.error };

    } catch (error) {
        console.error("Error fetching user data:", error);
        return { data: null, error };
    }
};
