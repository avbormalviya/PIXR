import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../../components/inputfield/Input'
import { SwitchButton } from '../../components/switch/Switch'
import { addMemoir } from '../../utils/addMemoir';
import { addPost } from '../../utils/addPost';
import { useDispatch } from 'react-redux'
import { setMemoirLoading } from '../../features/user/useSlice'
import { setFeedUpload } from '../../features/user/useSlice'
import style from './create.module.scss'
import { ImageCropper } from '../cropper/Cropper'
import { addReel } from '../../utils/addReel'
import { createThumbnail } from '../../utils/createThumbnail'
import { Img } from '../../components/img/Img'
import { FILTER_PRESETS } from "./filterPresets";


export const  Create = () => {

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const { content } = useParams();

    const inputRef = useRef(null);
    const ref = useRef(null);
    const editorAdjustmentRef = useRef(null);

    const [index, setIndex] = useState(0);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [media, setMedia] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showCrop, setShowCrop] = useState(false);

    const [caption, setCaption] = useState('');
    const [hideLikes, setHideLikes] = useState(false);
    const [hideViews, setHideViews] = useState(false);
    const [disableComments, setDisableComments] = useState(false);
    const [aiLabel, setAILabel] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [showAdjustments, setShowAdjustments] = useState(false);

    const [filter, setFilter] = useState('none');
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [blur, setBlur] = useState(0);
    const [grayscale, setGrayscale] = useState(0);
    const [sepia, setSepia] = useState(0);
    const [hue, setHue] = useState(0);
    const [invert, setInvert] = useState(0);
    const [opacity, setOpacity] = useState(100);

    const [isFocus, setIsFocus] = useState(false);

    const getFilterString = (preset) => {
        return `
            brightness(${preset.brightness}%)
            contrast(${preset.contrast}%)
            saturate(${preset.saturation}%)
            blur(${preset.blur}px)
            grayscale(${preset.grayscale}%)
            sepia(${preset.sepia}%)
            hue-rotate(${preset.hue}deg)
            invert(${preset.invert}%)
            opacity(${preset.opacity}%)
        `.trim();
    };

    const currentFilters = media[mediaIndex]?.filters;
    const filterStyle = currentFilters ? {
        filter: `
    brightness(${currentFilters.brightness}%)
    contrast(${currentFilters.contrast}%)
    saturate(${currentFilters.saturation}%)
    blur(${currentFilters.blur}px)
    grayscale(${currentFilters.grayscale}%)
    sepia(${currentFilters.sepia}%)
    hue-rotate(${currentFilters.hue}deg)
    invert(${currentFilters.invert}%)
    opacity(${currentFilters.opacity}%)
`

    } : {};

    const adjustmentGroups = [
        [
            { label: 'Brightness', min: 0, max: 200 },
            { label: 'Contrast', min: 0, max: 200 },
            { label: 'Saturation', min: 0, max: 200 },
        ],
        [
            { label: 'Blur', min: 0, max: 10 },
            { label: 'Grayscale', min: 0, max: 100 },
            { label: 'Sepia', min: 0, max: 100 },
        ],
        [
            { label: 'Hue', min: 0, max: 360 },
            { label: 'Invert', min: 0, max: 100 },
            { label: 'Opacity', min: 0, max: 100 },
        ]
    ];


    const buttons = [
        {
            name: 'Post',
            limit: 5,
            accept: "image/*,video/*",
            acceptRatio: '1'
        },
        {
            name: 'Reel',
            limit: 1,
            accept: "video/*",
            acceptRatio: '9/16'
        },
        {
            name: 'Story',
            limit: 5,
            accept: "image/*,video/*",
            acceptRatio: '9/16'
        },
        // {
        //     name: 'Live',
        //     limit: null,
        //     accept: null,
        //     acceptRatio: null
        // }
    ]


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setShowFilters(false);
                setShowAdjustments(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const index = buttons.findIndex(button => button.name.toLowerCase() === content);

        let newMedia = media;

        if ([1, 3].includes(index)) {
            newMedia = media.filter((media) => media.type !== 'image')
        };

        if (buttons[index].limit < newMedia?.length) {
            newMedia = newMedia.slice(0, buttons[index].limit)
        };

        setMedia(newMedia);

        if (index) setIndex(index);
    }, [content])


    useEffect(() => {
        const el = editorAdjustmentRef.current;
        if (!el) return;

        if (isFocus) {
            el.style.overflow = 'hidden';
            el.style.touchAction = 'none';
        } else {
            el.style.overflow = '';
            el.style.touchAction = '';
        }

        return () => {
            if (el) {
                el.style.overflow = '';
                el.style.touchAction = '';
            }
        };
    }, [isFocus]);


    const updateFiltersForMedia = (preset) => {
        const updatedMedia = [...media];
        updatedMedia[mediaIndex] = {
            ...updatedMedia[mediaIndex],
            filters: { ...preset }
        };
        setMedia(updatedMedia);
    };

    const isCurrentFilter = (preset) => {
        const current = media[mediaIndex]?.filters;
        return Object.keys(preset).every(k => preset[k] == current[k]);
    };

    const handleMediaAdd = async (e) => {
        let filesArray = Array.from(e.target.files);

        if (media.length + filesArray.length > buttons[index].limit) {
            filesArray = filesArray.splice(0, buttons[index].limit - media.length);
        }

        const updatedMedia = [
            ...media,
            ...await Promise.all(
                filesArray.map(async (file) => ({
                    url: URL.createObjectURL(file),
                    thumbnail: file.type.startsWith('video/') ? await createThumbnail(file) : URL.createObjectURL(file),
                    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'unknown',
                    originalFile: file,
                    filters: {
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        blur: 0,
                        grayscale: 0,
                        sepia: 0,
                        hue: 0,
                        invert: 0,
                        opacity: 100
                    }
                }))
            )
        ];

        setMedia(updatedMedia);

        inputRef.current.value = '';
    };

    const updateFilterValue = (key, value) => {
        const updatedMedia = [...media];
        updatedMedia[mediaIndex].filters = {
            ...updatedMedia[mediaIndex].filters,
            [key]: value,
        };
        setMedia(updatedMedia);
    };


    const handleMediaRemove = (e, index) => {
        e.preventDefault();
        e.stopPropagation();

        const newMedia = media.filter((_, i) => i !== index);

        const newMediaIndex = (mediaIndex > 0 && mediaIndex === index) ? mediaIndex - 1 : mediaIndex;

        setMediaIndex(newMediaIndex);
        setMedia(newMedia);
    }


    const handleMediaClick = (index) => {
        setMediaIndex(index);
    }

    const onCropComplete = (obj) => {
        if (!obj) {
            setShowCrop(false)
            return
        };

        const { src, file } = obj;

        let newMedia = [...media];

        newMedia[mediaIndex].originalFile = file;
        newMedia[mediaIndex].url = src;

        setMedia([...newMedia]);
        setShowCrop(false);
    }


    const handleUpload = async () => {
        navigate('/');

        try {
            dispatch(setFeedUpload(true));

            // Step 1: Apply filters to media before uploading
            const processedMedia = await applyFiltersToMedia(media, media[0]?.filters);

            if (index === 0) {
                const formData = new FormData();
                processedMedia.forEach((mediaItem) => {
                    formData.append('postFiles', mediaItem);
                });

                formData.append('postTitle', caption);
                formData.append('postHideLikes', hideLikes);
                formData.append('postHideViews', hideViews);
                formData.append('postCommentsDisabled', disableComments);
                formData.append('postAiLabel', aiLabel);

                await addPost(formData);
            } else if (index === 1) {
                const formData = new FormData();
                formData.append('reelFiles', processedMedia[0]);

                formData.append('reelTitle', caption);
                formData.append('reelHideLikes', hideLikes);
                formData.append('reelHideViews', hideViews);
                formData.append('reelCommentsDisabled', disableComments);
                formData.append('reelAiLabel', aiLabel);

                await addReel(formData);
            } else if (index === 2) {
                const formData = new FormData();
                processedMedia.forEach((mediaItem) => {
                    formData.append('storyFiles', mediaItem);
                });

                dispatch(setMemoirLoading(true));
                await addMemoir(formData);
                dispatch(setMemoirLoading(false));
            }

        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            dispatch(setFeedUpload(false));
        }
    };

    // Function to apply filters to video files
    const applyFiltersToMedia = async (mediaArray, filterPreset) => {
        const processedMedia = [];

        for (const mediaItem of mediaArray) {
            const file = mediaItem.originalFile;

            if (file.type.startsWith("video")) {
                // Process video files
                const processedVideo = await applyFilterToVideo(file, filterPreset);
                processedMedia.push(processedVideo);
            } else {
                // Process image files
                const processedImage = await applyFilterToFile(file, filterPreset);
                processedMedia.push(processedImage);
            }
        }

        return processedMedia;
    };

    // Function to apply a filter to a video file
    const applyFilterToVideo = (file, filterPreset) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const objectURL = URL.createObjectURL(file);
            video.src = objectURL;

            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const width = video.videoWidth;
                const height = video.videoHeight;
                canvas.width = width;
                canvas.height = height;

                // Set up a media stream to draw video frames
                video.play();

                // Apply the filter to each frame of the video
                const applyFrameFilter = () => {
                    if (!video.paused && !video.ended) {
                        // Draw the current video frame to the canvas
                        ctx.drawImage(video, 0, 0, width, height);

                        // Apply the filter (e.g., brightness, contrast)
                        const filterString = `brightness(${filterPreset.brightness}%) contrast(${filterPreset.contrast}%) saturate(${filterPreset.saturation}%) blur(${filterPreset.blur}px) grayscale(${filterPreset.grayscale}%) sepia(${filterPreset.sepia}%) hue-rotate(${filterPreset.hue}deg) invert(${filterPreset.invert}%) opacity(${filterPreset.opacity}%)`;
                        ctx.filter = filterString;

                        // Keep drawing the frames
                        requestAnimationFrame(applyFrameFilter);
                    } else {
                        // Convert the final frame to a Blob
                        canvas.toBlob((blob) => {
                            resolve(new File([blob], file.name, { type: file.type }));
                        }, file.type);
                    }
                };

                // Start applying filters to frames
                applyFrameFilter();
            };

            video.onerror = (err) => {
                reject(err);
            };
        });
    };

    const applyFilterToFile = (file, filterPreset) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = () => {
                img.src = reader.result;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Construct the CSS-like filter string from preset
                const filterString = `
                    brightness(${filterPreset.brightness}%)
                    contrast(${filterPreset.contrast}%)
                    saturate(${filterPreset.saturation}%)
                    blur(${filterPreset.blur}px)
                    grayscale(${filterPreset.grayscale}%)
                    sepia(${filterPreset.sepia}%)
                    hue-rotate(${filterPreset.hue}deg)
                    invert(${filterPreset.invert}%)
                    opacity(${filterPreset.opacity}%)
                `;

                ctx.filter = filterString.trim();
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) return reject("Image processing failed");
                    const newFile = new File([blob], file.name, { type: file.type });
                    resolve(newFile);
                }, file.type);
            };

            img.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };


    const mediaVariants = {
        initial: {
            height: '0%',
            opacity: 0
        },
        exit: {
            height: '0%',
            opacity: 0
        },

        active: {
            y: -10,
            height: '120%',
            border: "2px solid var(--secondary-color)",
            opacity: 1
        },

        inactive: {
            y: 0,
            height: '100%',
            opacity: 1,
            filter: 'grayscale(100%)'
        }
    }

    const variants = {
        active: {
            width: '80px',
            fontSize: '1.5em',
            color: 'var(--text-primary-70)'
        },
        inactive: {
            width: '60px',
            fontSize: '1.2em',
            color: 'var(--text-primary-50)'
        }
    }

    return (
        <>
            <section className={style.create}>
                <div className={style.create_container}>
                    <div className={style.fileWrapper}>

                        { media?.length > 0 ? (
                            media[mediaIndex]?.type === 'image' ? (
                                <Img className={style.overViewMedia} url={media[mediaIndex]?.url} alt="media" style={filterStyle} />
                            ) : (
                                <video className={style.overViewMedia} src={media[mediaIndex]?.url} autoPlay loop style={filterStyle} />
                            )
                        ) : (
                            <h1 className={style.warning_text}>No media added</h1>
                        )}

                        { media?.length > 0 && media[mediaIndex].type === 'image' && (
                            <div className={style.toolbar}>
                                <i onClick={() => setShowCrop(true)} className="material-symbols-rounded">crop</i>
                                <i onClick={() => setShowFilters(!showFilters)} className="material-symbols-rounded">palette</i>
                                <i onClick={() => setShowAdjustments(!showAdjustments)} className="material-symbols-rounded">tune</i>
                            </div>
                        )}

                        <AnimatePresence>
                            { showSettings && (
                                <motion.section
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={style.settings_container}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className={style.settings_wrapper}
                                    >
                                        { index == 0 || index == 1  ? (
                                            <>
                                                <Input state={caption} setState={setCaption} icon="stylus" style_class={style.input} type="text" placeholder="Caption" />
                                                <div className={style.setting_container}>
                                                    <h1>Hide Likes Count</h1>
                                                    <SwitchButton checked={hideLikes} setChecked={setHideLikes} />
                                                </div>
                                                <div className={style.setting_container}>
                                                    <h1>Hide Views Count</h1>
                                                    <SwitchButton checked={hideViews} setChecked={setHideViews} />
                                                </div>
                                                <div className={style.setting_container}>
                                                    <h1>Disable Comments</h1>
                                                    <SwitchButton checked={disableComments} setChecked={setDisableComments} />
                                                </div>
                                                <div className={style.setting_container}>
                                                    <h1>Artificial Intelligence Label</h1>
                                                    <SwitchButton checked={aiLabel} setChecked={setAILabel} />
                                                </div>

                                                <div className={style.button_wrapper}>
                                                    <button onClick={() => setShowSettings(false)} className={style.setting_button}>Cancel</button>
                                                    <button onClick={ handleUpload } className={style.setting_button}>Upload</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h1 className={style.warning_text}>Are you sure you want to proceed?</h1>
                                                <div className={style.button_wrapper}>
                                                    <button onClick={() => setShowSettings(false)} className={style.setting_button}>Cancel</button>
                                                    <button onClick={ handleUpload } className={style.setting_button}>Upload</button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        <div ref={ref}>
                            {showFilters && (
                                <div className={style.filterPanel}>
                                    {FILTER_PRESETS.map((preset, filterIndex) => (
                                        <div
                                            key={filterIndex}
                                            className={`${style.filterItem} ${isCurrentFilter(preset) ? style.activeFilter : ''}`}
                                            onClick={() => updateFiltersForMedia(preset)}
                                        >
                                            <Img
                                                url={media[mediaIndex]?.url}
                                                alt={preset.name}
                                                style={{ filter: getFilterString(preset) }}
                                            />
                                            <div className={style.filterName}>{preset.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}


                            {showAdjustments && (
                                <motion.div ref={editorAdjustmentRef} className={style.adjustmentPanel} animate={{ opacity: isFocus ? 0.2 : 1 }}>
                                    {adjustmentGroups.map((group, groupIndex) => (
                                        <div key={groupIndex} className={style.adjustmentContainer}>
                                            {group.map(({ label, min, max }) => {
                                                const key = label.toLowerCase();
                                                return (
                                                    <div key={label} className={style.adjustmentItem}>
                                                        <label>{label}</label>
                                                        <input
                                                            type="range"
                                                            min={min}
                                                            max={max}
                                                            value={media[mediaIndex]?.filters[key]}
                                                            onChange={e => updateFilterValue(key, e.target.value)}
                                                            onPointerDown={() => setIsFocus(true)}
                                                            onPointerUp={() => setIsFocus(false)}
                                                            onTouchStart={() => setIsFocus(true)}
                                                            onTouchEnd={() => setIsFocus(false)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>


                        <AnimatePresence>
                            <motion.div className={style.medias_container}>
                                <AnimatePresence>
                                    {
                                        media.map((media, index) => (
                                            <motion.div
                                                key={index}
                                                className={style.media_wrapper}
                                                onClick={() => handleMediaClick(index)}

                                                variants={mediaVariants}
                                                initial="initial"
                                                animate={ mediaIndex === index ? "active" : "inactive"}
                                                exit="exit"
                                            >
                                                <Img url={media.thumbnail} alt="" />
                                                <span onClick={(e) => handleMediaRemove(e, index)} className="material-symbols-rounded">remove</span>
                                                <i className="material-symbols-rounded">{ media.type === 'image' ? 'image' : media.type === 'video' ? 'videocam' : 'dangerous' }</i>
                                            </motion.div>
                                        ))
                                    }
                                    {
                                        media?.length < buttons[index].limit && (
                                            <motion.div
                                                key="add"
                                                initial={{ height: '0%', opacity: 0 }}
                                                animate={{ height: '100%', opacity: 1 }}
                                                exit={{ height: '0%', opacity: 0 }}
                                            >
                                                <label htmlFor="fileInput" className={style.addMedia}><span className="material-symbols-rounded">add</span></label>
                                                <input ref={inputRef} onChange={(e) => handleMediaAdd(e) } type="file" multiple id="fileInput" accept={buttons[index].accept} />
                                            </motion.div>
                                        )
                                    }
                                    {
                                        media?.length !== 0 && (
                                            <motion.button
                                                initial={{ height: '0%', opacity: 0 }}
                                                animate={{ height: '100%', opacity: 1 }}
                                                exit={{ height: '0%', opacity: 0 }}
                                                className={style.nextButton}
                                                onClick={() => setShowSettings(true)}
                                            >
                                                <span className="material-symbols-rounded">check</span>
                                            </motion.button>
                                        )
                                    }
                                </AnimatePresence>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className={style.buttonWrapper}>
                        {
                            buttons.map((button, i) => (
                                <motion.span
                                    key={i}
                                    variants={variants}
                                    initial={{ fontSize: '1.2em' }}
                                    animate={index === i ? 'active' : 'inactive'}
                                    onClick={() => { setIndex(i); navigate(`/create/${button.name.toLowerCase()}`) }}
                                >
                                    {button.name}
                                </motion.span>
                            ))
                        }
                        <motion.div
                            animate={{
                                left: index * 70 + 5 + 'px'
                            }}
                            className={style.divider}
                        />
                    </div>
                </div>
            </section>

            { showCrop && <ImageCropper imageSrc={media[mediaIndex].url} onCropComplete={onCropComplete} aspect={buttons[index].acceptRatio} /> }
        </>
    )
}
