import axios from 'axios';

export const addPost = async (files) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/uploadPost', files, config);
    return response;
};
