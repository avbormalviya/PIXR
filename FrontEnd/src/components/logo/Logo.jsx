import { useNavigate } from "react-router-dom"
import style from "./logo.module.scss"

export const Logo = ({ styles }) => {

    const navigate = useNavigate();

    return (
        <h1
            onClick={() => navigate(-1)}
            className={`${style.logo} ${styles}`}
        >
            PIXR
        </h1>
    )
}