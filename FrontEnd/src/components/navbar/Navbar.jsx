import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import style from './navbar.module.scss';
import { NavLink } from 'react-router-dom';
import { useSocket } from "../../context/SocketContext"

import { useSelector, useDispatch } from "react-redux";
import { setNotification } from "../../features/user/useSlice";
import { Img } from '../img/Img';

import { Icon } from '../button/Button';

import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChatIcon from '@mui/icons-material/Chat';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import SmartDisplayRoundedIcon from '@mui/icons-material/SmartDisplayRounded';
import { Badge } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const Navbar = () => {

    const { user, notification } = useSelector((state) => state.user);

    const dispatch = useDispatch();

    const { on } = useSocket();

    const [activeIndex, setActiveIndex] = useState(0);
    const [isVertical, setIsVertical] = useState(false);

    const menuRefs = useRef([]);

    

    useEffect(() => {
        const handleResize = () => setIsVertical(window.innerWidth < 768);

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        dispatch(setNotification(localStorage.getItem("notification") === "true"));
    }, []);


    useEffect(() => {
        if (isVertical) setActiveIndex(0);
    }, [isVertical]);

    useEffect(() => {
        const currentPath = location.pathname;
        
        let newIndex;
        
        if (isVertical) {
            newIndex = menuItems.horizontal.findIndex(item => item.to === currentPath);
        }
        else {
            newIndex = menuItems.vertical.findIndex(item => item.to === currentPath);
        }

        if (newIndex !== -1) {
            setActiveIndex(newIndex);
        } 
        else {
            currentPath.includes("/create") ? setActiveIndex(5) : currentPath.includes("/settings") ? setActiveIndex(6) : setActiveIndex(1);
        }
    }, [location.pathname, isVertical, user]);

    useEffect(() => {
        on("notification", () => {
            dispatch(setNotification(true));
            localStorage.setItem("notification", true);
        });
    }, [on]);

    const menuItems = {
        horizontal: [
            { to:"/", icon: HomeRoundedIcon, label: 'Home' },
            { to:"/search", icon: SearchRoundedIcon, label: 'Search'},
            { to:"/create/post", icon: AddCircleRoundedIcon, label: 'Create' },
            { to:"/reels", icon: SmartDisplayRoundedIcon, label: 'Reels' },
            { to:`/user/${user?.userName}`, icon: user?.profilePic, label: 'Profile', class: 'Profile_Pic' }
        ],
        vertical: [
            { to: "/", icon: HomeRoundedIcon, label: 'Home' },
            { to: "/search", icon: SearchRoundedIcon, label: 'Search'},
            { to: "/reels", icon: SmartDisplayRoundedIcon, label: 'Reels' },
            { to: "/chat", icon: ChatIcon, label: 'Message' },
            { to: "/notifications", icon: FavoriteRoundedIcon, label: 'Notification'},
            { to: "/create/post", icon: AddCircleRoundedIcon, label: 'Create' },
            { to: `/user/${user?.userName}`, icon: user?.profilePic, label: 'Profile', class: 'Profile_Pic' }
        ]
    };
    
    const currentMenuItems = isVertical ? menuItems.horizontal : menuItems.vertical;

    return (
        <aside>
            <h1 className={style.logo_section}>PIXR</h1>
            <ul>
                {currentMenuItems.map((item, index) => (
                    <motion.li
                        key={index}
                        ref={(el) => menuRefs.current[index] = el}
                        animate={
                            isVertical && index === activeIndex
                                ? { y: -10 }
                                : { y: 0 }
                        }
                    >
                        <NavLink
                            to={item.to}
                            onClick={() => setActiveIndex(index)}
                            className={`${style.nav_link} ${index === activeIndex ? style.active : ''} ${item.class ? style[item.class] : ''}`}
                        >
                            {
                                item?.class?
                                    <Img url={item.icon} alt={item.label} />
                                :
                                item?.label === 'Notification' ?
                                    <Badge invisible={ !notification } color="info" variant="dot" style={{ zIndex: 10 }}>
                                        <FavoriteIcon fontSize="large" />
                                    </Badge>
                                    :
                                    <Icon icon={item.icon} style={{ position: 'relative', zIndex: 10 }} />
                            }
                            <h1>{item.label}</h1>
                        </NavLink>
                    </motion.li>
                ))}

                <motion.span
                    className={style.indicter}
                    layoutId="indicator"
                    initial={false}
                    animate={{
                        left: !isVertical ? 'unset' : `${menuRefs.current[activeIndex]?.offsetLeft}px`,
                        top: !isVertical ? `${activeIndex * 60}px` : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </ul>
        </aside>
    );
};
