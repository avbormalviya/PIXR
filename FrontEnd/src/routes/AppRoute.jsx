import { Route, Routes, Navigate } from "react-router-dom";
import { Home } from "../pages/home/Home";
import { Search } from "../components/search/Search";
import { FeedLayout } from "../layouts/feed-layout/FeedLayout";
import { Reel } from "../components/reel/Reel";
import { Profile } from "../components/profile/Profile";
import { Login } from "../pages/login/Login";
import { SignUp } from "../pages/signup/Signup";
import { Otp } from "../pages/otp/Otp";
import { UserDetails } from "../pages/userDetails/UserDetails";
import { Auth } from "../layouts/Auth/Auth";
import { useDispatch, useSelector } from "react-redux";
import { Chat } from "../layouts/chat/Chat";
import { Memoir } from "../pages/memoir/Memoir";
import { Create } from "../features/create/Create";
import { Notification } from "../components/notifications/Notification";
import { VideoCall } from "../features/videoCall/VideoCall";
import { Settings } from "../features/settings/Settings";
import { useEffect, useState } from "react";
import { getUser } from "../utils/getUser";
import { InitialLoading } from "../pages/initialLoading/InitialLoading";
import { setUserData } from "../features/user/useSlice";
import { Music } from "../layouts/music/Music";
import { MusicHome } from "../features/music/MusicHome";
import { MusicDetails } from "../features/music/MusicDetails";

export const AppRoute = () => {
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.user);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        (async () => {
            const data = await getUser();
            if (data?.data) {
                dispatch(setUserData(data.data));
            }
            setLoading(false);
        })();
    }, []);


    if (loading) {
        return (
            <Routes>
                <Route path="*" element={<InitialLoading />} />
            </Routes>
        );
    }

    return (
        <Routes>
            {!loading && user ? (
                !user.fullName ? (
                    <>
                        <Route path="/auth" element={<Auth />}>
                            <Route path="signup/userDetails" element={<UserDetails />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/auth/signup/userDetails" replace />} />
                    </>
                ) : (
                    <>
                        <Route path="/" element={<Home />}>
                            <Route index element={<FeedLayout />} />
                            <Route path="memoir/:username" element={<Memoir />} />
                            <Route path="search" element={<Search />} />
                            <Route path="reels" element={<Reel />} />
                            <Route path="create/:content" element={<Create />} />
                            <Route path="user/:username" element={<Profile />} >
                                <Route path=":type" element={<Profile />} />
                            </Route>
                            <Route path="chat" element={<Chat />} />
                            <Route path="notifications" element={<Notification />} />
                            <Route path="settings" element={<Settings />} >
                                <Route path=":type" element={<Settings />} />
                            </Route>
                            <Route path="music" element={<Music />} >
                                <Route index element={<MusicHome />} />
                                <Route path=":type/:id" element={<MusicDetails />} />
                            </Route>
                        </Route>
                        <Route path="chat/call/:user" element={<VideoCall />} />
                    </>
                )
            ) : (
                <>
                    <Route path="/auth" element={<Auth />}>
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<SignUp />} />
                        <Route path="signup/verifyEmail" element={<Otp />} />
                        <Route path="signup/userDetails" element={<UserDetails />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                </>
            )}
            <Route path="*" element={<Navigate to={user ? user.fullName ? "/" : "/auth/signup/userDetails" : "/auth/login"} replace />} />

        </Routes>
    );
};
