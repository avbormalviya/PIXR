import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    TypingIndicator,
    ConversationHeader,
    Avatar,
    VoiceCallButton,
    VideoCallButton,
    ConversationList,
    Conversation,
    MainContainer,
    Sidebar,
    Search,
    MessageGroup,
    MessageSeparator,
    Loader,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

import { useSocket } from "../../context/SocketContext"
import { getChatFollowings } from "../../utils/getChatFollowings";
import { sendMessage } from "../../utils/sendMessage";
import { createOrGetOneOnOneChat } from "../../utils/createOrGetOneOnOneChat";
import { requestCameraAndMicAccess } from "../../utils/getPermission";
import { Img } from "../../components/img/Img";
import { usePeerContext } from "../../context/PeerContext";
import { useNavigate } from "react-router-dom";

import {
    format,
    isToday,
    isYesterday,
    isThisYear,
    formatDistanceToNow,
    differenceInMinutes,
} from "date-fns";

import chatsvg from "/svg/undraw_social-serenity_x9vq.svg"
// import chatsvg from "/svg/undraw_connection_ts3f.svg"

import style from "./chat.module.scss";


export const Chat = () => {

    const navigate = useNavigate();

    const { user } = useSelector((state) => state.user);

    const { initiateCall } = usePeerContext();

    const { emit, on, off } = useSocket();

    const fileInputRef = useRef(null);

    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [followings, setFollowings] = useState([]);
    const [chat, setChat] = useState(null);
    const [groupedMessages, setGroupedMessages] = useState({});
    const [chatUser, setChatUser] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [typing, setTyping] = useState({ typing: false, user: null });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [attachments, setAttachments] = useState({type: null, file: null, url: null});
    const [attachmentsDownloaded, setAttachmentsDownloaded] = useState([]);
    const [isAttachmentsDownloading, setIsAttachmentsDownloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        ( async () => {
            const result = await getChatFollowings();
            setFollowings(result.data);
        })();

        ( async () => {
            const result = await requestCameraAndMicAccess();
            setIsPermissionsGranted(result.mic.granted);
        })();

        emit("onlineUsers");
    }, []);


    useEffect(() => {
        if (inputMessage.trim() === '') {
            emit("stopTyping", chat?._id);
            return;
        }

        // Emit 'typing' event
        emit("typing", chat?._id);

        // Set a timeout to emit 'stopTyping' after 3 seconds
        const typingTimeout = setTimeout(() => {
            emit("stopTyping", chat?._id);
        }, 2000);

        // Clean-up the timeout if inputMessage changes or component unmounts
        return () => {
            clearTimeout(typingTimeout);
        };
    }, [inputMessage]);


    useEffect(() => {
        const handleReceiveMessage = (message) => {
            if (message.chat !== chat?._id) {
                setFollowings(prev => {
                    return prev.map(following => {
                        if (following._id === message.chat) {
                            following.lastMessage = message;
                        }
                        return following;
                    });
                })
            };

            const optimisticMessage = message;
            setGroupedMessages(prev => {
                const updated = { ...prev };

                // Find the latest group (regardless of sender)
                const latestEntry = Object.entries(updated)
                    .sort(([, a], [, b]) => new Date(b.firstMessageTime) - new Date(a.firstMessageTime))[0];

                const now = optimisticMessage.createdAt || new Date().toISOString();
                const senderId = optimisticMessage.sender._id; // Assuming message has sender object with _id
                const senderName = optimisticMessage.sender.fullName; // Assuming message has sender object with fullName
                const isIncoming = senderId !== user._id; // Assuming `user` is available in scope

                let groupKey;

                if (latestEntry) {
                    const [key, group] = latestEntry;
                    const lastSenderId = group.senderId;
                    const lastIsIncoming = lastSenderId !== user._id;

                    const lastMsg = group.messages[group.messages.length - 1];
                    const lastMsgTime = lastMsg?.createdAt || group.firstMessageTime;
                    const gap = differenceInMinutes(new Date(now), new Date(lastMsgTime));

                    // Decide if a new group should be created
                    const shouldStartNew =
                        isIncoming !== lastIsIncoming ||  // Direction change (incoming vs outgoing)
                        senderId !== lastSenderId ||      // Different sender
                        gap > 10;                         // Message gap too large (configurable threshold)

                    if (!shouldStartNew) {
                        groupKey = key;
                        updated[groupKey] = {
                            ...group,
                            messages: [...group.messages, optimisticMessage]
                        };
                    } else {
                        groupKey = `${now}_${senderId}`;
                        updated[groupKey] = {
                            senderId,
                            senderName,
                            firstMessageTime: now,
                            messages: [optimisticMessage]
                        };
                    }
                } else {
                    // No previous group at all (first message)
                    groupKey = `${now}_${senderId}`;
                    updated[groupKey] = {
                        senderId,
                        senderName,
                        firstMessageTime: now,
                        messages: [optimisticMessage]
                    };
                }

                return updated;
            });
        };

        // Listen for the event
        on("receiveMessage", handleReceiveMessage);


        on("typing", (data) => {
            setTyping({ typing: true, userName: data.userName });
        })

        on("stopTyping", () => {
            setTyping({});
        })

        on("onlineUsers", (users) => {
            setOnlineUsers(users); // <-- or however you're managing online state
        });

        on("userOnline", ({ userId }) => {
            setOnlineUsers((prev) => [...prev, userId]);
        });

        on("userOffline", ({ userId }) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== userId));
        });

        on("unreadCountUpdated", (data) => {
            setFollowings((prev) => {
                return prev.map((following) => {
                    if (following._id === data.senderId) {
                        return { ...following, unreadCount: data.unreadCount };
                    }
                    return following;
                });
            })
        })

        on("attachment", (data) => {
            console.log(data);
            setAttachmentsDownloaded((prev) => [...prev, data]);
        })

        return () => {
            off("receiveMessage", handleReceiveMessage);
            off("typing");
            off("stopTyping");
            off("onlineUsers");
            off("userOnline");
            off("userOffline");
        };
    }, [on]);


    const handleChatOpen = async (chatUser) => {
        try {
            setIsChatOpen(true);
            setChatUser(chatUser);

            if (chat?._id) {
                emit("leaveRoom", chat._id);
            }

            const { data: chatData } = await createOrGetOneOnOneChat(chatUser.userName);
            emit("joinRoom", chatData._id);
            setChat(chatData);

            const dict = groupMessagesDict(chatData.messages);
            setGroupedMessages(dict);

        } catch (err) {
            console.error("Error opening chat:", err);
        }
    };

    const handleCallButton = () => {
        initiateCall(chatUser._id, user._id);

        navigate(`/chat/call/${chat._id}`, { state: { user: chatUser, from: user._id } });
    }

    const handleSendMessage = async () => {
        const trimmed = inputMessage.trim();
        if (!trimmed) return;

        const tempId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const optimisticMessage = {
            _id: tempId,
            content: trimmed,
            sender: {
                _id: user._id,
                fullName: user.fullName,
                profilePic: user.profilePic,
            },
            createdAt: now,
            chat: chat._id,
            attachments: attachments.url,
            type: attachments.type || 'TEXT'
        };

        setGroupedMessages(prev => {
            const updated = { ...prev };

            // Find latest group (regardless of sender)
            const latestEntry = Object.entries(updated)
                .sort(([, a], [, b]) => new Date(b.firstMessageTime) - new Date(a.firstMessageTime))[0];

            const now = optimisticMessage.createdAt || new Date().toISOString();
            const senderId = user._id;
            const senderName = user.fullName;
            const isIncoming = senderId !== user._id;

            let groupKey;

            if (latestEntry) {
                const [key, group] = latestEntry;
                const lastSenderId = group.senderId;
                const lastIsIncoming = lastSenderId !== user._id;

                const lastMsg = group.messages[group.messages.length - 1];
                const lastMsgTime = lastMsg?.createdAt || group.firstMessageTime;
                const gap = differenceInMinutes(new Date(now), new Date(lastMsgTime));

                const shouldStartNew =
                    isIncoming !== lastIsIncoming || // direction change
                    senderId !== lastSenderId ||     // different sender
                    gap > 10;                        // too much time gap

                if (!shouldStartNew) {
                    groupKey = key;
                    updated[groupKey] = {
                        ...group,
                        messages: [...group.messages, optimisticMessage]
                    };
                } else {
                    groupKey = `${now}_${senderId}`;
                    updated[groupKey] = {
                        senderId,
                        senderName,
                        firstMessageTime: now,
                        messages: [optimisticMessage]
                    };
                }
            } else {
                // No previous group at all
                groupKey = `${now}_${senderId}`;
                updated[groupKey] = {
                    senderId,
                    senderName,
                    firstMessageTime: now,
                    messages: [optimisticMessage]
                };
            }

            return updated;
        });


        emit("receiveMessage", {
            to: chat.otherParticipant._id,
            message: optimisticMessage
        });

        setInputMessage(""); // Clear input early
        setAttachments({type: null, file: null, url: null});

        try {
            const formData = new FormData();
            formData.append("message", trimmed);
            formData.append("chatId", chat._id);
            formData.append("messageFile", attachments.file);
            formData.append("messageType", attachments.type || 'TEXT');
            formData.append("tempId", tempId);
            await sendMessage(formData);

        } catch (err) {
            console.error("Failed to send message:", err);

            // Rollback optimistic message by finding and removing it
            setGroupedMessages(prev => {
                const updated = { ...prev };

                for (const key in updated) {
                    const group = updated[key];
                    const index = group.messages.findIndex(msg => msg._id === tempId);
                    if (index !== -1) {
                        // Remove the message
                        const newMessages = [...group.messages.slice(0, index), ...group.messages.slice(index + 1)];

                        if (newMessages.length > 0) {
                            updated[key].messages = newMessages;
                        } else {
                            delete updated[key]; // Remove entire group if empty
                        }
                        break; // Exit once we've handled the rollback
                    }
                }

                return updated;
            });
        }
    };



    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setAttachments({
            type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'TEXT',
            file,
            url: URL.createObjectURL(file)
        })
    };


    function groupMessagesDict(messages, currentUserId) {
        messages = messages
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const groups = {};
        let lastGroupKey = null;

        for (const msg of messages) {
            const senderId = msg.sender._id || msg.sender;
            const senderName = msg.sender.fullName || msg.senderName || "Unknown";
            const timestamp = msg.createdAt;
            const isIncoming = senderId !== currentUserId;

            if (!lastGroupKey) {
                // First message starts a new group
                lastGroupKey = `${timestamp}_${senderId}`;
                groups[lastGroupKey] = {
                    senderId,
                    senderName,
                    firstMessageTime: timestamp,
                    messages: [msg]
                };
                continue;
            }

            const lastGroup = groups[lastGroupKey];
            const lastSenderId = lastGroup.senderId;
            const lastMessageTime = lastGroup.messages[lastGroup.messages.length - 1].createdAt;
            const lastIsIncoming = lastSenderId !== currentUserId;

            const gap = differenceInMinutes(new Date(timestamp), new Date(lastMessageTime));

            const shouldStartNew =
                isIncoming !== lastIsIncoming || // direction change
                senderId !== lastSenderId ||     // different sender
                gap > 10;                        // too much time gap

            if (shouldStartNew) {
                lastGroupKey = `${timestamp}_${senderId}`;
                groups[lastGroupKey] = {
                    senderId,
                    senderName,
                    firstMessageTime: timestamp,
                    messages: [msg]
                };
            } else {
                groups[lastGroupKey].messages.push(msg);
            }
        }

        return groups;
    }


    const formatLastSeen = (timestamp) => {
        const lastSeenDate = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = differenceInMinutes(now, lastSeenDate);

        if (diffInMinutes < 1) {
            return "Last seen just now";
        } else if (diffInMinutes < 60) {
            return `Last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
        } else if (isToday(lastSeenDate)) {
            return `Last seen today at ${format(lastSeenDate, "h:mm a")}`;
        } else if (isYesterday(lastSeenDate)) {
            return `Last seen yesterday at ${format(lastSeenDate, "h:mm a")}`;
        } else if (isThisYear(lastSeenDate)) {
            return `Last seen on ${format(lastSeenDate, "MMM d")} at ${format(lastSeenDate, "h:mm a")}`;
        } else {
            return `Last seen on ${format(lastSeenDate, "MMM d, yyyy")} at ${format(lastSeenDate, "h:mm a")}`;
        }
    };

    const getDateOnly = (timestamp) => new Date(timestamp).toDateString();

    const getReadableDate = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        if (isThisYear(date)) return format(date, "d MMM");
        return format(date, "d MMM yyyy");
    };

    const shouldStartNewGroup = (lastMessageTime, newMessageTime, senderId, currentSenderId) => {
        const gap = differenceInMinutes(new Date(newMessageTime), new Date(lastMessageTime));

        // Allow grouping within a 10-minute window if it's the same sender
        return senderId !== currentSenderId || gap > 60;
    };


    return (
        <section className={style.lobby}>
            <MainContainer>

                {((windowWidth > 768) || (!chat && windowWidth <= 768)) && (
                    <Sidebar position="right">
                        <Search
                            placeholder="Search..."
                            onChange={setSearchQuery}
                            onClearClick={() => setSearchQuery('')}
                        />


                        <ConversationList>
                            {followings
                                ?.filter(following =>
                                    following.userName.toLowerCase().includes(searchQuery.trim().toLowerCase())
                                )
                                .map((following) => (
                                    <Conversation
                                        key={following._id}
                                        info={
                                            typing.typing && typing.userName === following.userName
                                            ? "is typing"
                                            : following?.lastMessage?.content
                                        }
                                        lastSenderName={
                                            typing.typing && typing.userName === following.userName
                                            ? typing.userName
                                            : following?.lastMessage?.sender === user._id
                                            ? "You"
                                            : following?.lastMessage?.sender || "Let's chat"
                                        }
                                        name={following.fullName}
                                        unreadCnt={following.unreadCount}
                                        onClick={() => handleChatOpen(following)}
                                    >
                                        <Avatar
                                            name={following.fullName}
                                            src={following.profilePic}
                                            status={onlineUsers.includes(following._id) ? "available" : "invisible"}
                                        />
                                    </Conversation>
                                ))
                            }

                        </ConversationList>
                    </Sidebar>
                )}

                { chat ? (
                    <ChatContainer>
                        <ConversationHeader>
                            {windowWidth < 768 && <ConversationHeader.Back onClick={() => setChat(null)} />}
                            <Avatar
                                name={chatUser?.fullName}
                                src={chatUser?.profilePic}
                                status={onlineUsers.includes(chatUser?._id) ? "available" : "invisible"}
                            />
                            <ConversationHeader.Content
                                info={
                                    typing.typing
                                        ? "is typing"
                                        : onlineUsers.includes(chatUser?._id)
                                        ? "Online"
                                        : chat?.otherParticipant?.lastSeen
                                        ? formatLastSeen(chat.otherParticipant.lastSeen)
                                        : ""
                                }
                                userName={chatUser?.userName}
                            />
                            <ConversationHeader.Actions>
                                <VoiceCallButton onClick={handleCallButton} disabled={!isPermissionsGranted} />
                            </ConversationHeader.Actions>
                        </ConversationHeader>

                        <MessageList typingIndicator={typing.typing && <TypingIndicator content={`${typing.userName} is typing`} />}>
                            {Object.entries(groupedMessages)
                                .sort(([ , a ], [ , b ]) =>
                                    new Date(a.firstMessageTime) - new Date(b.firstMessageTime)
                                )
                                .map(([key, group], idx, arr) => {
                                    const currentGroupDate = getDateOnly(group.firstMessageTime);
                                    const prevGroup = arr[idx - 1]?.[1];
                                    const prevGroupDate = prevGroup ? getDateOnly(prevGroup.firstMessageTime) : null;

                                    const showSeparator = currentGroupDate !== prevGroupDate;
                                    const readableDate = getReadableDate(group.firstMessageTime);

                                    return (
                                        <React.Fragment key={key}>
                                            {showSeparator && (
                                                <MessageSeparator content={readableDate} />
                                            )}
                                            <MessageGroup
                                                direction={group.senderId === user._id ? "outgoing" : "incoming"}
                                                sender={group.senderName}
                                                sentTime={formatDistanceToNow(
                                                    new Date(group.firstMessageTime),
                                                    { addSuffix: true }
                                                )}
                                            >
                                                <Avatar
                                                    size="sm"
                                                    src={
                                                        group.senderId === user._id
                                                            ? user.profilePic
                                                            : chatUser.profilePic
                                                    }
                                                    name={group.senderName}
                                                />
                                                <MessageGroup.Header>
                                                    {formatDistanceToNow(
                                                        new Date(group.firstMessageTime),
                                                        { addSuffix: true }
                                                    )}
                                                </MessageGroup.Header>
                                                <MessageGroup.Messages>
                                                    {group.messages.map((msg) => {
                                                        const isOutgoing = group.senderId === user._id;

                                                        let attachmentUrl = msg.attachments

                                                        attachmentsDownloaded.map((attachment) => {
                                                            if (attachment?.id === msg._id) {
                                                                attachmentUrl = attachment.url;
                                                                return
                                                            }
                                                        })

                                                        if (msg.attachments) {
                                                            return (
                                                                <Message
                                                                    key={msg._id}
                                                                    type="custom"
                                                                    model={{
                                                                        direction: isOutgoing ? "outgoing" : "incoming",
                                                                        payload: <Message.CustomContent>
                                                                            {msg.type === 'IMAGE' ? (
                                                                                <img
                                                                                    src={attachmentUrl}
                                                                                    alt="attachment"
                                                                                    className={style.message_image}
                                                                                    onError={() => {
                                                                                        setIsAttachmentsDownloading(true);
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <video src={attachmentUrl} controls />
                                                                            )}
                                                                            <p>{msg.content}</p>
                                                                        </Message.CustomContent>
                                                                    }}
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <Message
                                                                key={msg._id}
                                                                model={{
                                                                    message: msg.content,
                                                                    sentTime: new Date(msg.createdAt).toLocaleTimeString(),
                                                                    sender: group.senderName,
                                                                    direction: isOutgoing ? "outgoing" : "incoming"
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </MessageGroup.Messages>
                                            </MessageGroup>
                                        </React.Fragment>
                                    );
                                })}

                                {attachments.url &&
                                    <div className={style.attachments}>
                                        {attachments.type === "IMAGE" ?
                                            <img src={attachments.url} alt="attachment" className={style.attachment_img} />
                                            :
                                            <video src={attachments.url} controls autoPlay loop className={style.attachment_video} />
                                        }
                                    </div>
                                }

                        </MessageList>

                        <MessageInput
                            placeholder="Type message here"
                            value={inputMessage}
                            onChange={setInputMessage}
                            onSend={handleSendMessage}
                            onAttachClick={handleAttachClick}
                        />

                    </ChatContainer>
                ) : windowWidth >= 864 && (
                    <div className={style.no_chat}>
                        <img style={{ width: "80%" }} src={chatsvg} alt="Chat" />
                    </div>
                )}
            </MainContainer>

            <input
                type="file"
                ref={fileInputRef}
                // style={{ display: "none" }}
                accept="image/*, video/*"
                onChange={handleFileChange}
            />
        </section>
    );
};
