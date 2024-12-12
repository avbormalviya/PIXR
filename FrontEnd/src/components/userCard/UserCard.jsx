import { useState } from "react";
import { CallButton, FollowButton, SwitchButton } from "../button/Button";
import { UserPPic } from "../userPPic/UserPPic";
import style from "./userCard.module.scss";
import { useNavigate } from "react-router-dom";
import { DrawerButton } from "../drawer/Drawer";

const UserCard = ({
    userName,
    fullName,
    profilePic,

    followButton = false,
    isFollower,
    switchButton = false,
    callButton = false,
    drawerButton = false,
    drawerInfo,

    isNavigate = false,
    
    event,

    heightBase = true,
    isRing = true,
    
    styles
}) => {
    const navigate = useNavigate();

    const [isFollowing, setIsFollowing] = useState(isFollower);

    const handleNavigate = () => {
        if (event) {
            event();
        }
        else {
            isNavigate && navigate(`/user/${userName}`);
        }
    };

    return (
        <figure className={`${style.userCard} ${styles}`}>
            <UserPPic 
                userName={userName}
                profilePic={profilePic}
                isRing={isRing}
                heightBase={heightBase}
            />

            <figcaption>
                <h1 onClick={handleNavigate}>{userName}</h1>
                <h1>{fullName}</h1>
            </figcaption>

            {followButton && ( <FollowButton userName={userName} isFollower={isFollowing} setIsFollower={setIsFollowing} /> )}
            {switchButton && ( <SwitchButton event={handleNavigate} /> )}
            {callButton && ( <CallButton event={handleNavigate} /> )}
            {drawerButton && ( <DrawerButton drawerInfo={drawerInfo} /> )}
        </figure>
    );
};

export const FollowUserCard = (props) => <UserCard {...props} followButton={true} isNavigate={true} />;
export const SwitchUserCard = (props) => <UserCard {...props} switchButton={true} isNavigate={true} />;
export const DrawerUserCard = (props) => <UserCard {...props} drawerButton={true} isNavigate={true} />;
export const NormalUserCard = (props) => <UserCard {...props} />;
