import style from "./suggest_desktop.module.scss"

import { SwitchAccount } from "../../switchAccount/SwitchAccount"
import { FollowUserCard, NormalUserCard } from "../../../components/userCard/UserCard"

import { useSelector } from "react-redux"
import { fetchAndSetSuggestedUsers } from "../../../utils/getSuggestedUsers"

import Skeleton from '@mui/material/Skeleton';

import { useEffect, useState } from "react"

export const Suggest_desktop = () => {

    const { user,suggestedUsers } = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchAndSetSuggestedUsers();
            setLoading(false);
        })();
    })

    return (
        <>
            <SwitchAccount />

            <section className={style.suggest}>
                <h1>Suggested for you</h1>

                { loading &&
                    <div className={style.suggested_user_loading_skeleton}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "var(--background-ternary)" }} />
                        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: "var(--background-ternary)" }} />
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: "var(--background-ternary)" }} />
                    </div>
                }

                {
                    suggestedUsers?.map((suggestedUser, index) => (
                        <FollowUserCard key={ index } fullName={ suggestedUser.fullName } userName={ suggestedUser.userName } profilePic={ suggestedUser.profilePic } isFollower={ suggestedUser.isFollower } isRing={ suggestedUser.hasStories } />
                    ))
                }
            </section>
        </>
    )
}
