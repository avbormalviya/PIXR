import { useEffect, useState } from "react";

export const Img = ({ url, alt, ...props }) => {
    const [image, setImage] = useState(null);
    const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

    const generateImageUrls = (baseUrl) => {

        let lowQualityUrl, highQualityUrl;

        try {
            lowQualityUrl = baseUrl?.replace('/upload/', '/upload/e_blur:200,q_10,w_auto/');
            highQualityUrl = baseUrl?.replace('/upload/', '/upload/q_auto,f_auto/');
        } catch (error) {
            lowQualityUrl = baseUrl;
            highQualityUrl = baseUrl;
        }

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
            onError={(e) => {setImage("https://static.vecteezy.com/system/resources/previews/020/765/399/original/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"); e.target.onerror = null; }}
            {...props}
        />
    );
};
