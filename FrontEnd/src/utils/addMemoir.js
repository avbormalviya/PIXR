import axios from 'axios';

export const addMemoir = async (files) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/addStory', files, config);
    return response;
};
