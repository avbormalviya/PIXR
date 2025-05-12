import style from "./settings.module.scss"
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserAccount } from "../../utils/getAccount";
import { format, formatDistanceToNowStrict } from 'date-fns';
import { updateAccount } from "../../utils/updateAccount";
import { SwitchButton } from "../../components/switch/Switch";
import { logout } from "../../utils/logout";
import { useSelector, useDispatch } from "react-redux";
import { deleteUserData } from "../../features/user/useSlice";
import { Box, Drawer, ImageList, ImageListItem } from "@mui/material";
import { getBookmarks } from "../../utils/getBookmarks";
import { createThumbnail } from "../../utils/createThumbnail";
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { ImageCropper } from "../cropper/Cropper";
import { FeedDetails } from "../../components/feedDetailes/FeedDetails";
import { Img } from "../../components/img/Img";
import { addReport } from "../../utils/addReport";
import HandGestureContext from "../../context/HandContext";
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { Alert } from "../../components/alert/Alert";
import { getToken } from 'firebase/messaging';
import { useFirebase } from '../../context/FireBaseContext';


const themes = [
    "light",
    "dark",
    "warm",
    "neumorphism",
    "hacker",
    "google-light",
    "google-dark",
    "clutchup-light",
    "clutchup-dark",
    "soft-gradient-light",
    "soft-gradient-dark",
    "big-sur-light",
    "big-sur-dark",
    "bugatti-light",
    "bugatti-dark",
    "windows11-light",
    "windows11-dark",
];


