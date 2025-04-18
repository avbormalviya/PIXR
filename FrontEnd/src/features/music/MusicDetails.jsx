import { useState, useEffect } from "react";
import style from "./music.module.scss";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Img } from "../../components/img/Img";


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

export const MusicDetails = () => {
    const navigate = useNavigate();

    const { setSelectedSongId } = useOutletContext();

    const [itemDetails, setItemDetails] = useState(null);
    const [relatedContent, setRelatedContent] = useState({ albums: [], tracks: [], playlists: [] });

    const { id, type } = useParams();


    useEffect(() => {
        if (!type || !id) return;

        async function fetchDetails() {
            const token = await getAccessToken();
            const headers = { Authorization: `Bearer ${token}` };

            let details = null;
            const related = { albums: [], tracks: [], playlists: [] };

            switch (type) {
                case "artists":
                    details = await fetch(`https://api.spotify.com/v1/artists/${id}`, { headers }).then(res => res.json());

                    const topTracks = await fetch(
                        `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`,
                        { headers }
                    ).then(res => res.json());

                    const albums = await fetch(
                        `https://api.spotify.com/v1/artists/${id}/albums`,
                        { headers }
                    ).then(res => res.json());

                    related.tracks = topTracks.tracks || [];
                    related.albums = albums.items || [];
                    break;

                case "albums":
                    details = await fetch(`https://api.spotify.com/v1/albums/${id}`, { headers }).then(res => res.json());
                    related.tracks = details.tracks?.items || [];
                    break;

                case "playlists":
                    details = await fetch(`https://api.spotify.com/v1/playlists/${id}`, { headers }).then(res => res.json());
                    related.tracks = details.tracks?.items?.map((t) => t.track) || [];
                    break;

                case "tracks":
                    details = await fetch(`https://api.spotify.com/v1/tracks/${id}`, { headers }).then(res => res.json());
                    break;
            }

            setItemDetails(details);
            setRelatedContent(related);
        }

        fetchDetails();
    }, [id, type]);


    return (
        <>
            {itemDetails && (
                <div className={style.details}>
                    <Img
                        src={
                            itemDetails.images?.[0]?.url ||
                            itemDetails.album?.images?.[0]?.url
                        }
                        alt={itemDetails.name}
                        className={style.detailImage}
                    />
                    <div className={style.detailInfo}>
                        <p><strong>Type : </strong>{itemDetails.type}</p>
                        {itemDetails.label && <p><strong>Label : </strong>{itemDetails.label}</p>}
                        {itemDetails.release_date && <p><strong>Release Date : </strong>{itemDetails.release_date}</p>}
                        {itemDetails.total_tracks && <p><strong>Total Tracks : </strong>{itemDetails.total_tracks}</p>}
                        {itemDetails.genres?.length > 0 && <p><strong>Genres : </strong>{itemDetails.genres.map((genre, index) => (
                                <span key={index}>{genre}{index < itemDetails.genres.length - 1 ? ", " : ""}</span>
                            ))}
                        </p>}
                        {itemDetails.followers?.total && <p><strong>Followers : </strong>{itemDetails.followers.total}</p> }
                        {itemDetails.popularity && <p><strong>Popularity : </strong>{itemDetails.popularity} / 100</p> }
                        {itemDetails.description && <p><strong>Description : </strong>{itemDetails.description}</p>}
                        {itemDetails.public && <p><strong>Public : </strong>{itemDetails.public ? "Yes" : "No"}</p>}
                        {itemDetails.owner && <p><strong>Owner : </strong>{itemDetails.owner.display_name}</p>}

                        <h2>{itemDetails.name}</h2>
                    </div>

                    <button className={style.closeBtn} onClick={() => navigate(-1)}>
                        Back
                    </button>
                </div>
            )}

            {/* RELATED TRACKS */}
            {relatedContent.tracks.length > 0 && (
                <div
                    className={`${style.section} ${type === "albums" || type === "playlists" ? style.section_horizontal : ""}`}
                >

                    <h3 className={style.section_title}>Tracks</h3>
                    <div className={style.card_list}>
                        {relatedContent.tracks.map((track) => (
                            <div
                                key={track.id}
                                className={style.card}
                                onClick={() => {
                                    setSelectedSongId(track.id);
                                }}
                            >
                                <Img
                                    src={track.album?.images?.[0]?.url || itemDetails.images?.[0]?.url}
                                    alt={track.name}
                                    className={style.card_image}
                                />
                                <div className={style.card_info}>
                                    <p className={style.card_title}>{track.name}</p>
                                    <p className={style.card_subtitle}>{track.artists.map(a => a.name).join(", ")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RELATED ALBUMS */}
            {relatedContent.albums.length > 0 && (
                <div className={style.section}>
                    <h3 className={style.section_title}>Albums</h3>
                    <div className={style.card_list}>
                        {relatedContent.albums.map((album) => (
                            <div
                                key={album.id}
                                className={style.card}
                                onClick={() => {
                                    navigate(`/music/albums/${album.id}`, {
                                        state: { selectedItem: album, selectedType: "albums" },
                                    });
                                }}
                            >
                                <Img
                                    src={album.images?.[0]?.url}
                                    alt={album.name}
                                    className={style.card_image}
                                />
                                <div className={style.card_info}>
                                    <p className={style.card_title}>{album.name}</p>
                                    <p className={style.card_subtitle}>{album.artists.map(a => a.name).join(", ")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
