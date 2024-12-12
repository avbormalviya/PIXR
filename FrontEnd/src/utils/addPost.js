import axios from 'axios';

export const addPost = async (files) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('http://localhost:8000/api/v1/users/uploadPost', files, config);
    return response;
};