export const Settings = () => {
    const navigate = useNavigate();

    const { type } = useParams();

    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const { messaging } = useFirebase();

    const [account, setAccount] = useState("");
    const [savedFeeds, setSavedFeeds] = useState([]);
    const [firstTime, setFirstTime] = useState(true);
    const [showButton, setShowButton] = useState(false);
    const [cropImage, setCropImage] = useState(null);
    const [showCrop, setShowCrop] = useState(false);
    const [croppedImage, setCroppedImage] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem("theme"));
    const [report, setReport] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [alertsDrawer, setAlertsDrawer] = useState([{ id: Date.now(), type: "info", message: "We request access to your microphone, camera, and notifications to enable calling, face recognition, and timely alerts. Microphone and camera access help us support real-time interaction and identity verification, while notification access ensures you don’t miss important updates or activity. Your data stays on your device and is used only to make these features work properly." }]);

    const [isFeedOpen, setIsFeedOpen] = useState({})

    const { isHandGesture, setIsHandGesture, showDisplay, setShowDisplay } = useContext(HandGestureContext);

    const isMobile = useMediaQuery('(max-width: 760px)');


    useEffect(() => {
        document.body.classList.remove(...themes);
        document.body.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        ( async () => {
            if (type === "account") {
                const { data } = await getUserAccount();
                setAccount(data);
            }
            else if (type === "saved") {
                const { data } = await getBookmarks();
                const updatedData = await Promise.all(
                    data.map(async (item) => {
                        if (item.saveType !== "reel") return item;

                        const updatedItem = { ...item };
                        updatedItem.thumbnail = await createThumbnail(item.thumbnail);
                        return updatedItem;
                    })
                );
                setSavedFeeds(updatedData);
            }

        })();
    }, [type]);

    useEffect(() => {
        if (account == "") return;
        if (firstTime) {
            setFirstTime(false);
            return;
        };
        setShowButton(true);
    }, [account]);


    const notify = () => {
        if (Notification.permission === "granted") {
            setIsNotificationsEnabled(true);
            showAlert("success", "Notifications enabled");
        } else {
            setIsNotificationsEnabled(false);
            showAlert("error", "Notifications access denied");
        }
    };

    useEffect(() => {
        // Microphone
        navigator.permissions?.query({ name: 'microphone' })
        .then(result => {
            setIsMicEnabled(result.state === 'granted');
        });

        // Camera
        navigator.permissions?.query({ name: 'camera' })
        .then(result => {
            setIsCameraEnabled(result.state === 'granted');
        });

        // Notifications
        notify();

        window.addEventListener("focus", notify);
        return () => window.removeEventListener("focus", notify);
    }, []);

    useEffect(() => {
        if (isMicEnabled) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    showAlert("success", "Microphone access granted");
                })
                .catch(() => {
                    setIsMicEnabled(false);
                    showAlert("error", "Microphone access denied");
                });
        }
    }, [isMicEnabled]);

    useEffect(() => {
        if (isCameraEnabled) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    showAlert("success", "Camera access granted");
                })
                .catch(() => {
                    setIsCameraEnabled(false);
                    showAlert("error", "Camera access denied");
                });
        }
    }, [isCameraEnabled]);

    useEffect(() => {
        const notification_request = async () => {
            if (Notification.permission === "granted") {
                setIsNotificationsEnabled(true);
            } else {
                await Notification.requestPermission();
            }
        }

        if (isNotificationsEnabled) {
            notification_request();
        }
    }, [isNotificationsEnabled]);

    const items = ["Account", "Saved", "Theme", "Hand Gesture", "Permissions", "Help", "Private Policy", "Report", "Logout"]

    const handleSettingsOpen = (item) => {
        if (["Theme", "Hand Gesture", "Logout", "Delete Account"].includes(item)) return;
        if (item === "Permissions") {
            toggleDrawer(true)();
            return;
        }
        navigate(`/settings/${item.toLowerCase()}`);
    }

    const showAlert = (type, message) => {
        const id = Date.now();
        const newAlert = { id, type, message };
        setAlerts(prev => [...prev, newAlert]);

        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 5000); // dismiss after 4 seconds
    };


    const toggleDrawer = (newOpen) => () => {
        setDrawerOpen(newOpen);
    };

    const DrawerList = (
        <section className={style.drawer}>
            <h1 className={style.drawer_heading}>Permissions</h1>

            <div className={style.drawer_outer}>
                <div className={style.drawer_item}>
                    <span className={style.drawer_item_title}> <MicRoundedIcon fontSize="large" /> Microphone</span>
                    <SwitchButton checked={isMicEnabled} setChecked={setIsMicEnabled} />
                </div>
                <div className={style.drawer_item}>
                    <span className={style.drawer_item_title}> <CameraAltRoundedIcon fontSize="large" /> Camera</span>
                    <SwitchButton checked={isCameraEnabled} setChecked={setIsCameraEnabled} />
                </div>
                <div className={style.drawer_item}>
                    <span className={style.drawer_item_title}> <NotificationsRoundedIcon fontSize="large" /> Notification</span>
                    <SwitchButton checked={isNotificationsEnabled} setChecked={setIsNotificationsEnabled} />
                </div>
            </div>

            <div className={style.alert_wrapper}>
                <Alert alerts={alerts} setAlerts={setAlerts} />
            </div>

            <div className={style.drawer_info}>
                <Alert alerts={alertsDrawer} setAlerts={setAlertsDrawer} />
            </div>
        </section>
    );

    const handleAccountUpdate = async () => {
        const formData = new FormData();

        Object.keys(account).forEach((key) => {
            if (key === "profilePic") {
                if (croppedImage) {
                    formData.append(key, croppedImage);
                }
                return;
            }

            formData.append(key, account[key]);
        });


        await updateAccount(formData);
        navigate(`/user/${user.userName}`);
        window.location.reload(true);
    }

    const handleUserLogout = async () => {
        await logout();
        dispatch(deleteUserData());
    }

    const handleImageChange = (e) => {
        const file = URL.createObjectURL(e.target.files[0]);
        setCropImage(file);
        setShowCrop(true);
    }

    const handleCropperComplete = (data) => {
        const { src, file } = data;
        setAccount({ ...account, profilePic: src });
        setCroppedImage(file);
        setShowCrop(false);
    }

    const handleReport = async () => {
        await addReport({ message: report });
        navigate(-1);
    }

    return (
        <section className={style.settings}>
            <section className={style.settings_section}>
                <h1 className={style.settings_heading}>
                    <span onClick={ () => navigate(-1) }> <ArrowBackRoundedIcon fontSize="large" />Settings</span> { type && `/ ${type.charAt(0).toUpperCase() + type.slice(1)}` }
                </h1>

                {
                    !type && <section className={style.settings_wrapper}>
                        {
                            items.map((item, index) => (
                                <div key={ index } onClick={ () => handleSettingsOpen(item) } className={style.settings_card_heading}>
                                    { item }
                                    { item === "Theme" && (
                                        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                            {themes.map((t) => (
                                                <option key={t} value={t}>
                                                    {t.replace("-theme", " ")}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    { item === "Hand Gesture" && (
                                        <div className={style.handGesture}>
                                            <SwitchButton checked={isHandGesture} setChecked={setIsHandGesture} />
                                            { isHandGesture && (
                                                <>
                                                    <h1 className={style.handGestureText}>Display</h1>
                                                    <SwitchButton checked={showDisplay} setChecked={setShowDisplay} disabled={!isPermissionsGranted?.camera?.granted} />
                                                </>
                                            )}
                                        </div>
                                    )}

                                    { item === "Logout" && <button onClick={ handleUserLogout }>Logout</button> }
                                    { item === "Delete Account" && <button onClick={ () => {} }>Delete Account</button> }
                                </div>
                            ))
                        }
                    </section>
                }

                {
                    type === "private policy" && (
                        <section className={style.container}>
                            <p className={style.effectiveDate}>Effective Date: [Insert Date]</p>
                            <p className={style.lastUpdated}>Last Updated: [Insert Date]</p>

                            <section className={style.section}>
                                <h2 className={style.subheading}>1. Information We Collect</h2>
                                <p>
                                    We may collect the following types of information:
                                </p>
                                <ul className={style.list}>
                                    <li><strong>Personal Information:</strong> Name, email address, phone number, and other details you provide during registration or while using our services.</li>
                                    <li><strong>Non-Personal Information:</strong> Device information, browser type, IP address, and browsing activity on our website.</li>
                                    <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to enhance user experience, analyze website traffic, and provide personalized content.</li>
                                </ul>
                            </section>

                            <section className={style.section}>
                                <h2 className={style.subheading}>2. How We Use Your Information</h2>
                                <p>
                                    We use the information collected for the following purposes:
                                </p>
                                <ul className={style.list}>
                                    <li>To provide and improve our services.</li>
                                    <li>To communicate with you (e.g., customer support, updates, promotional content).</li>
                                    <li>To analyze and optimize website performance.</li>
                                    <li>To ensure security and prevent fraud.</li>
                                </ul>
                            </section>

                            <section className={style.section}>
                                <h2 className={style.subheading}>3. How We Share Your Information</h2>
                                <p>
                                    We do not sell your personal information. However, we may share your information with:
                                </p>
                                <ul className={style.list}>
                                    <li><strong>Service Providers:</strong> Third-party vendors who assist us with website operations, analytics, and customer support.</li>
                                    <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
                                    <li><strong>Business Transfers:</strong> In case of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</li>
                                </ul>
                            </section>

                            <section className={style.section}>
                                <h2 className={style.subheading}>4. Your Rights and Choices</h2>
                                <p>
                                    Depending on your location, you may have certain rights regarding your personal information:
                                </p>
                                <ul className={style.list}>
                                    <li><strong>Access and Correction:</strong> You can access and update your personal information by logging into your PIXR account.</li>
                                    <li><strong>Data Deletion:</strong> You may request the deletion of your personal information by contacting us at <a href="mailto:[insert-email]" className={style.link}>[insert-email]</a>.</li>
                                    <li><strong>Opt-Out:</strong> You can opt out of receiving promotional emails by clicking the "Unsubscribe" link in our emails.</li>
                                    <li><strong>Cookies:</strong> You can manage your cookie preferences through your browser settings.</li>
                                </ul>
                            </section>

                            <footer className={style.footer}>
                                <p>If you have any questions, feel free to contact us at <a href="mailto:[insert-email]" className={style.link}>[insert-email]</a>.</p>
                            </footer>
                        </section>
                    )
                }

                {
                    type === "help" && (
                        <section className={style.container}>
                            <h1 className={style.help_heading}>Pixr Help Section</h1>

                            <section className={style.faq}>
                                <h2>Frequently Asked Questions (FAQ)</h2>
                                <div className={style.faq_item}>
                                    <h3>1. How do I create an account on Pixr?</h3>
                                    <p>To create an account, click on the "Sign Up" button at the top right of the homepage, enter your email, and follow the prompts to set up your account.</p>
                                </div>
                                <div className={style.faq_item}>
                                    <h3>2. I forgot my password. What should I do?</h3>
                                    <p>No worries! Simply click on the "Forgot Password?" link on the login page, and we'll send you an email with instructions to reset your password.</p>
                                </div>
                                <div className={style.faq_item}>
                                    <h3>3. How can I update my profile?</h3>
                                    <p>Once logged in, go to your profile page and click on the "Edit Profile" button. From there, you can update your information, including your photo, username, and more.</p>
                                </div>
                                <div className={style.faq_item}>
                                    <h3>4. How do I contact customer support?</h3>
                                    <p>If you're having issues or need further assistance, you can reach our support team directly through the "Contact Us" page. We're available 24/7 to help you out!</p>
                                </div>
                            </section>

                            <section className={style.contact_us}>
                                <h2>Contact Us</h2>
                                <p>If you couldn't find the answer to your question in the FAQs, feel free to reach out to us. You can contact us via:</p>
                                <ul>
                                    <li><strong>Email:</strong> support@pixr.com</li>
                                    <li><strong>Phone:</strong> +1 (800) 123-4567</li>
                                    <li><strong>Live Chat:</strong> Click the chat icon in the bottom-right corner of your screen.</li>
                                </ul>
                                <p>Our support team is here to assist you with any inquiries, troubleshooting, or general help.</p>
                            </section>

                            <section className={style.technical_support}>
                                <h2>Technical Support</h2>
                                <p>If you're experiencing technical issues with our website or features, please follow these steps:</p>
                                <ol>
                                    <li>Check your internet connection.</li>
                                    <li>Clear your browser cache and cookies.</li>
                                    <li>Try accessing Pixr on a different browser or device.</li>
                                </ol>
                                <p>If these steps don't resolve your issue, please reach out to us through the contact options above, and we'll investigate further.</p>
                            </section>

                            <section className={style.user_guides}>
                                <h2>User Guides & Tutorials</h2>
                                <p>To help you get the most out of Pixr, we’ve created detailed user guides and tutorials on the following topics:</p>
                                <ul>
                                    <li><strong>Getting Started</strong> with Pixr</li>
                                    <li><strong>Uploading and Managing Your Content</strong></li>
                                    <li><strong>Using Pixr's Features & Tools</strong></li>
                                    <li><strong>Security and Privacy Tips</strong></li>
                                </ul>
                                <p>Visit our <a href="/guides">Guides & Tutorials</a> page for more information.</p>
                            </section>
                        </section>
                    )
                }

                {
                    type === "account" && (
                        <section className={style.container} style={{ gap: "1rem" }}>
                            <div className={style.account_item}>
                                <h1>Profile Picture</h1>
                                <div className={style.wrapper}>
                                    <Img url={account.profilePic} alt="Profile Picture" />
                                    <button onClick={() => document.querySelector("input[type=file]").click()}>Change</button>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e)} />
                                </div>

                                {
                                    showCrop && <ImageCropper imageSrc={cropImage} aspect={1} onCropComplete={handleCropperComplete} />
                                }

                                <div className={style.wrapper}>
                                    <h1>Email</h1>
                                    <input type="text" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
                                </div>

                                <div className={style.wrapper}>
                                    <h1>Username</h1>
                                    <input type="text" value={account.userName} onChange={(e) => setAccount({ ...account, userName: e.target.value })} />
                                </div>

                                {/* <div className={style.wrapper}>
                                    <h1>Password</h1>
                                    <input type="text" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
                                </div> */}

                                {/* <div className={style.wrapper}>
                                    <h1>Birth Date</h1>
                                    {
                                        account.birthDate && <input type="text" value={format(account.birthDate, "yyyy-MM-dd")} onChange={(e) => setAccount({ ...account, birthDate: e.target.value })} />
                                    }
                                </div> */}

                                <div className={style.wrapper}>
                                    <h1>Full Name</h1>
                                    <input type="text" value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} />
                                </div>

                                <div className={style.wrapper}>
                                    <h1>Bio</h1>
                                    <textarea type="text" value={account.bio} onChange={(e) => setAccount({ ...account, bio: e.target.value })} />
                                </div>

                                <div className={style.wrapper}>
                                    <h1>Private</h1>
                                    <select value={account.Private} onChange={() => setAccount({ ...account, Private: !account.Private })}>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                </div>

                                <div className={style.wrapper}>
                                    <h1>Role</h1>
                                    <select value={account.role} onChange={(e) => setAccount({ ...account, role: e.target.value })}>
                                        {
                                            [
                                                "Animal Lover",
                                                "Animator",
                                                "Artist",
                                                "Blogger",
                                                "Chef",
                                                "Content Creator",
                                                "Designer",
                                                "Digital Artist",
                                                "DIY Expert",
                                                "Editor",
                                                "Entrepreneur",
                                                "Environmentalist",
                                                "Fitness Enthusiast",
                                                "Fitness Trainer",
                                                "Gamer",
                                                "Gamer Girl",
                                                "Graphic Designer",
                                                "Influencer",
                                                "Investor",
                                                "Journalist",
                                                "Motivational Speaker",
                                                "Musician",
                                                "Photographer",
                                                "Podcaster",
                                                "Programmer",
                                                "Reviewer",
                                                "Student",
                                                "Streamer",
                                                "Teacher",
                                                "Tech Enthusiast",
                                                "Traveler",
                                                "Vlogger",
                                                "Writer",
                                                "Developer",
                                                "Designer",
                                                "Movie Buff",
                                                "Influencer",
                                                "YouTuber",
                                                "Photographer",
                                                "PixrStar",
                                                "Programmer"
                                            ].map((role, index) => (<option key={index} value={role}>{role}</option>))
                                        }
                                    </select>
                                </div>

                                <div className={style.accountCreation}>
                                    <ul>
                                        <li>
                                            <strong>Created on : </strong>
                                            {
                                                account.createdAt ? formatDistanceToNowStrict(account.createdAt, { addSuffix: true }): "Unknown"
                                            }
                                        </li>
                                        <li>
                                            <strong>Updated on : </strong>
                                            {
                                                account.updatedAt ? formatDistanceToNowStrict(account.updatedAt, { addSuffix: true }): "Unknown"
                                            }
                                        </li>
                                    </ul>
                                </div>

                                {
                                    showButton && (
                                        <div className={style.accountButtons}>
                                            <button onClick={handleAccountUpdate}>Save</button>
                                            <button onClick={() => navigate(-1)}>Cancel</button>
                                        </div>
                                    )
                                }
                            </div>
                        </section>
                    )
                }

                {
                    type === "saved" && (
                        <section className={style.container}>
                            <ImageList variant="masonry" cols={3} gap={5}>
                                {[...savedFeeds].reverse().map((item) => (
                                    item.thumbnail && (
                                        <ImageListItem key={item.img}>
                                            <Img
                                                style={{ width: "100%", borderRadius: "2em" }}
                                                src={item.thumbnail.startsWith("https://") ? item.thumbnail : item.thumbnail.startsWith("data:") ? item.thumbnail : `https://${item.thumbnail.split("://")[1]}`}
                                                alt={item.title}
                                                onClick={() => setIsFeedOpen({ isFeedOpen: true, feedId: item._id, feedType: item.saveType })}
                                            />
                                            {
                                                item.saveType === "reel" && (
                                                    <PlayArrowRoundedIcon fontSize="large" style={{ position: "absolute", top: "10", right: "10", color: "aliceblue", filter: "drop-shadow(2px 4px 6px black)" }} />
                                                )
                                            }
                                        </ImageListItem>
                                    )
                                ))}
                            </ImageList>
                            {
                                savedFeeds.length === 0 && (
                                    <div className={style.nothingFound}>
                                        <h1>Nothing Found</h1>
                                    </div>
                                )
                            }
                        </section>
                    )
                }

                {
                    type === "report" && (
                        <section className={style.container}>
                            <section style={{ marginBottom: "1em" }} className={style.account_item}>
                                <textarea value={report} onChange={(e) => setReport(e.target.value)} placeholder="Reason for report" />
                                {
                                    report && (
                                        <div className={style.accountButtons}>
                                            <button onClick={handleReport}>Report</button>
                                            <button onClick={() => navigate(-1)}>Cancel</button>
                                        </div>
                                    )
                                }
                            </section>
                        </section>
                    )
                }
            </section>

            {
                isFeedOpen.isFeedOpen && <FeedDetails feedId={isFeedOpen.feedId} feedType={isFeedOpen.feedType} setIsDetailsOpen={setIsFeedOpen} />
            }

            <Drawer
                anchor={isMobile ? 'bottom' : 'right'}
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: {
                        width: isMobile ? '100%' : "500px",
                        height: isMobile ? 'auto' : '100%',
                        borderRadius: isMobile ? '2em 2em 0 0' : '2em 0 0 2em',
                        backgroundColor: "var(--background-secondary)",
                        overflow: 'hidden',
                    },
                }}
            >
                {DrawerList}
            </Drawer>

        </section>
    )
}
