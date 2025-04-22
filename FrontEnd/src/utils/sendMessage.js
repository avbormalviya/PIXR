import axios from 'axios';

export const sendMessage = async (data) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post(
        "https://pixr-backend.onrender.com/api/v1/chats/sendMessage",
        data,
        config
    );

    return response;
};
