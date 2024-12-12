import { useEffect, useRef, useState } from 'react';

export const useInfiniteScroll = (loadMore, hasMore) => {
    const observer = useRef();
    const [isFetching, setIsFetching] = useState(false);

    const lastElementRef = (node) => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                setIsFetching(true);
                loadMore().finally(() => setIsFetching(false)); // Ensure fetch completes
            }
        });

        if (node) observer.current.observe(node);
    };

    useEffect(() => {
        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, []);

    return { lastElementRef, isFetching };
};
