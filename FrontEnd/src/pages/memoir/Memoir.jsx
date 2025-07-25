import style from "./memoir.module.scss";
import { Logo } from "../../components/logo/Logo";
import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { motion } from "framer-motion";
import { getStoryOnlyFollowers } from "../../utils/getMemoirOnlyFollowers";
import { getStories } from "../../utils/getStories";

import { DrawerUserCard, NormalUserCard } from "../../components/userCard/UserCard";

import { addView } from "../../utils/addView";

import { useSelector } from "react-redux";
import { getStoryViews } from "../../utils/getStoryViews";

const MemoirCard = ({ memoirs, isActive, isPrev, isNext, onStoryEnd, handleStoryPrev }) => {

    const { user } = useSelector((state) => state.user);

    const progressBarRefs = useRef(memoirs.story.map(() => React.createRef()));
    const memoirRef = useRef(null);

    const [index, setIndex] = useState(0);
    const [isImage, setIsImage] = useState(false);

    const [viewer, setViewer] = useState(false);
    const [viewers, setViewers] = useState([]);
    const progressInterval = useRef(null);

    useEffect(() => {
        // Determine if the current story is an image
        const currentStory = memoirs.story[index];
        setIsImage(/\.(jpg|jpeg|png|gif)$/i.test(currentStory));

        if (isActive) {
            if (isImage) {
                // Simulate video playback for an image
                progressBarRefs.current[index].current.style.width = `0%`;
                let progress = 0;

                progressInterval.current = setInterval(() => {
                    progress += 1;
                    progressBarRefs.current[index].current.style.width = `${progress * 10}%`;

                    if (progress >= 10) {
                        clearInterval(progressInterval.current);
                        handleMemoirNext();
                    }
                }, 1000); // Increment progress every second
            } else if (memoirRef.current) {
                memoirRef.current.play();
            }
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [isActive, index, isImage]);

    useEffect(() => {
        ( async () => {
            if (!viewer) return;
            const { data } = await getStoryViews(memoirs._id);
            setViewers(data);
        })();
    }, [viewer, memoirs]);

    const handleTimeUpdate = () => {
        const memoir = memoirRef.current;

        if (!memoir) return;

        const progress = (memoir.currentTime / memoir.duration) * 100;
        progressBarRefs.current[index].current.style.width = `${progress}%`;

        if (memoir.currentTime === memoir.duration) {
            let nextIndex = index + 1;

            if (nextIndex >= memoirs.story.length) {
                onStoryEnd();
            } else {
                setIndex(nextIndex);
                memoir.currentTime = 0;
                memoir.src = memoirs.story[nextIndex];
                memoir.load();
                memoir.play();
            }
        }
    };

    const handleMemoirPrev = () => {
        if (index > 0) {
            if (isImage) {
                progressBarRefs.current[index].current.style.width = `0%`;
            }
            else {
                memoirRef.current.currentTime = 0;
            }
            setIndex(index - 1);
        } else {
            handleStoryPrev();
        }
    };

    const handleMemoirNext = () => {
        if (index < memoirs.story.length - 1) {
            if (isImage) {
                progressBarRefs.current[index].current.style.width = `100%`;
            }
            else {
                memoirRef.current.currentTime = 0;
            }
            setIndex(index + 1);
        } else {
            onStoryEnd();
        }
    };

    const drawer = {
        Views: () => { setViewer(true) },
        delete: {
            feedId: memoirs._id,
            feedType: "story",
        }
    }

    return (
        <>
            <motion.div
                animate={{ scale: isNext || isPrev ? 0.5 : 1 }}
                transition={{ duration: 0.5 }}
                className={style.memoir_container}
            >
                {isImage ? (
                    <img
                        src={memoirs.story[index]}
                        alt="Memoir"
                        style={{ width: "100%", height: "auto" }}
                    />
                ) : (
                    <video
                        ref={memoirRef}
                        width="100%"
                        autoPlay={isActive}
                        onTimeUpdate={handleTimeUpdate}
                        src={memoirs.story[index]}
                    />
                )}

                <div className={style.memoir_controllers_wrapper}>
                    <div className={style.memoir_progressBars_wrapper}>
                        {memoirs.story.map((_, index) => (
                            <div key={index} className={style.memoir_progressBar_bg}>
                                <div
                                    ref={progressBarRefs.current[index]}
                                    className={style.memoir_progress}
                                />
                            </div>
                        ))}
                    </div>

                    {
                        user._id === memoirs.userInfo._id ? (
                            <DrawerUserCard styles={style.memoir_owner} fullName={memoirs.userInfo.fullName} userName={memoirs.userInfo.userName} profilePic={memoirs.userInfo.profilePic} drawerInfo = {drawer} />
                        ) : (
                            <NormalUserCard styles={style.memoir_owner} fullName={memoirs.userInfo.fullName} userName={memoirs.userInfo.userName} profilePic={memoirs.userInfo.profilePic} isNavigate={true} />
                        )

                    }

                    <div onClick={handleMemoirPrev} className={style.memoir_prev_gesture} />

                    <div onClick={handleMemoirNext} className={style.memoir_next_gesture} />

                </div>
            </motion.div>


            {
                viewer && (
                    <div className={style.memoir_viewers}>
                        <div className={style.memoir_heading_wrapper}>
                            <h1>Viewers</h1>
                            <i onClick={() => setViewer(false)} className="material-symbols-rounded">close</i>
                        </div>
                        <div className={style.memoir_viewers_wrapper}>
                            {
                                viewers.map((viewer, index) => (
                                    <NormalUserCard key={index} userName={viewer.user.userName} fullName={viewer.user.fullName} profilePic={viewer.user.profilePic} />
                                ))
                            }
                        </div>
                    </div>
                )
            }

        </>
    );
};

export const Memoir = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { userName } = useParams();

    const { user } = useSelector((state) => state.user);

    const { stack } = location.state || false;

    const [memoirs, setMemoirs] = useState([]);

    const [activeIndex, setActiveIndex] = useState(0);

    const swiperRef = useRef(null);

    useEffect(() => {
        (async () => {
            // if (stack) {
            //     const { data } = await getStoryOnlyFollowers();
            //     console.log(data);
            //     setMemoirs(data);
            // }
            // else {
                const { data } = await getStories(userName);

                if (!data) {
                    return;
                }

                setMemoirs(data);
                // handleStoryView();
            // }
        })();
    }, [stack, userName]);

    useEffect(() => {
        console.log(memoirs)
        addView({
            viewTo: memoirs[0]?._id,
            viewType: "story"
        })
    }, [memoirs]);

    useEffect(() => {
        for (let i = 0; i < memoirs?.length; i++) {
            if (memoirs[i].userInfo.userName === userName) {
                setActiveIndex(i);
                swiperRef.current.slideTo(i);
                break;
            }
        }
    }, [userName, memoirs]);

    const handleStoryEnd = () => {
        if (activeIndex < memoirs?.length - 1) {
            const nextIndex = activeIndex + 1;
            setActiveIndex(nextIndex);

            if (swiperRef.current) {
                swiperRef.current.slideTo(nextIndex);
            }
        }

        navigate(-1)
    };

    const handleStoryPrev = () => {
        if (activeIndex > 0) {
            const nextIndex = activeIndex - 1;
            setActiveIndex(nextIndex);
            if (swiperRef.current) {
                swiperRef.current.slideTo(nextIndex);
            }
        }
    };

    return (
        <FloatingCon darkColor>
            <Logo styles={style.logo} />
            {memoirs?.length > 0 && (
                <Swiper
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    centeredSlides
                    slidesPerView={3}
                    initialSlide={activeIndex}
                    style={{ width: "95%", height: "95%" }}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                >
                    {memoirs?.map((memoir, index) => (
                        <SwiperSlide
                            key={index}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <MemoirCard
                                key={index}
                                isActive={index === activeIndex}
                                isPrev={index === activeIndex - 1}
                                isNext={index === activeIndex + 1}
                                memoirs={memoir}
                                onStoryEnd={handleStoryEnd}
                                handleStoryPrev={handleStoryPrev}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </FloatingCon>
    );
};
