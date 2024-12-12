import axios from 'axios';

export const addLike = async (data) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.vercel.app/api/v1/users/addLike', data, config);
    return response;
};
