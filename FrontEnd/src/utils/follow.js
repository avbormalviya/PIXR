import axios from 'axios';

export const followUser = async (userName) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.vercel.app/api/v1/users/followUser', { userName }, config);
    return response;
};
