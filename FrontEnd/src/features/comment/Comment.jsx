import { FloatingCon } from "../../components/floatingContainer/FloatingCon"
import { motion } from "framer-motion"
import { Img } from "../../components/img/Img"
import style from "./comment.module.scss"
import { LikeButton } from "../../components/button/Button"
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { addComment } from "../../utils/addComment"
import { useEffect, useState } from "react"
import { getComments } from "../../utils/getComments"
import { formatDistanceToNowStrict } from 'date-fns';
import { useSelector } from "react-redux";

export const Comment = ({ feedId, setIsCommentsOpen, feedType, thumbnail }) => {

    const { user } = useSelector((state) => state.user);

    const [message, setMessage] = useState("");
    const [comments, setComments] = useState([]);

    useEffect(() => {
        ( async () => {
            const { data } = await getComments(feedId);

            setComments([ ...data ].reverse());
        })();
    }, [])

    const handleAddComment = async () => {
        const { data } = await addComment({
            message,
            commentTo: feedId,
            commentToType: feedType,
            thumbnail
        });

        setMessage("");

        setComments([ { ...data, commentBy: { userName: user.userName, profilePic: user.profilePic } }, ...comments ]);
    }

    return (
        <FloatingCon>
            <motion.section
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3 }}
                className={style.comment_section}
            >
                <div className={style.comment_header}>
                    <h1>Comments</h1>
                    <ClearRoundedIcon fontSize="large" onClick={ () => setIsCommentsOpen(false) } />
                </div>

                <div className={style.comments_wrapper}>
                    {
                        comments.map((comment, index) => (
                            <div key={ index } className={style.comment}>
                                <p>{ comment.message }</p>
                                <div className={style.comment_footer}>
                                    <Img url={ comment.commentBy.profilePic } />
                                    <span>{ comment.commentBy.userName }</span>
                                    
                                    {
                                        comment.createdAt && (
                                            <span>{ formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true }) }</span>
                                        )
                                    }
                                    {/* <div className={style.comment_like_wrapper}>
                                        <div className={style.comment_like_button}>
                                            <LikeButton className={style.like_button} isLiked={ false } event={ () => { } } />
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        ))
                    }
                    {
                        comments.length === 0 && (
                            <div className={style.no_comments}>
                                <p>No comments yet</p>
                            </div>
                        )
                    }
                </div>

                <div className={style.comment_input_wrapper}>
                    <input onChange={ (e) => setMessage(e.target.value) } value={ message } type="text" placeholder="Add a comment..." />
                    <SendRoundedIcon fontSize="large" className={style.send_icon} onClick={ handleAddComment } />
                </div>

            </motion.section>
        </FloatingCon>
    )
}