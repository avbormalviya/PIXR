import { useState, useEffect } from "react";
import style from "./music.module.scss";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Img } from "../../components/img/Img";


const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = null;

const trendingKeywords = [
    // Yo Yo & Badshah
    "yo yo honey singh", "desi kalakar", "indian party hits", "bollywood rap", "badshah", "indian trap",
    // King & KR$NA
    "king", "pop rap hindi", "urban india", "kr$na", "desi rap", "seedhe maut", "gully gang", "real hip hop india",
    // Indie/Chill Artists
    "2scratch", "trap chill", "sad trap", "emo trap", "phonk", "jackhill", "nilnoodle", "ambient rap", "vapor soul"
];


const randomKeyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];


async function getAccessToken() {
    const currentTime = new Date().getTime();
    if (accessToken && tokenExpiration && currentTime < tokenExpiration) {
        return accessToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiration = currentTime + data.expires_in * 1000;
    return accessToken;
}

export const MusicHome = () => {
    const navigate = useNavigate();

    const { setSelectedSongId } = useOutletContext();

    const [searchResults, setSearchResults] = useState({
        albums: [],
        playlists: [],
        artists: [],
        tracks: [],
    });

    useEffect(() => {
        async function searchSpotify() {
            try {
                const token = await getAccessToken();
                const res = await fetch(
                    `https://api.spotify.com/v1/search?q=${encodeURIComponent(randomKeyword)}&type=album,playlist,artist,track&limit=10`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data = await res.json();

                setSearchResults({
                    albums: data.albums?.items || [],
                    playlists: data.playlists?.items || [],
                    artists: data.artists?.items || [],
                    tracks: data.tracks?.items || [],
                });
            } catch (err) {
                console.error("Spotify search failed:", err);
            }
        }

        searchSpotify();
    }, []);


    return (
        <>
            <div className={style.section}>
                <h3 className={style.section_title}>ALBUMS</h3>
                <div className={style.card_list}>
                    {searchResults.albums.map((item) => (
                        <div
                            key={item.id}
                            className={style.card}
                            onClick={() => {
                                navigate(`/music/albums/${item.id}`, {
                                    state: { selectedItem: item, selectedType: "albums" },
                                });
                            }}
                        >
                            <Img
                                src={item.images?.[0]?.url}
                                alt={item.name}
                                className={style.card_image}
                            />
                            <div className={style.card_info}>
                                <p className={style.card_title}>{item.name}</p>
                                <p className={style.card_subtitle}>{item.artists ? item.artists.map((a) => a.name).join(", ") : ""}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={style.section}>
                <h3 className={style.section_title}>PLAYLISTS</h3>
                <div className={style.card_list}>
                    {searchResults.playlists.map((item) => (
                        item &&
                        <div
                            key={item.id}
                            className={style.card}
                            onClick={() => {
                                navigate(`/music/playlists/${item.id}`, {
                                    state: { selectedItem: item, selectedType: "playlists" },
                                });
                            }}
                        >
                            <Img
                                src={item.images?.[0]?.url}
                                alt={item.name}
                                className={style.card_image}
                            />
                            <div className={style.card_info}>
                                <p className={style.card_title}>{item.name}</p>
                                <p className={style.card_subtitle}>{item.owner?.display_name || ""}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={style.section}>
                <h3 className={style.section_title}>ARTISTS</h3>
                <div className={style.card_list}>
                    {searchResults.artists.map((item) => (
                        <div
                            key={item.id}
                            className={style.card}
                            onClick={() => {
                                navigate(`/music/artists/${item.id}`, {
                                    state: { selectedItem: item, selectedType: "artists" },
                                });
                            }}
                        >
                            <Img
                                src={item.images?.[0]?.url}
                                alt={item.name}
                                className={style.card_image}
                            />
                            <div className={style.card_info}>
                                <p className={style.card_title}>{item.name}</p>
                                <p className={style.card_subtitle}>{item.genres.join(", ")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={style.section}>
                <h3 className={style.section_title}>TRACKS</h3>
                <div className={style.card_list}>
                    {searchResults.tracks.map((item) => (
                        <div
                            key={item.id}
                            className={style.card}
                            onClick={() => {
                                setSelectedSongId(item.id);
                            }}
                        >
                            <Img
                                src={item.album?.images?.[0]?.url}
                                alt={item.name}
                                className={style.card_image}
                            />
                            <div className={style.card_info}>
                                <p className={style.card_title}>{item.name}</p>
                                <p className={style.card_subtitle}>
                                    {item.artists.map((a) => a.name).join(", ")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
