import { useEffect, useMemo, useState } from 'react';
import style from './notification.module.scss'
import { Img } from '../img/Img';
import { getNotifications, markNotificationAsRead } from '../../utils/getNotifications';
import { useInfiniteScroll } from '../infiniteScroll/InfiniteScroll';
import { MiniLoader } from '../miniLoader/MiniLoader';
import { useDispatch } from 'react-redux';
import { setNotification } from '../../features/user/useSlice';
import { useSocket } from '../../context/SocketContext';

import { formatDistanceToNowStrict } from 'date-fns';
import { FollowButton } from '../button/Button';
import { Button } from '@mui/material';

export const Notification = () => {

    const dispatch = useDispatch();

    const { on } = useSocket();

    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
    const [lastNotificationId, setLastNotificationId] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchMoreNotifications = async () => {
        try {
            const result = await getNotifications(lastNotificationId, 10);
            const data = result.data;

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setNotifications(prev => [...prev, ...data]);
                setLastNotificationId(data[data.length - 1]._id);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const { lastElementRef, isFetching } = useInfiniteScroll(fetchMoreNotifications, hasMore);

    useEffect(() => {
        setNotifications([]);
        setLastNotificationId(null);
        setHasMore(true);
        dispatch(setNotification(false));
        localStorage.setItem('notification', 'false');
        
        return async () => await markNotificationAsRead();
    }, []);

    useEffect(() => {
        on("notification", (data) => {
            setUnreadNotifications(prev => [...prev, data]);
        });
    }, [on]);


    const categorizeNotifications = (notifications_array) => {
        const now = new Date();
        
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);

        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(todayStart.getDate() - 7);

        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(todayStart.getDate() - 30);

        const categories = {
            today: [],
            yesterday: [],
            last_7_Days: [],
            last_30_Days: [],
            older: []
        };

        const unreadNotificationsTemp = [];

        notifications_array.forEach(notification => {
            const createdAt = new Date(notification.createdAt);

            if (!notification.asRead) {
                unreadNotificationsTemp.push(notification);
            } else if (createdAt >= todayStart) {
                categories.today.push(notification);
            } else if (createdAt >= yesterdayStart && createdAt < todayStart) {
                categories.yesterday.push(notification);
            } else if (createdAt >= sevenDaysAgo && createdAt < yesterdayStart) {
                categories.last_7_Days.push(notification);
            } else if (createdAt >= thirtyDaysAgo && createdAt < sevenDaysAgo) {
                categories.last_30_Days.push(notification);
            } else {
                categories.older.push(notification);
            }
        });

        return { categories, unreadNotificationsTemp };
    };


    const { categories, unreadNotificationsTemp } = useMemo(() => {
        return categorizeNotifications(notifications);
    }, [notifications]);

    useEffect(() => {
        setUnreadNotifications(unreadNotificationsTemp);
    }, [unreadNotificationsTemp]);


    function isImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }


    return (
        <section className={style.notification_section}>
            <div className={style.notification_container}>
                <div className={style.left_notification}>
                    <h1 className={style.notification_heading}>Recent</h1>

                    <div className={style.notification_wrapper}>
                        {
                            unreadNotifications.map((notification, index) => (
                                <div key={index} className={style.notification_card}>
                                    <Img url={ notification.sender.profilePic } style={{ borderRadius: "50%" }} />
                                    <div className={style.notification_content}>
                                        <h1>
                                            <span>{ notification.sender.userName }</span>
                                            <p>, { notification.message }</p>
                                        </h1>
                                        <h2>
                                            <p>{ formatDistanceToNowStrict(notification.createdAt, { addSuffix: true }) }</p>
                                        </h2>
                                    </div>
                                    <Img url={ notification.thumbnail } style={{ borderRadius: "10px" }} />
                                    {/* <FollowButton userName={ notification.sender.userName } /> */}
                                </div>
                            ))
                        }

                        {
                            unreadNotifications.length === 0 && (
                                <h1 style={{ textAlign: 'center', marginTop: "20px" }} className={style.notification_heading}>No new notifications</h1>
                            )
                        }

                        <div ref={lastElementRef} style={{ height: '20px' }} />

                        {isFetching && <MiniLoader />}
                    </div>
                </div>

                <div className={style.right_notification}>
                    <div className={style.notification_wrapper} style={{ borderRadius: '0' }}>
                        {
                            Object.entries(categories).map(([category, notifications]) => (
                                notifications.length > 0 && (
                                    <>
                                        <h1 className={style.notification_heading}>{ category.replaceAll('_', ' ') }</h1>
    
                                        {
                                            notifications.map((notification, index) => (
                                                <div key={index} className={style.notification_card}>
                                                    <Img url={ notification.sender.profilePic } style={{ borderRadius: "50%" }} />
                                                    <div className={style.notification_content}>
                                                        <h1>
                                                            <span>{ notification.sender.userName }</span>
                                                            <p>, { notification.message }</p>
                                                        </h1>
                                                        <h2>
                                                            <p>{ formatDistanceToNowStrict(notification.createdAt, { addSuffix: true }) }</p>
                                                        </h2>
                                                    </div>

                                                    {
                                                        isImageUrl(notification.thumbnail) ? (
                                                            <Img  url={ notification.thumbnail } style={{ borderRadius: "10px" }} />
                                                        ) : (
                                                            notification.thumbnail !== "empty" &&  
                                                                <Button variant="contained" style={{ fontSize: '0.9em' }} onClick={() => window.open(notification.thumbnail, '_blank')}>{ notification.thumbnail }</Button>
                                                        )
                                                    }
                                                </div>
                                            ))
                                        }
                                    </>
                                )
                            ))
                        }
                    </div>
                </div>
            </div>
        </section>
    )
}