import { Input } from "../inputfield/Input"
import style from "./search.module.scss"
import { FollowUserCard } from "../userCard/UserCard"
import { motion } from "framer-motion"

import { useNavigate } from "react-router-dom"

import { useEffect, useRef, useState } from "react"
import { addRecentProfileOpened } from "../../utils/addRecentProfileOpened"
import { getRecentProfileOpened } from "../../utils/getRecentProfileOpened"
import { getExploreFeeds } from "../../utils/getExploreFeeds"
import { ImageList, ImageListItem } from "@mui/material"
import { createThumbnail } from "../../utils/createThumbnail"
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { searchUser } from "../../utils/searchUser"
import { FeedDetails } from "../feedDetailes/feedDetails"

export const Search = () => {
    const navigate = useNavigate();

    const userCardRef = useRef(null);

    const [searchText, setSearchText] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [recentProfileOpened, setRecentProfileOpened] = useState([]);
    const [feeds, setFeeds] = useState([]);
    const [searchUsers, setSearchUsers] = useState([]);

    const [isFeedOpen, setIsFeedOpen] = useState({})

    const handleProfileOpen = async (userName) =>{
        await addRecentProfileOpened(userName);
        navigate(`/user/${userName}`);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userCardRef.current && !userCardRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
    
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    

    useEffect(() => {
        ( async () => {
            const { data } = await getExploreFeeds();
            const updatedData = await Promise.all(
                data.map(async (item) => {
                    if (item.type !== "reel") return item;
                    const updatedItem = { ...item };
                    updatedItem.file = await createThumbnail(item.file);
                    return updatedItem;
                })
            );
            setFeeds(updatedData);
        })();
    }, [])

    useEffect(() => {
        (async () => {
            if (searchText) {
                const { data } = await searchUser(searchText);
                setSearchUsers(data);
                return;
            }
    
            const { data } = await getRecentProfileOpened();
            setRecentProfileOpened(data);
        })();
    }, [searchText]);    

    return (
        <section className={style.search_section}>
            <Input state={searchText} setState={setSearchText} isFocused={setIsFocused} style_class={style.input_style} icon="person_search" type="search" placeholder="Search" />
            <motion.section
                ref={userCardRef}
                initial={{ height: 0, padding: 0 }}
                animate={ isFocused ? { height: "60%", padding: "1em" } : { height: 0, padding: 0, opacity: 0 } }
                transition={{ duration: 0.3 }}
                className={style.userCard_section}
                onClick={() => setIsFocused(true)}
            >
                <h1 className={style.heading}>{ searchText ? "Results" : "Recent" }</h1>
                <div className={style.userCard_wrapper}>
                    {searchText
                        ? searchUsers?.map((user, index) => (
                            <FollowUserCard
                                key={index}
                                fullName={user.isFollower ? "True" : "False"}
                                userName={user.userName}
                                profilePic={user.profilePic}
                                isFollower={user.isFollower}
                                event={() => handleProfileOpen(user.userName)}
                            />
                        ))
                        : recentProfileOpened?.map((user, index) => (
                            <FollowUserCard
                                key={index}
                                fullName={user.fullName}
                                userName={user.userName}
                                profilePic={user.profilePic}
                                isFollower={user.isFollower}
                                event={() => handleProfileOpen(user.userName)}
                            />
                        ))}
                    {searchText && searchUsers?.length === 0 && <p className={style.no_result}>No results found</p>}
                    {!searchText && recentProfileOpened.length === 0 && <p className={style.no_result}>No recent searches</p>}
                </div>

            </motion.section>

            <section className={style.explore_section}>
                
                <ImageList variant="masonry" cols={3} gap={5}>
                    {[...feeds].reverse().map((item) => (
                        <ImageListItem key={item.img}>
                            <img
                                style={{ borderRadius: "2em" }}
                                srcSet={item.file}
                                src={item.file}
                                alt={item.title}
                                loading="lazy"
                                onClick={() => setIsFeedOpen({ isFeedOpen: true, feedId: item._id, feedType: item.type })}
                            />
                            {
                                item.type === "reel" && (
                                    <PlayArrowRoundedIcon fontSize="large" style={{ position: "absolute", top: "10", right: "10", color: "aliceblue", filter: "drop-shadow(2px 4px 6px black)" }} />
                                )
                            }
                        </ImageListItem>
                    ))}
                </ImageList>

            </section>

            {
                isFeedOpen.isFeedOpen && <FeedDetails feedId={isFeedOpen.feedId} feedType={isFeedOpen.feedType} setIsDetailsOpen={setIsFeedOpen} />
            }

        </section>
    )
}
