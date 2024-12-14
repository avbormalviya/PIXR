import style from "./suggest_mobile.module.scss"
import { FollowUserCard } from "../../../components/userCard/UserCard"

import { useSelector } from "react-redux"
import { fetchAndSetSuggestedUsers } from "../../../utils/getSuggestedUsers"

import { useEffect } from "react"

export const Suggest_mobile = ({ setShowSuggest }) => {

    const { suggestedUsers } = useSelector(state => state.user);

    useEffect(() => {
        fetchAndSetSuggestedUsers();
    })

    return (
        <>
            <section className={style.suggest}>
                <h1 className={style.suggest_heading}>
                    <span>Suggested for you</span>
                    <i className="material-symbols-rounded" onClick={() => setShowSuggest(false)}>close</i>
                </h1>

                <div className={style.card_wrapper}>
                    {
                        suggestedUsers?.map((user, index) => (
                            <FollowUserCard key={ index } styles={style.usercard} fullName={ user.fullName } userName={ user.userName } profilePic={ user.profilePic } isFollower={ user.isFollower } isRing={ user.hasStories } />
                        ))
                    }
                </div>
            </section>
        </>
    )
}