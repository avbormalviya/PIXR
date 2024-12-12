import { useRef, useState, useEffect } from 'react';
import style from './imageSlider.module.scss';

export const ImageSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const images = [
        "https://i.pinimg.com/564x/61/d4/21/61d421f944af5fef52a82853886a682e.jpg",
        "https://i.pinimg.com/564x/e7/00/c2/e700c24d44fcc5f679a785845e5b037f.jpg",
        "https://i.pinimg.com/736x/07/21/26/072126c4bd47c7c35ddcd981913ae662.jpg"
    ];

    const totalImages = images.length;
    const sliderRef = useRef(null);
    const startX = useRef(0);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % totalImages;
            scrollToIndex(newIndex);
            return newIndex;
        });
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + totalImages) % totalImages;
            scrollToIndex(newIndex);
            return newIndex;
        });
    };

    const scrollToIndex = (index) => {
        if (sliderRef.current) {
            sliderRef.current.scrollTo({
                left: sliderRef.current.offsetWidth * index,
                behavior: 'smooth'
            });
        }
    };


    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        const endX = e.changedTouches[0].clientX;
        const swipeDistance = startX.current - endX;

        if (swipeDistance > 100) {
            handleNext();
        } else if (swipeDistance < -100) {
            handlePrev();
        }
    };

    const updateCurrentIndex = () => {
        if (sliderRef.current) {
            const scrollLeft = sliderRef.current.scrollLeft;
            const imageWidth = sliderRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / imageWidth);
            setCurrentIndex(newIndex);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            updateCurrentIndex();
        };

        const container = sliderRef.current;
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div 
            className={style.imageWrapper}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className={style.imageContainer} ref={sliderRef}>
                {images.map((image, index) => (
                    <img
                        key={index}
                        src={image}
                        alt={`Slide ${index + 1}`}
                    />
                ))}
            </div>
            

            <div className={style.controls}>
                <i className="material-symbols-rounded" onClick={handlePrev}>chevron_left</i>
                <div className={style.counter}>
                    <span>{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{totalImages}</span>
                </div>
                <i className="material-symbols-rounded" onClick={handleNext}>chevron_right</i>
            </div>
        </div>
    );
};