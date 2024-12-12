import axios from 'axios';

export const addMemoir = async (files) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('http://localhost:8000/api/v1/users/addStory', files, config);
    return response;
};
