import { useState } from "react";
import axios from "axios";

export const useGetUser = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("https://pixr-backend.onrender.com/api/v1/users/getUser", { withCredentials: true });
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return { fetchUser, data, loading, error };
};
