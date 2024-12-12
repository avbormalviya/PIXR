import axios from 'axios';


export const searchSong = async (searchText) => {
    const options = {
        method: 'GET',
        url: `https://instagram243.p.rapidapi.com/searchmusic/${searchText}`,
        headers: {
            'x-rapidapi-key': '37b6141575msh5f3621fe2f2b6ebp1cba94jsnaeadbf06da20',
            'x-rapidapi-host': 'instagram243.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}