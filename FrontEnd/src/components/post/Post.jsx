import style from './post.module.scss';
import { DrawerUserCard } from "../userCard/UserCard";
import { fetchAndSetPosts } from '../../utils/getPosts';
import { useEffect, useState } from 'react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { addLike } from '../../utils/addLike';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

import { Zoom, Pagination } from 'swiper/modules';
import { MiniLoader } from '../miniLoader/MiniLoader';

import { Img } from '../img/Img';
import { BookmarkButton, CommentButton, LikeButton, ShareButton } from '../button/Button';
import { addBookmark } from '../../utils/addBookmark';
import { formatDistanceToNowStrict } from 'date-fns';

import { Comment } from '../../features/comment/Comment';
import { AnimatePresence } from 'framer-motion';

import { useSelector } from 'react-redux';


const Post = ({ postObj }) => {

    const { user } = useSelector((state) => state.user);

    const [isExpanded, setIsExpanded] = useState(false);
    const [likeCount, setLikeCount] = useState(postObj?.postLikes || 0);
    const [isLiked, setIsLiked] = useState(postObj?.isLiked || false);
    const [isBookmarked, setIsBookmarked] = useState(postObj?.isBookmarked || false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    useEffect(() => {
        setLikeCount(postObj?.postLikes || 0);
        setIsLiked(postObj?.isLiked || false);
        setIsBookmarked(postObj?.isBookmarked || false);
    }, [postObj]);

    const handleLike = async () => {
        const newLikeStatus = !isLiked;

        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (newLikeStatus ? prev + 1 : prev - 1));

        try {
            await addLike({
                likeTo: postObj._id,
                likeType: "post",
                thumbnail: postObj.postFiles[0],
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
                feedId: postObj._id,
                feedType: "post",
            });
        } catch (error) {
            console.error("Failed to update bookmark:", error);
            setIsBookmarked(!newBookmarkStatus);
        }
    };

    const handleShare = async () => {
        const shareUrl = `http://localhost:5173/${postObj.postOwner.userName}/${postObj._id}`;
        const shareText = "Check out this amazing Post on PIXR!";
        const imageUrl = postObj.postFiles[0]; // URL of the image to share
        
        if (navigator.share) {
            try {
                // Fetch the image and convert it into a File object
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], "post-image.jpg", { type: blob.type });
    
                await navigator.share({
                    title: "PIXR Post",
                    text: shareText,
                    url: shareUrl,
                    files: [file], // Attach the image file
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
            feedId: postObj._id,
            feedType: "post",
        }
    }

    const drawer2 = {
        follow: {
            userName: postObj.postOwner.userName,
            isFollower: postObj.isFollower
        }
    }

    return (
        <>
            <section className={style.post_section}>
                <DrawerUserCard styles={style.user_card} userName={postObj.postOwner.userName} fullName={postObj.postOwner.fullName} profilePic={postObj.postOwner.profilePic} isRing={ postObj.hasStories } drawerInfo={ user.userName === postObj.postOwner.userName ? drawer : drawer2} />

                <Swiper
                    modules={[Zoom, Pagination]}
                    centeredSlides
                    rewind={true}
                    zoom={true}
                    // pagination={{ clickable: true }}

                    pagination={{
                        clickable: true,
                        renderBullet: (index, className) => (
                            `<span class="${className}" style="background: #0095f6"></span>`
                        ),
                    }}

                    style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        borderRadius: "20px",
                        backgroundColor: "var(--background-primary)",
                        filter: "drop-shadow(0px 0px 6px black)",
                    }}
                >
                    {
                        postObj.postFiles?.map((file, index) => (
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

                <section className={style.post_controller}>
                    <div className={style.post_controller_inner}>
                        <div className={style.icon_holder}>
                            <LikeButton isLiked={ isLiked } event={ handleLike } />
                            {postObj.postLikes && typeof likeCount === "number" && (
                                <h1>{ likeCount }</h1>
                            )}
                        </div>

                        {!postObj.postCommentsDisabled && (
                            <div className={style.icon_holder}>
                                <>
                                    <CommentButton event={ () => setIsCommentsOpen(true) } />
                                    <h1>{ postObj.commentCount }</h1>
                                </>
                            </div>
                        )}

                        <div className={style.icon_holder}>
                            <ShareButton event={ handleShare } />
                        </div>
                    </div>
                    
                    <BookmarkButton isBookmarked={ isBookmarked } event={ handleBookmark } style={{ justifySelf: "flex-end" }} />
                    
                    <h1 className={style.post_title}>
                        <span
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`${style.text} ${isExpanded ? style.unfold : style.fold}`}
                        >
                            {postObj.postTitle}
                        </span>
                    </h1>
                    
                    { postObj?.createdAt && ( <data className={style.post_date}>{ formatDistanceToNowStrict(new Date(postObj.createdAt), { addSuffix: true }) }</data> ) }
                </section>
            </section>
            
            <AnimatePresence>
                { isCommentsOpen && (
                    <Comment feedId={ postObj._id } feedType="post" setIsCommentsOpen={ setIsCommentsOpen } thumbnail={ postObj.postFiles[0] } />
                )}
            </AnimatePresence>
        </>
    )
}


export const Posts = () => {
    
    const [posts, setPosts] = useState([]);
    const [lastPostId, setLastPostId] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchMorePosts = async () => {
        try {
            const result = await fetchAndSetPosts(lastPostId, 2);
            const data = result.data;

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setPosts((prevPosts) => [...prevPosts, ...data]);
                setLastPostId(data[data.length - 1]._id);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const { lastElementRef, isFetching } = useInfiniteScroll(fetchMorePosts, hasMore);

    useEffect(() => {
        setPosts([]);
        setLastPostId(null);
        setHasMore(true);
    }, []);

    return (
        <>
            {
                posts?.map((post, index) => (
                    <Post key={index} postObj={post} />
                ))
            }

            <div ref={lastElementRef} style={{ height: '20px' }} />

            {isFetching && <MiniLoader />}
            {!hasMore && <p>No more posts available.</p>}
        </>
    );
};
