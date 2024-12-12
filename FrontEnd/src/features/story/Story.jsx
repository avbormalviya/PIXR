import { UserPPic } from '../../components/userPPic/UserPPic'
import style from './story.module.scss'

import { useEffect, useState } from 'react'
import { getStoryOnlyFollowers } from '../../utils/getMemoirOnlyFollowers'

import { useSelector } from 'react-redux'

import { useNavigate } from 'react-router-dom'

export const Story = () => {

    const navigate = useNavigate();

    const { user } = useSelector((state) => state.user);

    const [memoirs, setMemoirs] = useState([]);

    useEffect(() => {
        (async () => {
            const { data } = await getStoryOnlyFollowers();
            setMemoirs(data);
        })()
    }, [])

    return (
        <section className={style.story_wrapper}>

            <figure>
                <UserPPic userName={user.userName} heightBase={false} profilePic={user.profilePic} isRing={ user?.stories?.length > 0 } />
                <figcaption>Your Memoir</figcaption>
                <i onClick={() => navigate("/create/story")} className="material-symbols-rounded">add</i>
            </figure>

            {
                memoirs?.map((memoir, index) => (
                    <figure key={index}>
                        <UserPPic userName={memoir.userInfo.userName} heightBase={false} profilePic={memoir.userInfo.profilePic} />
                        <figcaption>{memoir.userInfo.userName}</figcaption>
                    </figure>
                ))
            }

        </section>
    )
}