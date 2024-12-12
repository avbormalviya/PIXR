import { useState } from "react"

import { UserPPic } from "../userPPic/UserPPic"

import style from "./profile.module.scss"

import { useParams } from "react-router-dom"
import { useEffect } from "react"

import { FollowButton } from "../button/Button"

import { fetchAndSetUserProfile } from "../../utils/getUserProfile"
import { fetchAndSetUserPosts } from "../../utils/getUserPosts"
import { fetchAndSetUserReels } from "../../utils/getUserReels"

import { FerAFing } from "../../features/followerAndFollowingList/FerAFing"

import { motion, AnimatePresence } from "framer-motion"
import { createThumbnail } from "../../utils/createThumbnail"

import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"

import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import { FeedDetails } from "../feedDetailes/FeedDetails"

export const Profile = () => {

    const { username } = useParams();
    const navigate = useNavigate();

    const { user } = useSelector((state) => state.user);

    const [userProfile, setUserProfile] = useState({});
    const [userPosts, setUserPosts] = useState([]);
    const [userReels, setUserReels] = useState([]);
    const [reelsThumbnails, setReelsThumbnails] = useState([]);
    const [isFollower, setIsFollower] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isFold, setIsFold] = useState(true);
    const [isPostSelected, setIsPostSelected] = useState(true);

    const [isFeedOpen, setIsFeedOpen] = useState(false);

    useEffect(() => {
        (async () => {
            if (!username) return;
            const result = await fetchAndSetUserProfile(username);

            setUserProfile(result?.data);
            setIsFollower(result?.data?.isFollower);

            const result2 = await fetchAndSetUserPosts(username);

            if (!result2?.data) setUserPosts([]); 

            setUserPosts([...result2?.data].reverse());
        })();
    }, [username])

    useEffect(() => {
        (async () => {
            if (isPostSelected) return;

            const result = await fetchAndSetUserReels(username);
            
            if (!result?.data) setUserReels([]);

            setUserReels([...result?.data].reverse());
        })();
    }, [isPostSelected, username])

    useEffect(() => {
        const thumbnailCache = new Map();

        const fetchThumbnails = async () => {
            setLoading(true);
            try {
                const thumbnails = await Promise.all(
                    userReels.map(async (reel) => {
                        if (thumbnailCache.has(reel._id)) {
                            return thumbnailCache.get(reel._id);
                        }
                        const thumbnail = await createThumbnail(reel.reelFile);
                        thumbnailCache.set(reel._id, thumbnail);
                        return thumbnail;
                    })
                );
                setReelsThumbnails(thumbnails);
            } catch (error) {
                console.error("Error fetching thumbnails:", error);
            }
            setLoading(false);
        };

        fetchThumbnails();

    }, [userReels]);

    const variants = {
        initial: {
            backgroundColor: 'var(--background-secondary)',
        },
        animate: {
            backgroundColor: 'var(--background-ternary)',
        }
    }

    return (
        <>
            <section className={style.profile}>
                <section className={style.about_section}>
                    <div className={style.header}>
                        <div className={style.text_wrapper}>
                            <span />
                            <h1>{ userProfile?.userName }</h1>
                        </div>

                        <div className={style.button_wrapper}>
                            {
                                userProfile?.userName !== user.userName ? (
                                    <FollowButton isFollower={isFollower} setIsFollower={setIsFollower} userName={userProfile?.userName} />
                                ) : (
                                    <i onClick={() => navigate("/settings")} className="material-symbols-rounded">more_vert</i>
                                )
                            }

                            {/* <button><i className="material-symbols-rounded">chat</i><h1>Message</h1></button> */}
                        </div>
                    </div>

                    <div className={style.main}>
                        <UserPPic userName={ userProfile?.userName } profilePic={ userProfile?.profilePic } isRing={ userProfile?.hasStories } />

                        <span className={style.data_wrapper}>
                            <h1>{ userProfile?.fullName }</h1>
                            
                            <span>
                                <h2>Role</h2>
                                <h1>{ userProfile?.role }</h1>
                            </span>
                        </span>
                        
                        <div className={style.stats_wrapper}>
                            <motion.div className={style.profile_stats}>
                                <AnimatePresence mode="wait">
                                    { isPostSelected ? (
                                        <motion.div
                                            key="firstSet"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className={style.dul_profile_stats}
                                        >
                                            <h1>{ userPosts?.length }</h1>
                                            <h2>Posts</h2>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="secondSet"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className={style.dul_profile_stats}
                                        >
                                            <h1>{  userReels?.length }</h1>
                                            <h2>Reels</h2>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            <div onClick={() => navigate(`/user/${username}/followers`) } className={style.profile_stats}>
                                <h1>{ userProfile?.followersCount }</h1>
                                <h2>Follower</h2>
                            </div>
                            <div onClick={() => navigate(`/user/${username}/followings`) } className={style.profile_stats}>
                                <h1>{ userProfile?.followingCount }</h1>
                                <h2>Following</h2>
                            </div>
                        </div>
                    </div>

                    <div className={style.bio}>
                        <span>
                            <i
                                onClick={() => setIsFold(!isFold)}
                                className="material-symbols-rounded"
                                style={{
                                    transform: isFold ? "rotate(0)" : "rotate(180deg)"
                                }}
                            >
                                keyboard_arrow_up
                            </i>
                            <h1>Bio</h1>
                        </span>
                        <motion.p
                            animate={{
                                maxHeight: isFold ? 0 : '30em',
                                padding: isFold ? 0 : '1em',
                                marginTop: isFold ? 0 : '1em',
                                opacity: isFold ? 0 : 1
                            }}
                        >
                            { userProfile?.bio }
                        </motion.p>
                    </div>
                </section>

                <section className={style.user_feeds_section}>
                    <div className={style.header}>
                        <div className={style.text_wrapper}>
                            <span />
                            
                            <h1
                                onClick={() => setIsPostSelected(true)}
                                style={{ color: isPostSelected ? "whitesmoke" : "var(--text-primary-50)" }}
                            >
                                <i className="material-symbols-rounded">grid_on</i>Posts
                            </h1>
                            <h1
                                onClick={() => setIsPostSelected(false)}
                                style={{ color: isPostSelected ? "var(--text-primary-50)" : "whitesmoke" }}    
                            >
                                <i className="material-symbols-rounded">movie</i>Reels
                            </h1>

                            <div
                                className={style.indicter} 
                                style={{
                                    transform: isPostSelected ? 'translateX(0)' : 'translateX(100%)'
                                }}
                            />
                        </div>
                    </div>
                    
                    <section className={style.container_wrapper}>

                        {
                            isPostSelected ?
                                <motion.section
                                    variants={variants}
                                    initial={"initial"}
                                    animate={ userPosts?.length > 0 ? "initial" : "animate" }
                                    className={style.user_posts}
                                >
                                    {
                                        !loading && userPosts?.length > 0 ?
                                            userPosts.map((post) => (
                                                <div key={post._id} className={style.img_holder} onClick={() => setIsFeedOpen({ isFeedOpen: true, feedId: post._id, feedType: "post" })}>
                                                    <img src={post.postFiles[0]} alt="" />
                                                    {post.postFiles.length > 1 && (
                                                        <LayersRoundedIcon fontSize="large" style={{ position: "absolute", top: "10px", right: "10px", color: "white", filter: "drop-shadow(2px 4px 6px black)" }} />
                                                    )}
                                                    <div className={style.post_likes}>
                                                        <FavoriteRoundedIcon />
                                                        <h1>{post.likeCount}</h1>
                                                    </div>
                                                </div>
                                            ))
                                            :
                                            loading ? 
                                                <h1 className={style.no_posts}>Loading...</h1>
                                                :
                                                !isFollower && userProfile?.Private ?
                                                    <h1 className={style.no_posts}><i className="material-symbols-rounded">lock</i> This user is private</h1>
                                                    :
                                                    <h1 className={style.no_posts}>No Posts</h1>
                                    }
                            
                                </motion.section>
                                :
                                <motion.section
                                    variants={variants}
                                    initial={"initial"}
                                    animate={ userReels?.length > 0 ? "initial" : "animate" }
                                    className={style.user_reels}
                                >
                                    {
                                        !loading && userReels?.length > 0 && reelsThumbnails?.length > 0 ?
                                            userReels?.map((reel, index) => (
                                                <div key={reel._id} className={style.img_holder} onClick={() => setIsFeedOpen({ isFeedOpen: true, feedId: reel._id, feedType: "reel" })}>
                                                    <img src={ reelsThumbnails[index] } alt="" />
                                                    <div className={style.reel_views}>
                                                        <PlayArrowRoundedIcon fontSize="large" />
                                                        <h1>{reel.viewCount}</h1>
                                                    </div>
                                                </div>
                                            ))
                                            :
                                            loading ?
                                                <h1 className={style.no_posts}>Loading...</h1>
                                                :
                                                !isFollower && userProfile?.Private ?
                                                    <h1 className={style.no_posts}><i className="material-symbols-rounded">lock</i> This user is private</h1>
                                                    :
                                                    <h1 className={style.no_posts}>No Reels</h1>
                                    }

                                </motion.section>
                        }
                    </section>
                </section>
            </section>
            
            <FerAFing />
            
            {
                isFeedOpen.isFeedOpen && <FeedDetails feedId={isFeedOpen.feedId} feedType={isFeedOpen.feedType} setIsDetailsOpen={setIsFeedOpen} />
            }
        </>
    )
}
