import style from "./ferafing.module.scss"

import { Input } from "../../components/inputfield/Input"

import { FollowUserCard } from "../../components/userCard/UserCard"

import { useState, useEffect } from "react";

import { fetchAndUserFollowerAndFollowing } from "../../utils/getUserFollowerAndFollowing";

import { motion } from "framer-motion"
import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import { useParams, useNavigate } from "react-router-dom";


export const FerAFing = () => {

    const { username, type } = useParams();
    const navigate = useNavigate();

    const [followers, setFollowers] = useState([]);
    const [followings, setFollowings] = useState([]);
    const [isFollowerOpen, setIsFollowerOpen] = useState(true);

    useEffect(() => {
        setIsFollowerOpen(type ? type === "followers" ? true : false : true);
    }, [type]);


    useEffect(() => {
        (async () => {
            if (!username) return;

            const result = await fetchAndUserFollowerAndFollowing(username);

            setFollowers(result.data.followers);
            setFollowings(result.data.followings);

        })();
    }, [username]);

    return (
        type && <FloatingCon>
            <div className={style.fer_a_fing_wrapper}>
                <div className={style.fer_a_fing_heading}>
                    <h1 onClick={() => navigate(`/user/${username}/followers`)}>Followers</h1>
                    <h1 onClick={() => navigate(`/user/${username}/followings`) }>Following</h1>
                    
                    <motion.div
                        className={style.indicator}
                        animate={{ left: isFollowerOpen ? "0%" : "50%" }}
                    >
                        <div className={style.indicator_icons_wrapper}>
                            <i onClick={() => navigate(`/user/${username}`) } className="material-symbols-rounded">close</i>
                        </div>
                        
                        <motion.span
                            className={style.indicator_before}
                            animate={{ left: isFollowerOpen ? "0%" : "-20px" }}
                        />
                        
                        <motion.span
                            className={style.indicator_after}
                            animate={{ right: isFollowerOpen ? "-20px" : "0%", opacity: isFollowerOpen ? 1 : 0 }}
                        />

                    </motion.div>
                
                </div>
                <motion.div
                    className={style.wrapper}
                    animate={{ borderRadius: isFollowerOpen ? "0px 15px 15px 15px" : "15px 0px 15px 15px" }}
                >
                    <Input style_class={style.fer_a_fing_input} placeholder="Search" icon="search"  />
                    <div className={style.fer_a_fing_list}>
                        {
                            isFollowerOpen ? 
                                [...followers].reverse().map((user, index) => (
                                    <FollowUserCard key={index} fullName={user.fullName} userName={user.userName} profilePic={user.profilePic} />
                                ))
                                : 
                                [...followings].reverse().map((user, index) => (
                                    <FollowUserCard key={index} fullName={user.fullName} userName={user.userName} profilePic={user.profilePic} />
                                ))
                        }
                    </div>
                </motion.div>
            </div>
        </FloatingCon>
    )
}