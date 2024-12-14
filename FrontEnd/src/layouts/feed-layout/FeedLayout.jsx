import { Story } from '../../features/story/Story'
import { Posts } from '../../components/post/Post'
import { Suggest_mobile } from '../../features/suggestPeople/mobile/Suggest_mobile'
import { useState } from 'react'

import style from "./feedlayout.module.scss"

export const FeedLayout = () => {

    const [showSuggest, setShowSuggest] = useState(true);

    return (
        <div className={style.comp_wrapper}>
            <Story />

            {
                showSuggest && <Suggest_mobile setShowSuggest={setShowSuggest} />
            }

            <Posts />
        </div>
    )
}