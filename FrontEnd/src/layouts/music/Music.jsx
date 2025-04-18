import { Outlet } from 'react-router-dom';
import style from './music.module.scss';
import { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { Img } from '../../components/img/Img';


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


export const Music = () => {
    const navigate = useNavigate();

    const searchBoxRef = useRef(null);

    const [selectedSongId, setSelectedSongId] = useState('3n3Ppam7vgaVa1iaRUc9Lp');

    const [searchType, setSearchType] = useState("track");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({
        albums: [],
        playlists: [],
        artists: [],
        tracks: [],
    });
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [onceOpen, setOnceOpen] = useState(false);


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        const token = await getAccessToken();

        const res = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=5`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();

        setSearchResults({
            albums: searchType === "album" ? data.albums?.items || [] : [],
            playlists: searchType === "playlist" ? data.playlists?.items || [] : [],
            artists: searchType === "artist" ? data.artists?.items || [] : [],
            tracks: searchType === "track" ? data.tracks?.items || [] : [],
        });

        setShowSearchResults(true);
        setOnceOpen(true);
    };


    return (
        <section className={style.music_section}>
            <div className={style.music_section_wrapper}>
                <div className={style.music_section_header}>

                    <div ref={searchBoxRef} className={style.searchBar}>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className={style.searchDropdown}
                        >
                            <option value="artist">Artist</option>
                            <option value="track">Track</option>
                            <option value="album">Album</option>
                            <option value="playlist">Playlist</option>
                        </select>

                        <input
                            type="text"
                            placeholder={`Search ${searchType}s...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={style.searchInput}
                            onFocus={() => {
                                if (onceOpen) {
                                    setShowSearchResults(true);
                                }
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />

                        <button onClick={handleSearch}>Search</button>

                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: showSearchResults ? 1 : 0, height: showSearchResults ? "auto" : 0, padding: showSearchResults ? "1rem" : 0 }}
                            className={style.searchResults}
                        >
                            <h3 className={style.section_title}>Search Results : {searchType}</h3>
                            <div className={style.card_list}>
                                {searchResults.albums.map((album) => (
                                    <div
                                        key={album.id}
                                        className={style.card}
                                        onClick={() => {
                                            setShowSearchResults(false);
                                            navigate(`/music/albums/${album.id}`, {
                                                state: { selectedItem: album, selectedType: "albums" },
                                            });
                                        }}
                                    >
                                        <Img className={style.card_image} src={album.images[0]?.url} alt={album.name} />
                                        <div className={style.card_info}>
                                            <p className={style.card_title}>{album.name}</p>
                                            <p className={style.card_subtitle}>{album.artists.map((a) => a.name).join(", ")}</p>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        className={style.card}
                                        onClick={() => {
                                            setShowSearchResults(false);
                                            navigate(`/music/playlists/${playlist.id}`, {
                                                state: { selectedItem: playlist, selectedType: "playlists" },
                                            });
                                        }}
                                    >
                                        <Img className={style.card_image} src={playlist.images[0]?.url} alt={playlist.name} />
                                        <div className={style.card_info}>
                                            <p className={style.card_title}>{playlist.name}</p>
                                            <p className={style.card_subtitle}>{playlist.owner?.display_name}</p>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.artists.map((artist) => (
                                    <div
                                        key={artist.id}
                                        className={style.card}
                                        onClick={() => {
                                            setShowSearchResults(false);
                                            navigate(`/music/artists/${artist.id}`, {
                                                state: { selectedItem: artist, selectedType: "artists" },
                                            });
                                        }}
                                    >
                                        <Img className={style.card_image} src={artist.images[0]?.url} alt={artist.name} />
                                        <div className={style.card_info}>
                                            <p className={style.card_title}>{artist.name}</p>
                                            <p className={style.card_subtitle}>{artist.genres.join(", ")}</p>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.tracks.map((track) => (
                                    <div
                                        key={track.id}
                                        className={style.card}
                                        onClick={() => {
                                            setShowSearchResults(false);
                                            setSelectedSongId(track.id);
                                        }}
                                    >
                                        <Img className={style.card_image} src={track.album.images[0]?.url} alt={track.name} />
                                        <div className={style.card_info}>
                                            <p className={style.card_title}>{track.name}</p>
                                            <p className={style.card_subtitle}>
                                                {track.artists.map((a) => a.name).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <button
                        className={style.spotify_btn}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
                    >
                        PIXR Music<span style={{ fontSize: "0.9rem", fontStyle: "italic", color: "var(--text-primary-50)" }}>By Spotify</span>
                    </button>
                </div>
                <div className={style.music_section_body}>
                    <Outlet context={{setSelectedSongId}}/>
                </div>
                <div className={style.music_section_footer}>
                    <iframe
                        className={style.iframe}
                        src={`https://open.spotify.com/embed/track/${selectedSongId}?autoplay=1`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                    ></iframe>
                </div>
            </div>
        </section>
    );
};
