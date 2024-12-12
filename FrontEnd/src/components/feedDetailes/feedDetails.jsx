import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import { getFeed } from "../../utils/getFeeds";
import { DrawerUserCard } from "../userCard/UserCard";
import { useEffect, useState } from "react";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

import { Zoom, Pagination } from 'swiper/modules';

import { Img } from "../img/Img";
import { useSelector } from "react-redux";
import { BookmarkButton, CommentButton, LikeButton, ShareButton } from "../button/Button";
import { addLike } from "../../utils/addLike";
import { addBookmark } from "../../utils/addBookmark";

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import style from "./feedDetails.module.scss";
import { AnimatePresence } from "framer-motion";
import { Comment } from "../../features/comment/comment";
import { createThumbnail } from "../../utils/createThumbnail";

export const FeedDetails = ({ feedId, feedType, setIsDetailsOpen }) => {

    const { user } = useSelector((state) => state.user);

    const [feed, setFeed] = useState({});

    const [likeCount, setLikeCount] = useState(feed?.postLikes || 0);
    const [isLiked, setIsLiked] = useState(feed?.isLiked || false);
    const [isBookmarked, setIsBookmarked] = useState(feed?.isBookmarked || false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);

    const feedOwner = feedType == "reel" ? "reelOwner" : "postOwner";
    const feedTitle = feedType == "reel" ? "reelTitle" : "postTitle";

    useEffect(() => {
        setLikeCount(feed?.postLikes || 0);
        setIsLiked(feed?.isLiked || false);
        setIsBookmarked(feed?.isBookmarked || false);
    }, [feed]);

    useEffect(() => {
        ( async () => {
            const { data } = await getFeed({ feedId, feedType });
            setFeed(data[0]);
        })();

    }, [feedId, feedType])

    const handleLike = async () => {
        const newLikeStatus = !isLiked;
        const newLikeCount = newLikeStatus ? likeCount + 1 : likeCount - 1;

        setIsLiked(newLikeStatus);
        setLikeCount(newLikeCount);

        let thumbnail;

        if (feedType == "reel") {
            thumbnail = await createThumbnail(feed.reelFile);
        }
        else {
            thumbnail = feed.postFiles[0]
        }

        setThumbnail(thumbnail);

        try {
            await addLike({
                likeTo: feed._id,
                likeType: feedType,
                thumbnail
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
                feedId: feed._id,
                feedType: feedType,
            });
        } catch (error) {
            console.error("Failed to update bookmark:", error);
            setIsBookmarked(!newBookmarkStatus);
        }
    };

    const handleShare = () => {
        const shareUrl = `https://pixr.com/reel`;
        const shareText = "Check out this amazing Reel on PIXR!";

        if (navigator.share) {
            navigator.share({
                title: 'PIXR Reel',
                text: shareText,
                url: shareUrl
            })
            .then(() => console.log('Shared successfully'))
            .catch(console.error);
        } else {
            alert("Copy this link to share: " + shareUrl);
        }
    }

    const drawer = {
        delete: {
            feedId: feed?._id,
            feedType: feedType,
        }
    }

    const drawer2 = {
        follow: {
            userName: feed?.[feedOwner]?.userName,
            isFollower: feed?.isFollower
        }
    }

    return (
        <FloatingCon>
            <section className={style.feed_wrapper}>
                <div className={style.feed_section_wrapper}>
                    {
                        feedType === "reel" ?
                            <video autoPlay loop controls src={feed.reelFile} style={{ height: "100.5%" }} />
                            : 
                            <Swiper
                                modules={[Zoom, Pagination]}
                                centeredSlides
                                rewind={true}
                                zoom={true}

                                style={{
                                    width: "100%",
                                }}

                                pagination={{
                                    clickable: true,
                                    renderBullet: (index, className) => (
                                        `<span class="${className}" style="background: #0095f6"></span>`
                                    ),
                                }}
                            >
                                {
                                    feed.postFiles?.map((file, index) => (
                                        <SwiperSlide
                                            key={index}
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div className="swiper-zoom-container">
                                                <Img url={file} />
                                            </div>
                                        </SwiperSlide>
                                    ))
                                }
                            </Swiper>
                    }
                </div>

                <div className={style.feed_details_wrapper}>
                    <DrawerUserCard userName={feed?.[feedOwner]?.userName} profilePic={feed?.[feedOwner]?.profilePic} fullName={feed?.[feedOwner]?.fullName} isRing={feed.hasStories} drawerInfo={ user.userName === feed?.[feedOwner]?.userName ? drawer : drawer2} />
                    <div className={style.feed_description}>
                        <h1>{feed?.[feedTitle]}</h1>
                    </div>
                    <div className={style.feed_controllers}>
                        <div className={style.icon_holder}>
                            <LikeButton isLiked={ isLiked } event={ handleLike } />
                            {feed.postLikes && (
                                <h1>{ likeCount }</h1>
                            )}
                        </div>

                        {!feed.postCommentsDisabled && (
                            <div className={style.icon_holder}>
                                <>
                                    <CommentButton event={ () => setIsCommentsOpen(true) } />
                                    <h1>{ feed.commentCount }</h1>
                                </>
                            </div>
                        )}
                        
                        <ShareButton event={ handleShare } />
                        
                        <BookmarkButton isBookmarked={ isBookmarked } event={ handleBookmark } style={{ justifySelf: "flex-end" }} />

                        <CloseRoundedIcon fontSize="large" style={{ marginLeft: "auto", cursor: "pointer" }} onClick={ () => setIsDetailsOpen(false) } />
                    </div>
                </div>
            </section>

            <AnimatePresence>
                { isCommentsOpen && (
                    <Comment feedId={ feed._id } feedType={ feedType } setIsCommentsOpen={ setIsCommentsOpen } thumbnail={ thumbnail } />
                )}
            </AnimatePresence>
        </FloatingCon>
    )
}