import axios from 'axios';

export const addReel = async (file) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('http://localhost:8000/api/v1/users/uploadReel', file, config);
    return response;
};
