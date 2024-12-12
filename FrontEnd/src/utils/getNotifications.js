import { store } from "../store/reduxStore";
import { userApi } from "../api/userApi";

export const getNotifications = async (lastNotificationId, limit) => {
    try {
        const result = await store.dispatch(userApi.endpoints.getNotifications.initiate({ lastNotificationId, limit }, { forceRefetch: true }));

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user memoir only follower :", error);
        return { data: null, error };
    }
};


export const markNotificationAsRead = async () => {
    try {
        const result = await store.dispatch(userApi.endpoints.markNotificationAsRead.initiate());

        if (result?.data) {
            return { data: result.data.data, error: result.error };
        }

        return { data: null, error: result.error };

    } catch (error) {
        console.error("Error fetching user memoir only follower :", error);
        return { data: null, error };
    }
};


