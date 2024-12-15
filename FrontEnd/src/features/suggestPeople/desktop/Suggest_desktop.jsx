import style from "./suggest_desktop.module.scss"

import { SwitchAccount } from "../../switchAccount/SwitchAccount"
import { FollowUserCard } from "../../../components/userCard/UserCard"

import { useSelector } from "react-redux"
import { fetchAndSetSuggestedUsers } from "../../../utils/getSuggestedUsers"

import { useEffect } from "react"

export const Suggest_desktop = () => {

    const { user,suggestedUsers } = useSelector(state => state.user);

    useEffect(() => {
        fetchAndSetSuggestedUsers();
    })

    return (
        <>
            <SwitchAccount />

            <section className={style.suggest}>
                <h1>Suggested for you</h1>

                {
                    suggestedUsers?.map((suggestedUser, index) => (
                            user.userName === suggestedUser.userName && 
                                <FollowUserCard key={ index } fullName={ suggestedUser.fullName } userName={ suggestedUser.userName } profilePic={ suggestedUser.profilePic } isFollower={ suggestedUser.isFollower } isRing={ suggestedUser.hasStories } />
                            
                    ))
                }
            </section>
        </>
    )
}