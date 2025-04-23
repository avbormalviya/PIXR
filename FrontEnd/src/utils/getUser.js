import axios from "axios";

export const getUser = async () => {
    const accessToken = localStorage.getItem("accessToken");  // Check for accessToken in localStorage

    const config = {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : "",  // Add token to headers if available
        },
        withCredentials: true,  // Ensure cookies are sent if available
    };

    console.log(config);

    try {
        const response = await axios.get("https://pixr-backend.onrender.com/api/v1/users/getUser", config);
        if (response?.status === 200) {
            return response.data;
        }
        return null;
    } catch (err) {
        return null;
    }
};
