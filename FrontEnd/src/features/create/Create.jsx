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

export const Create = () => {

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const { content } = useParams();

    const inputRef = useRef(null);

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
                    originalFile: file
                }))
            )
        ];
    
        setMedia(updatedMedia);
    
        inputRef.current.value = '';
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

            if (index === 0) {
                const formData = new FormData();
                media.forEach((media) => {
                    formData.append('postFiles', media.originalFile);
                });
    
                formData.append('postTitle', caption);
                formData.append('postHideLikes', hideLikes);
                formData.append('postHideViews', hideViews);
                formData.append('postCommentsDisabled', disableComments);
                formData.append('postAiLabel', aiLabel);
    
                await addPost(formData);
            }
            else if (index === 1) {
                const formData = new FormData();
                formData.append('reelFiles', media[0].originalFile);
    
                formData.append('reelTitle', caption);
                formData.append('reelHideLikes', hideLikes);
                formData.append('reelHideViews', hideViews);
                formData.append('reelCommentsDisabled', disableComments);
                formData.append('reelAiLabel', aiLabel);
    
                await addReel(formData);
            }
            else if (index === 2) {
                const formData = new FormData();
                media.forEach((media) => {
                    formData.append('storyFiles', media.originalFile);
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
    }
    

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
                        
                        { media?.length > 0 ?
                            (
                                media[mediaIndex]?.type === 'image' ? (
                                    <Img className={style.overViewMedia} url={media[mediaIndex]?.url} alt="media" />
                                ) : (
                                    <video className={style.overViewMedia} src={media[mediaIndex]?.url} autoPlay loop />
                                )
                            ) : (
                                <h1 className={style.warning_text}>No media added</h1>
                            )
                        }

                        { media?.length > 0 && media[mediaIndex].type === 'image' && (
                            <div className={style.toolbar}>
                                <i onClick={() => setShowCrop(true)} className="material-symbols-rounded">crop</i>
                                {/* <i onClick={() => setShowCrop(true)} className="material-symbols-rounded">tune</i>
                                <i onClick={() => setShowCrop(true)} className="material-symbols-rounded">music_note</i> */}
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
                                        {
                                            console.log(mediaIndex)
                                        }
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