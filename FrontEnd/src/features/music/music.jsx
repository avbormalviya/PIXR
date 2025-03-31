import Draggable from "react-draggable";
import { useState, useEffect, useRef } from "react";
import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import style from "./music.module.scss";
import { LikeButton, CloseButton } from "../../components/button/Button";
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { MiniLoader } from "../../components/miniLoader/MiniLoader";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = null;

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


const popularGenres = ["pop", "rock", "hip-hop", "jazz", "electronic", "classical", "reggae"];


export const Music = ({ musicMainWindow, setMusicMainWindow }) => {
    const draggableRef = useRef(null);

    const [query, setQuery] = useState("");
    const [songs, setSongs] = useState([]);
    const [selectedSongId, setSelectedSongId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("search");
    const [homeSongs, setHomeSongs] = useState([]);
    const [likedSongs, setLikedSongs] = useState(() => {
        const storedLikedSongs = localStorage.getItem("likedSongs");
        return storedLikedSongs ? JSON.parse(storedLikedSongs) : [];
    });
    const [loading, setLoading] = useState(false);


    // Save liked songs to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }, [likedSongs]);

    useEffect(() => {
        const iframe = document.querySelector("iframe");
        if (!iframe) return;

        iframe.onload = () => {
            // Delay to ensure song starts playing
            setTimeout(() => {
                playNextSong(); // Play next song when iframe reloads
            }, 3000); // Adjust delay as needed
        };
    }, [selectedSongId]);


    const searchSong = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const token = await getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        console.log(data);
        setSongs(data.tracks?.items || []);
        setLoading(false);
    };

    const playSong = (song, index) => {
        setSelectedSongId(song.id);
        setCurrentIndex(index);
    };


    const toggleLike = (song) => {
        if (!song || !song.id) return; // Prevent adding invalid songs

        setLikedSongs((prev) => {
            const isLiked = prev.some((s) => s?.id === song.id);
            const updatedLikedSongs = isLiked
                ? prev.filter((s) => s?.id !== song.id) // Remove only valid songs
                : [...prev, song];

            localStorage.setItem('likedSongs', JSON.stringify(updatedLikedSongs));
            return updatedLikedSongs;
        });
    };

    const playNextSong = () => {
        if (currentIndex < songs.length - 1) {
            const nextSong = songs[currentIndex + 1];
            playSong(nextSong, currentIndex + 1);
        }
    };

    const playPrevSong = () => {
        if (currentIndex > 0) {
            const prevSong = songs[currentIndex - 1];
            playSong(prevSong, currentIndex - 1);
        }
    };


    return (
        <>
            <Draggable nodeRef={draggableRef} handle=".drag-handle" bounds="body">
                <div ref={draggableRef} className={style.musicBarContainer}>
                    <iframe
                        className={style.iframe}
                        src={`https://open.spotify.com/embed/track/${selectedSongId}?autoplay=1`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                    ></iframe>
                    <div className={style.icons}>
                        <div fontSize="large" onClick={() => setMusicMainWindow(true)} className={style.openButton}><OpenInNewRoundedIcon /></div>
                        <div className="drag-handle"><DragIndicatorRoundedIcon fontSize="large" /></div>
                    </div>
                </div>
            </Draggable>

            {
                musicMainWindow &&
                    <FloatingCon>
                        <div className={style.music}>
                            <div className={style.tabs}>
                                <button
                                    onClick={() => setActiveTab("search")}
                                    className={activeTab === "search" ? style.active : style.inactive}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
                                >
                                    PIXR Music<span style={{ fontSize: "0.9rem", fontStyle: "italic", color: "var(--text-primary-50)" }}>By Spotify</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("liked")}
                                    className={activeTab === "liked" ? style.active : style.inactive}
                                >
                                    Liked
                                </button>
                                <button
                                    style={{ aspectRatio: "1 / 1", padding: 0, flexGrow: 0, borderRadius: "50%", background: "var(--background-ternary)", color: "red" }}
                                >
                                    <CloseButton event={() => setMusicMainWindow(false)} />
                                </button>
                            </div>

                            <div className={`${style.tabContainer} ${activeTab === "search" ? style.activeSearch : style.activeLiked}`}>
                                {activeTab === "search" && (
                                    <div className={style.searchContainer}>
                                        <div className={style.searchBar}>
                                            <input
                                                className={style.searchInput}
                                                type="text"
                                                placeholder="Search for a song..."
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                            />
                                            <button onClick={searchSong}>Search</button>
                                        </div>
                                        <div className={style.songList}>
                                            {/* {!query && homeSongs.map((song) => (
                                                <div key={song.id} className={style.songItem} onClick={() => playSong(song)}>
                                                    <img src={song.album.images[0]?.url} alt={song.name} />
                                                    <div>
                                                        <h3>{song.name}</h3>
                                                        <p>{song.artists.map((artist) => artist.name).join(", ")}</p>
                                                    </div>
                                                </div>
                                            ))} */}
                                            {loading && <MiniLoader />}
                                            {!loading && songs.length === 0 && <p className={style.noSongs} style={{ textAlign: "center", color: "var(--text-primary-70)", fontSize: "1.5rem" }}>No songs found</p>}
                                            {songs.map((song) => (
                                                <div key={song.id} className={style.songItem} onClick={() => playSong(song)}>
                                                    <img src={song.album.images[0]?.url || "placeholder.jpg"} alt={song.name} />
                                                    <div>
                                                        <h3>{song.name}</h3>
                                                        <p>{song.artists.map((artist) => artist.name).join(", ")}</p>
                                                    </div>
                                                    <button>
                                                        <LikeButton isLiked={likedSongs.some((s) => s.id === song.id)} event={() => toggleLike(song)} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "liked" && (
                                    <div className={style.likedContainer}>
                                        <div className={style.songList}>
                                            {!likedSongs.length && <p className={style.noSongs} style={{ textAlign: "center", color: "var(--text-primary-70)", fontSize: "1.5rem" }}>No liked songs found</p>}
                                            {likedSongs.map((song) => (
                                                <div key={song.id} className={style.songItem} onClick={() => playSong(song)}>
                                                    <img src={song.album.images[0]?.url} alt={song.name} />
                                                    <div>
                                                        <h3>{song.name}</h3>
                                                        <p>{song.artists.map((artist) => artist.name).join(", ")}</p>
                                                    </div>
                                                    <button>
                                                        <LikeButton isLiked={likedSongs.some((s) => s.id === song.id)} event={() => toggleLike(song)} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </FloatingCon>
            }
        </>
    );
};
