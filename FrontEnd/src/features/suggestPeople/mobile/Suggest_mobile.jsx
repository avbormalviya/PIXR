import style from "./suggest_mobile.module.scss"
import { FollowUserCard } from "../../../components/userCard/UserCard"

import { useSelector } from "react-redux"
import { fetchAndSetSuggestedUsers } from "../../../utils/getSuggestedUsers"

import { useEffect } from "react"

export const Suggest_mobile = ({ setShowSuggest }) => {

    const { user, suggestedUsers } = useSelector(state => state.user);

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
                            user.userName !== suggestedUser.userName ? 
                                <FollowUserCard key={ index } styles={style.usercard} fullName={ suggestedUser.fullName } userName={ suggestedUser.userName } profilePic={ suggestedUser.profilePic } isFollower={ suggestedUser.isFollower } isRing={ suggestedUser.hasStories } />
                            :
                                <NormalUserCard key={ index } styles={style.usercard} fullName={ suggestedUser.fullName } userName={ suggestedUser.userName } profilePic={ suggestedUser.profilePic }isRing={ suggestedUser.hasStories } isNavigate={true} />
                            
                        ))
                    }
                </div>
            </section>
        </>
    )
}