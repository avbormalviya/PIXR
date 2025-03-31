import axios from 'axios';

export const sendMessage = async (chatId, message) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post(
        `https://pixr-backend.onrender.com/api/v1/chats/sendMessage?chatId=${chatId}&message=${encodeURIComponent(message)}`,
        {},  // Empty body since we're sending data in query params
        config
    );

    return response;
};
