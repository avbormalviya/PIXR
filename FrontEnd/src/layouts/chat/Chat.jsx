import style from "./chat.module.scss";
import { NormalUserCard } from "../../components/userCard/UserCard";
import { UserPPic } from "../../components/userPPic/UserPPic";
import { AnimatePresence, motion } from "framer-motion";
import { Reorder } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";

import { useSelector } from "react-redux";
import { fetchAndUserFollowerAndFollowing } from "../../utils/getUserFollowerAndFollowing";
import { Img } from "../../components/img/Img";
import { sendMessage } from "../../utils/sendMessage";
import { createOrGetOneOnOneChat } from "../../utils/createOrGetOneOnOneChat";
import { useSocket } from "../../context/SocketContext"

import { useNavigate } from "react-router-dom";

import { usePeerContext } from "../../context/PeerContext";

import { useMediaQuery } from 'react-responsive';

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

import { format, isToday, isYesterday } from 'date-fns';

export const Chat = () => {
    const navigate = useNavigate();

    const { initiateCall } = usePeerContext();

    const { user } = useSelector((state) => state.user);

    const { emit, on } = useSocket();

    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    const childRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef()]);

    const [followings, setFollowings] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragged, setIsDragged] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    const [inputMessage, setInputMessage] = useState("");

    const [messages, setMessages] = useState([]);
    const [groupedMessages, setGroupedMessages] = useState({});

    const [typing, setTyping] = useState({});

    const [chat, setChat] = useState();
    const [chatUser, setChatUser] = useState();

    const [isChatOpen, setIsChatOpen] = useState(false);

    const [isEmojiOpen, setIsEmojiOpen] = useState(false);

    const [sections, setSections] = useState([
        // { id: 0, title: "Mood Songs" },
        // { id: 1, title: "Ask AI" },
        { id: 2, title: "Chats" },
        // { id: 3, title: "Requests" },
    ]);

    useEffect(() => {
        on("receiveMessage", (data) => {
            setGroupedMessages((prevGroupedMessages) => {
                const newMessageDate = new Date(data.createdAt);

                let dateKey;
                if (isToday(newMessageDate)) {
                    dateKey = "Today";
                } else if (isYesterday(newMessageDate)) {
                    dateKey = "Yesterday";
                } else {
                    dateKey = format(newMessageDate, 'dd MMM yyyy');
                }

                const updatedGroupedMessages = { ...prevGroupedMessages };

                if (!updatedGroupedMessages[dateKey]) {
                    updatedGroupedMessages[dateKey] = [];
                }

                updatedGroupedMessages[dateKey].unshift(data);

                const reversedGroupedMessages = {};
                Object.keys(updatedGroupedMessages).forEach((key) => {
                    reversedGroupedMessages[key] = updatedGroupedMessages[key];
                });

                return reversedGroupedMessages;
            });
        });


        on("typing", (data) => {
            setTyping({ typing: true, user: data });
        })

        on("stopTyping", () => {
            setTyping({});
        })
    }, [on]);

    useEffect(() => {
        ( async () => {
            const result = await fetchAndUserFollowerAndFollowing(user.userName);
            setFollowings(result.data.followings);
        })();
    }, [user]);

    useEffect(() => {
        const childrenLength = childRefs.current[activeSection]?.current?.children.length;
        if (!childRefs.current[activeSection]) return;
        childRefs.current[activeSection].current.style.maxHeight = childrenLength ? (childrenLength * 65) + ((childrenLength - 1) * 10) + 20 + "px" : "0";
    }, [childRefs, activeSection]);


    const handleSendMessage = async () => {
        setIsEmojiOpen(false);
        await sendMessage(chat._id, inputMessage);
        setInputMessage("");
    };

    const handleChatOpen = async (chatUser) => {
        setIsChatOpen(true);
        setChatUser(chatUser);

        chat?._id && emit("leaveRoom", chat?._id);

        const result = await createOrGetOneOnOneChat(chatUser.userName);

        setChat(result.data);

        setGroupedMessages(groupMessagesByDate(result.data.messages));

        emit("joinRoom", result.data._id);
    };

    const handleTyping = () => {
        emit("typing", chat._id);
    }

    const handleStopTyping = () => {
        emit("stopTyping", chat._id);
    }

    const handleCallButton = () => {
        initiateCall(chatUser._id, user._id);

        navigate(`/chat/call/${chatUser._id}`, { state: { user: chatUser, from: user._id } });
    }

    const groupMessagesByDate = (messages) => {
        if (!messages.length) return {};
        const grouped = messages.reduce((groups, message) => {
            const messageDate = new Date(message.createdAt);

            let dateKey;
            if (isToday(messageDate)) {
                dateKey = "Today";
            } else if (isYesterday(messageDate)) {
                dateKey = "Yesterday";
            } else {
                dateKey = format(messageDate, 'dd MMM yyyy');
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }

            groups[dateKey].push(message);
            return groups;
        }, {});

        const reversedGrouped = {};
        Object.keys(grouped).reverse().forEach((key) => {
            reversedGrouped[key] = grouped[key].reverse();
        });

        return reversedGrouped;
    };


    const animations = {
        hover: { cursor: "grab" },
        drag_h1: {
            cursor: "grabbing",
            padding: "0.5em",
            border: "2px solid var(--accent-border-color)",
            borderRadius: "10px",
            backgroundColor: "var(--background-secondary)",
            zIndex: "5",
        },
        drag_div: {
            maxHeight: "0",
            padding: "0",
        },
        default: {},
    };

    const messageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 }
    };

    return (
        <section className={style.lobby}>
            <div className={style.lobby_container}>

                <motion.div
                    animate={ isMobile ? isChatOpen ? { display: 'flex' } : { display: 'none' } : null } transition={{ duration: 0.3 } }
                    className={style.lobby_room}
                >

                    {
                        !chat && (
                            <div className={style.lobby_illustration}>
                                <img src="https://res-console.cloudinary.com/dr6gycjza/thumbnails/v1/image/upload/v1743242136/c2NyZWVuc2hvdC0xNzQzMjQxODQ2NTI1X18xXy1yZW1vdmViZy1wcmV2aWV3X3lkdDJtOQ==/preview" alt="illustration" />
                            </div>
                        )
                    }

                    <NormalUserCard
                        styles={style.chat_header}
                        userName={chatUser?.userName}
                        fullName={chatUser?.fullName}
                        profilePic={chatUser?.profilePic}
                        callButton={true}
                        event={handleCallButton}
                    />


                    <section className={style.lobby_messages_wrapper}>

                        {/* <AnimatePresence> */}
                            {
                                typing.typing && (
                                    <motion.div
                                        key={typing.user._id}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={messageVariants}
                                        transition={{ duration: 0.3 }}
                                        className={style.otherSide_chat}
                                    >
                                        <Img url={chatUser?.profilePic} />
                                        <div className={style.chat_message} style={{ padding: "0.5em 1em 0 1em", display: "flex" }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <style>
                                                    {`
                                                        .spinner_qM83 {
                                                            animation: spinner_8HQG 1.05s infinite;
                                                        }
                                                        .spinner_oXPr {
                                                            animation-delay: 0.1s;
                                                        }
                                                        .spinner_ZTLf {
                                                            animation-delay: 0.2s;
                                                        }
                                                        @keyframes spinner_8HQG {
                                                            0%, 57.14% {
                                                                animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
                                                                transform: translate(0);
                                                            }
                                                            28.57% {
                                                                animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
                                                                transform: translateY(-6px);
                                                            }
                                                            100% {
                                                                transform: translate(0);
                                                            }
                                                        }
                                                    `}
                                                </style>
                                                <circle className="spinner_qM83" cx="4" cy="12" r="3" fill="var(--primary-color)" />
                                                <circle className="spinner_qM83 spinner_oXPr" cx="12" cy="12" r="3" fill="var(--primary-color)" />
                                                <circle className="spinner_qM83 spinner_ZTLf" cx="20" cy="12" r="3" fill="var(--primary-color)" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                )
                            }


                            {
                                Object.keys(groupedMessages).map((date, dateIndex) => (
                                    <>
                                        {groupedMessages[date].map((message, messageIndex) => {
                                            const isMyMessage = message?.sender === user._id;

                                            return (
                                                <motion.div
                                                    key={messageIndex}
                                                    className={isMyMessage ? style.mySide_chat : style.otherSide_chat}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    variants={messageVariants}
                                                    transition={{
                                                    duration: 0.3,
                                                    layout: { type: "spring", stiffness: 300, damping: 30 },
                                                }}
                                                    layout
                                                >
                                                    {!isMyMessage && <Img url={chatUser?.profilePic} />}

                                                    <div className={style.chat_message}>
                                                        {message.content}
                                                    </div>

                                                    <div className={style.chat_time}>
                                                        {format(new Date(message.createdAt), 'h:mm a')}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        <div className={style.date_divider}>{date}</div>
                                    </>
                                ))
                            }

                        {/* </AnimatePresence> */}
                    </section>



                    <footer className={style.lobby_footer}>

                        <AnimatePresence>
                            {
                                isEmojiOpen && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={style.emoji_wrapper}>
                                        <Picker data={data} onEmojiSelect={(emoji) => setInputMessage(inputMessage + emoji.native)} previewPosition="none" theme={ localStorage.getItem("theme") === "dark" ? "dark" : "light" } />
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>

                        {/* <span className="material-symbols-rounded">attach_file</span> */}
                        <input
                            onChange={(e) => setInputMessage(e.target.value)}
                            onFocus={ handleTyping }
                            onBlur={ handleStopTyping }
                            value={inputMessage}
                            type="text"
                            placeholder="Type a message..."
                        />
                        <span onClick={ handleSendMessage } className="material-symbols-rounded">send</span>
                        <span className="material-symbols-rounded" onClick={() => setIsEmojiOpen(!isEmojiOpen)}>mood</span>
                    </footer>
                </motion.div>

                <motion.div
                    animate={ isMobile ? isChatOpen ? { display: 'none' } : { display: 'block' } : null } transition={{ duration: 0.3 } }
                    className={style.chat_lobby}
                >
                    <div className={style.chats_wrapper}>
                        <Reorder.Group axis="y" values={sections} onReorder={setSections}>
                            {sections.map(section => (
                                <Reorder.Item
                                    key={section.id}
                                    value={section}
                                    onHoverStart={() => { setIsHovered(true); setActiveSection(section.id); }}
                                    onHoverEnd={() => setIsHovered(false)}
                                    onDragStart={() => { setIsDragged(true); setActiveSection(section.id); }}
                                    onDragEnd={() => setIsDragged(false)}
                                >
                                    <motion.h1
                                        animate={activeSection === section.id && isDragged ? animations.drag_h1 : isHovered ? animations.hover : animations.default}
                                    >
                                        {section.title}
                                    </motion.h1>

                                    <motion.div
                                        ref={childRefs.current[section.id]}
                                        className={section.id === 0 ? style.moods_wrapper : section.id === 1 ? style.ai_chat : section.id === 2 ? style.pinned_chats : style.all_chats}
                                        animate={activeSection === section.id && isDragged ? animations.drag_div : animations.default}
                                    >
                                        {section.id === 0 && <UserPPic name="Khushi" profilePic="https://i.pinimg.com/originals/92/9a/48/929a488e6170e5423c394705a52de932.gif" />}
                                        {section.id === 1 && <NormalUserCard styles={style.user_card} name="AI" userName="PIXR AI" profilePic="https://i.pinimg.com/originals/6d/3c/fd/6d3cfda6e7bae017c8b264fb3a821e12.gif" />}
                                        {section.id !== 0 && section.id !== 1 &&
                                            (
                                                followings?.map((following, index) => (
                                                        <NormalUserCard key={index} styles={style.user_card} fullName={following.fullName} userName={following.userName} profilePic={following.profilePic} event={() => handleChatOpen(following) } />
                                                    )
                                                )
                                            )
                                        }
                                    </motion.div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
