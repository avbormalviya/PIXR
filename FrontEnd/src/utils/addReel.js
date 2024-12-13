import axios from 'axios';

export const addReel = async (file) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/uploadReel', file, config);
    return response;
};
