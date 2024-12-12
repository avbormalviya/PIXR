import { Route, Routes, Navigate } from "react-router-dom";
import { Home } from "../pages/home/Home";
import { Search } from "../components/search/search";
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
import { useGetUser } from "../utils/getUser";
import { InitialLoading } from "../pages/initialLoading/InitialLoading";
import { setUserData } from "../features/user/useSlice";

export const AppRoute = () => {
    
    const dispatch = useDispatch();
    const { fetchUser, data, loading } = useGetUser();

    const [path, setPath] = useState(window.location.pathname);


    useEffect(() => {
        fetchUser();
    }, [])

    useEffect(() => {
        if (data) {
            dispatch(setUserData(data.data));
        }
    }, [data])

    const { user } = useSelector((state) => state.user);

    if (loading) {
        return (
            <Routes>
                <Route path="*" element={<InitialLoading />} />
            </Routes>
        );
    }

    return (
        <Routes>
            {user ? (
                <>
                    <Route path="/" element={<Home />}>
                        <Route index element={<FeedLayout />} />
                        <Route path="/memoir/:username" element={<Memoir />} />
                        <Route path="search" element={<Search />} />
                        <Route path="reels" element={<Reel />} />
                        <Route path="create/:content" element={<Create />} />
                        <Route path="user/:username" element={<Profile />}>
                            <Route path=":type" element={<Profile />} />
                        </Route>
                        <Route path="chat" element={<Chat />} />
                        <Route path="notifications" element={<Notification />} />
                        <Route path="settings" element={<Settings />}>
                            <Route path=":type" element={<Settings />} />
                        </Route>
                    </Route>

                    <Route path="chat/call/:user" element={<VideoCall />} />
                </>
            ) : (
                <Route path="*" element={<Navigate to="/auth/login" />} />
            )}

            <Route path="/auth" element={<Auth />} >
                <Route path="login" element={user ? <Navigate to={path.includes("login") ? "/" : path} /> : <Login />} />
                <Route path="signup" element={user ? <Navigate to="/" /> : <SignUp />} />
                <Route path="signup/verifyEmail" element={<Otp />} />
                <Route path="signup/userDetails" element={<UserDetails />} />
            </Route>
        </Routes>
    );
};
