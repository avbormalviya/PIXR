import { useState, useEffect } from "react";
import { ReelItem } from "../../features/reel_item/ReelItem";
import style from "./reel.module.scss";

import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { fetchAndSetReels } from "../../utils/getReels";
import { MiniLoader } from "../miniLoader/MiniLoader";

export const Reel = () => {
    const [isMute, setIsMute] = useState(true);

    const [reels, setReels] = useState([]);
    const [lastReelId, setLastReelId] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchMoreReels = async () => {
        try {
            const result = await fetchAndSetReels(lastReelId, 2);
            console.log(result);
            const data = result.data;

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setReels((prevPosts) => [...prevPosts, ...data]);
                setLastReelId(data[data.length - 1]._id);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const { lastElementRef, isFetching } = useInfiniteScroll(fetchMoreReels, hasMore);

    useEffect(() => {
        setReels([]);
        setLastReelId(null);
        setHasMore(true);
    }, []);

    return (
        <section className={style.reels_wrapper}>
            {reels.map((reel, index) => (
                <ReelItem key={index} reel={reel} isMute={isMute} setIsMute={setIsMute} />
            ))}

            <div ref={lastElementRef} style={{ height: '20px' }} />

            {isFetching && <MiniLoader />}
            {!hasMore && <p>No more posts available.</p>}
        </section>
    );
};
