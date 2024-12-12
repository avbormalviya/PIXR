import style from "./suggest_desktop.module.scss"

import { SwitchAccount } from "../../switchAccount/SwitchAccount"
import { FollowUserCard } from "../../../components/userCard/UserCard"

import { useSelector } from "react-redux"
import { fetchAndSetSuggestedUsers } from "../../../utils/getSuggestedUsers"

import { useEffect } from "react"

export const Suggest_desktop = () => {

    const { suggestedUsers } = useSelector(state => state.user);

    useEffect(() => {
        fetchAndSetSuggestedUsers();
    })

    return (
        <>
            <SwitchAccount />

            <section className={style.suggest}>
                <h1>Suggested for you</h1>

                {
                    suggestedUsers?.map((user, index) => (
                        <FollowUserCard key={ index } fullName={ user.fullName } userName={ user.userName } profilePic={ user.profilePic } isFollower={ user.isFollower } isRing={ user.hasStories } />
                    ))
                }
            </section>
        </>
    )
}