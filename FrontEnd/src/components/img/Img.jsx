import { useEffect, useState } from "react";
import { getRandomImageUrl } from "../../utils/getRandomImg";

export const Img = ({ url, alt, className = "", ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

    const generateImageUrls = (baseUrl) => {
        if (!baseUrl) return { lowQualityUrl: "", highQualityUrl: "" }; // Handle undefined or invalid URL

        try {
            const lowQualityUrl = baseUrl?.replace('/upload/', '/upload/e_blur:200,q_10,w_auto/');
            const highQualityUrl = baseUrl?.replace('/upload/', '/upload/q_auto,f_auto/');
            return { lowQualityUrl, highQualityUrl };
        } catch {
            return { lowQualityUrl: baseUrl, highQualityUrl: baseUrl };
        }
    };

    useEffect(() => {
        if (!url) {
            setImageSrc(getRandomImageUrl());  // Fallback to a random image if URL is not available
            return;
        }

        let isCancelled = false;

        const { lowQualityUrl, highQualityUrl } = generateImageUrls(url);

        const lowImg = new Image();
        lowImg.src = lowQualityUrl;
        lowImg.onload = () => {
            if (!isCancelled) {
                setImageSrc(lowQualityUrl);
            }
        };
        lowImg.onerror = () => {
            const highImg = new Image();
            highImg.src = highQualityUrl;
            highImg.onload = () => {
                if (!isCancelled) {
                    setImageSrc(highQualityUrl);
                    setIsHighQualityLoaded(true);
                }
            };
            highImg.onerror = () => {
                if (!isCancelled) {
                    setImageSrc(getRandomImageUrl());  // Fallback to a random image on error
                    setIsHighQualityLoaded(true);
                }
            };
        };

        const preloadHigh = new Image();
        preloadHigh.src = highQualityUrl;
        preloadHigh.onload = () => {
            if (!isCancelled) {
                setImageSrc(highQualityUrl);
                setIsHighQualityLoaded(true);
            }
        };

        return () => {
            isCancelled = true;
        };
    }, [url]);

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={`${className} ${!isHighQualityLoaded ? "blur-sm grayscale transition-all duration-300" : "transition-all duration-300"}`}
            onError={(e) => {
                e.target.src = getRandomImageUrl();
                e.target.onerror = null;
            }}
            {...props}
        />
    );
};
