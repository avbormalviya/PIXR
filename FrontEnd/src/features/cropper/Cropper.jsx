import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "../../utils/getCropImage";
import style from "./cropper.module.scss";
import CropRotateRoundedIcon from '@mui/icons-material/CropRotateRounded';
import FlipRoundedIcon from '@mui/icons-material/FlipRounded';
import CropRoundedIcon from '@mui/icons-material/CropRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export const ImageCropper = ({ imageSrc, onCropComplete, aspect }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });


    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = useCallback(async () => {
        try {
            const { src, file } = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip);
            onCropComplete({ src, file });
        } catch (e) {
            console.error(e);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete, rotation, flip]);


    return (
        <FloatingCon>
            { aspect &&
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect == 1 ? 1 : 9 / 16}
                    cropShape={ aspect === 1 ? "round" : "rect" }
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={onZoomChange}
                    style={{
                        containerStyle: {
                            transform: `
                                rotate(${rotation}deg)
                                scaleX(${flip.horizontal ? -1 : 1})
                                scaleY(${flip.vertical ? -1 : 1})
                            `
                        }
                    }}
                />
            }

            <div className={style.toolbar}>
                <div className={style.tools_wrapper}>
                    <CropRotateRoundedIcon
                        className={style.toolbar_icon}
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    />
                    <FlipRoundedIcon
                        className={style.toolbar_icon}
                        onClick={() => {
                            if (rotation % 180 === 0) {
                                setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }));
                            } else {
                                setFlip((prev) => ({ ...prev, vertical: !prev.vertical }));
                            }
                        }}
                    />
                </div>
                <div className={style.tools_wrapper}>
                    <CloseRoundedIcon
                        className={style.toolbar_icon}
                        onClick={() => onCropComplete(null)}
                    />
                    <CropRoundedIcon
                        className={style.toolbar_icon}
                        onClick={handleCrop}
                    />
                </div>
            </div>

        </FloatingCon>
    );
};
