import axios from 'axios';

export const addMemoir = async (files) => {
    const accessToken = localStorage.getItem("accessToken");  // Check for accessToken in localStorage

    const config = {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : "",  // Add token to headers if available
        },
        withCredentials: true,  // Ensure cookies are sent if available
    };

    const response = await axios.post('https://pixr-backend.onrender.com/api/v1/users/addStory', files, config);
    return response;
};
