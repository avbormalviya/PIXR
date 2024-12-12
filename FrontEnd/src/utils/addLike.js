import axios from 'axios';

export const addLike = async (data) => {
    const config = {
        withCredentials: true,
    };

    const response = await axios.post('http://localhost:8000/api/v1/users/addLike', data, config);
    return response;
};
