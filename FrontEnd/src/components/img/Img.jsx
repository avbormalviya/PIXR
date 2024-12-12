import { useEffect, useState } from "react";

export const Img = ({ url, alt, ...props }) => {
    const [image, setImage] = useState(null);
    const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

    const generateImageUrls = (baseUrl) => {
        const lowQualityUrl = baseUrl?.replace('/upload/', '/upload/e_blur:200,q_10,w_auto/');
        const highQualityUrl = baseUrl?.replace('/upload/', '/upload/q_auto,f_auto/');
        return { lowQualityUrl, highQualityUrl };
    };

    useEffect(() => {
        const { lowQualityUrl, highQualityUrl } = generateImageUrls(url);
        
        setImage(lowQualityUrl);

        const highQualityImg = new Image();
        highQualityImg.src = highQualityUrl;

        highQualityImg.onload = () => {
            setImage(highQualityUrl);
            setIsHighQualityLoaded(true);
        };
    }, [url]);

    return (
        <img
            src={image}
            alt={alt}
            {...props}
        />
    );
};
