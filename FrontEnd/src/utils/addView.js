import axios from 'axios';

export const addView = async (data) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/addView', data, config);
    return response;
};
