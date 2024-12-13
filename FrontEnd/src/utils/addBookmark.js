import axios from 'axios';

export const addBookmark = async (data) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/addBookmark', data, config);
    return response;
};
