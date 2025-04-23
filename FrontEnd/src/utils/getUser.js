import axios from "axios";

export const getUser = async () => {
    try {
        const response = await axios.get("https://pixr-backend.onrender.com/api/v1/users/getUser", { withCredentials: true });
        if (response?.status === 200) {
            return response.data;
        }
    } catch (err) {
        return null;
    }
};
