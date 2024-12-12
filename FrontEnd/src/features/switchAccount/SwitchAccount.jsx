import style from "./switchAccount.module.scss"

import { SwitchUserCard } from "../../components/userCard/UserCard"

export const SwitchAccount = () => {
    return (
        <section className={style.switch_account_section}>
            <h1 className={style.switch_account_heading}>Switch Account</h1>
            <SwitchUserCard name="Aalok" userName="Aalok_05" profilePic="https://i.pinimg.com/736x/be/be/8a/bebe8a2c2b34be363106ef3c6007c10f.jpg" follow={ false } />
        </section>
    )
}