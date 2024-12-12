import { Story } from '../../features/story/Story'
import { Posts } from '../../components/post/Post'
import { Suggest_mobile } from '../../features/suggestPeople/mobile/Suggest_mobile'

import style from "./feedlayout.module.scss"

export const FeedLayout = () => {
    return (
        <div className={style.comp_wrapper}>
            <Story />
            <Suggest_mobile />
            <Posts />
        </div>
    )
}