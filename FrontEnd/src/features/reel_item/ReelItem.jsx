import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import style from "./reelItem.module.scss";
import { addView } from "../../utils/addView";
import { BookmarkButton, CommentButton, LikeButton, ShareButton } from "../../components/button/Button";
import { addLike } from "../../utils/addLike";
import { addBookmark } from "../../utils/addBookmark";
import { createThumbnail } from "../../utils/createThumbnail";
import { Comment } from "../comment/Comment";
import { DrawerButton } from "../../components/drawer/Drawer";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Img } from "../../components/img/Img";

export const ReelItem = ({ reel, isMute, setIsMute }) => {

    const navigate = useNavigate();

    const { user } = useSelector((state) => state.user);

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeoutRef = useRef(null);

    const [isExpanded, setIsExpanded] = useState(false);

    const [likeCount, setLikeCount] = useState(reel?.reelLikes || 0);
    const [isLiked, setIsLiked] = useState(reel?.isLiked || false);
    const [isBookmarked, setIsBookmarked] = useState(reel?.isBookmarked || false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const [thumbnail, setThumbnail] = useState(null);


    useEffect(() => {
        setLikeCount(reel?.reelLikes || 0);
        setIsLiked(reel?.isLiked || false);
        setIsBookmarked(reel?.isBookmarked || false);

        if (reel) {
            const generateThumbnail = async () => {
                try {
                    const thumbnailURL = await createThumbnail(reel.reelFile);
                    setThumbnail(thumbnailURL);
                } catch (error) {
                    console.error("Error generating thumbnail:", error);
                }
            };
        
            generateThumbnail();
        }
        
    }, [reel]);

    useEffect(() => {
        videoRef.current.muted = isMute;
    }, [isMute]);

    const handlePlay = () => {
        if (videoRef.current && !isPlaying) {
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.error("Failed to play video:", error);
                });
        }
    };

    const handlePause = () => {
        if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        }

        setIsExpanded(false);
    };

    const handleInteraction = () => {
        if (videoRef.current) {
            setIsMute(!isMute);
        }
    };

    const handleVideoEnd = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            addView({
                viewTo: reel._id,
                viewType: "reel",
                viewBy: reel.reelOwner._id
            })
        }
    };

    const updateProgressBar = () => {
        const video = videoRef.current;
        if (video) {
            const progress = (video.currentTime / video.duration) * 100;
            setProgress(progress);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener("timeupdate", updateProgressBar);
            video.addEventListener("ended", handleVideoEnd);
            return () => {
                video.removeEventListener("timeupdate", updateProgressBar);
                video.removeEventListener("ended", handleVideoEnd);
            };
        }
    }, []);
    

    const startPress = (e) => {
        e.preventDefault();

        setLongPressTriggered(false);
        timeoutRef.current = setTimeout(() => {
            handlePause();
            setLongPressTriggered(true);
        }, 300);
    };

    const endPress = (e) => {
        e.preventDefault();

        clearTimeout(timeoutRef.current);

        if (longPressTriggered) {
            handlePlay();
        }
        else {
            handleInteraction();
        }

        setLongPressTriggered(false);
    };

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleLike = async () => {
        const newLikeStatus = !isLiked;

        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (newLikeStatus ? prev + 1 : prev - 1));
    
        try {
            const thumbnail = await createThumbnail(reel.reelFile);
    
            await addLike({
                likeTo: reel._id,
                likeType: "reel",
                thumbnail,
            });
        } catch (error) {
            console.error("Failed to update like:", error);
            
            setIsLiked(!newLikeStatus);
            setLikeCount(likeCount);
        }
    };
    

    const handleBookmark = async () => {
        const newBookmarkStatus = !isBookmarked;

        setIsBookmarked(newBookmarkStatus);

        try {
            await addBookmark({
                feedId: reel._id,
                feedType: "reel",
            });
        } catch (error) {
            console.error("Failed to update bookmark:", error);
            setIsBookmarked(!newBookmarkStatus);
        }
    };

    const handleShare = async () => {
        const shareUrl = `http://pixr.com/${reel.reelOwner.userName}/${reel._id}`;
        const shareText = "Check out this amazing Reel on PIXR!";
            
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "PIXR Reel",
                    text: shareText,
                    url: shareUrl,
                    
                });
            } catch (error) {
                console.error("Error sharing content:", error);
            }
        } else {
            alert("Your browser does not support sharing content.");
        }
    };


    const drawer = {
        delete: {
            feedId: reel._id,
            feedType: "reel",
        }
    }

    const drawer2 = {
        follow: {
            userName: reel.reelOwner.userName,
            isFollower: reel.isFollower
        }
    }

    return (
        <>
            <motion.section
                className={style.reel}
                whileInView={{ scale: 1 }}
                initial={{ scale: 0.5 }}
                transition={{ duration: 0.3 }}
                onViewportEnter={handlePlay}
                onViewportLeave={handlePause}
                viewport={{ once: false, amount: 0.5 }}
            >
                <div className={style.container}>
                    <video
                        ref={videoRef}
                        width="100%"
                        height="100%"
                        muted
                    >
                        <source src={reel.reelFile} type="video/mp4" />
                    </video>
                </div>

                <section className={style.reel_controllers}>

                    <div className={style.controllers_wrapper}>
                        <div
                            className={style.events_section}
                            onMouseDown={startPress}
                            onMouseUp={endPress}
                            onTouchStart={startPress}
                            onTouchEnd={endPress}
                        />

                        <div 
                            className={style.reel_details}
                            style={{
                                backdropFilter: `blur(${isExpanded ? 20 : 0}px)`
                            }}
                        >
                            <figure className={`${style.reel_creator_card}`}>
                                <img src={reel.reelOwner.profilePic} alt="profile pic" />
                                <figcaption>
                                    <h1 onClick={() => navigate(`/user/${reel.reelOwner.userName}`)}>{reel.reelOwner.userName}</h1>
                                </figcaption>
                            </figure>

                            <p 
                                onClick={() => {
                                    setIsExpanded(!isExpanded)
                                }}
                                className={`${style.reel_description} ${isExpanded ? style.unfold : style.fold}`}
                            >{reel.reelTitle}</p>
                        </div>

                        <div className={style.reel_buttons}>
                            <div className={style.button_wrapper}>
                                <LikeButton isLiked={ isLiked } event={ handleLike } />
                                <h1>{ reel.reelLikes ? likeCount : 'Like' }</h1>
                            </div>
                            
                            {!reel.reelCommentsDisabled && (
                                <div className={style.button_wrapper}>
                                    <>
                                        <CommentButton event={ () => setIsCommentsOpen(true) } />
                                        <h1>{ reel.commentCount }</h1>
                                    </>
                                </div>
                            )}

                            <div className={style.button_wrapper}>
                                <ShareButton event={ handleShare } />
                            </div>
                            <div className={style.button_wrapper}>
                                <BookmarkButton isBookmarked={ isBookmarked } event={ handleBookmark } />
                            </div>
                            
                            <div className={style.button_wrapper}>
                                <DrawerButton drawerInfo={ user.userName === reel.reelOwner.userName ? drawer : drawer2} />
                            </div>

                            <div className={style.button_wrapper}>
                                <Img url={ thumbnail } alt="music" />
                            </div>
                            
                        </div>

                        <div className={style.reel_progressBar}>
                            <div
                                className={style.bar_1}
                                style={{
                                    width: `${progress}%`,
                                    transition: 'width 0.24s linear'
                                }}
                            ></div>
                        </div>
                    </div>
                </section>
            </motion.section>

            <AnimatePresence>
                { isCommentsOpen && (
                    <Comment feedId={ reel._id } feedType="reel" setIsCommentsOpen={ setIsCommentsOpen } thumbnail={ thumbnail } />
                )}
            </AnimatePresence>
        </>
    );
};
