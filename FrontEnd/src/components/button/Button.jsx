import { followUser } from "../../utils/follow";
import { motion } from "framer-motion";
import style from "./button.module.scss"

import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CommentIcon from '@mui/icons-material/Comment';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

const Button = ({ children, text, event, ...props }) => {
    return (
        <button
            className={style.__button}
            onClick={ event }
            {...props}
        >
            { children || text }
        </button>
    )
}

const IconButton = ({ isActive, ActiveIcon, InactiveIcon, event }) => {
    const Icon = isActive ? ActiveIcon : InactiveIcon;
    const MotionIcon = motion(Icon);
    return <MotionIcon
            fontSize="large"
            onClick={event}
            // whileHover={{ scale: 1.2 }}
            // whileTap={{
            //     scale: 0.8,
            //     transition: { duration: 0.2 }
            // }}
            // animate={{ scale: 1, color: isActive ? "rgb(237 20 61)" : "var(--text-primary-70)" }}
            // transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ justifySelf: 'end', outline: 'none', color: isActive ? "rgb(237 20 61)" : "whitesmoke" }}
        />
}

const Icon = ({ children, icon, ...props }) => {
    const IconComponent = icon;
    return <IconComponent fontSize="large" {...props}>{children}</IconComponent>
}

const FollowButton = ({ isFollower, setIsFollower, userName }) => {

    const handleFollow = async () => {
        setIsFollower(!isFollower);
        await followUser(userName);
    }

    return (
        <Button
            text={ isFollower ? "UnFollow" : "Follow" }
            event={ handleFollow }
            style={{ backgroundColor: isFollower ? "#4a4a4a70" : "var(--primary-color)" }}
        />
    )
}

const SwitchButton = ({ event }) => {
    return (
        <Button
            text="Switch"
            event={ event }
        />
    )
}

const CallButton = ({ event }) => {
    return (
        <Button event={ event }>
            <i className="material-symbols-rounded">call</i>
        </Button>
    )
}

const LikeButton = ({ isLiked, event }) => {
    return (
        <IconButton
            isActive={isLiked}
            ActiveIcon={FavoriteRoundedIcon}
            InactiveIcon={FavoriteBorderRoundedIcon}
            event={event}
        />
    );
}

const BookmarkButton = ({ isBookmarked, event, ...props }) => {
    return (
        <IconButton
            isActive={isBookmarked}
            ActiveIcon={BookmarkRoundedIcon}
            InactiveIcon={BookmarkBorderRoundedIcon}
            event={event}
            {...props}
        />
    );
}

const ShareButton = ({ event }) => {
    return <SendRoundedIcon fontSize="large" onClick={event} />;
}

const CommentButton = ({ event }) => {
    return (
        <Icon icon={CommentIcon} onClick={event} />
    );
}

export {
    Icon,
    FollowButton,
    SwitchButton,
    CallButton,
    LikeButton,
    BookmarkButton,
    ShareButton,
    CommentButton
}