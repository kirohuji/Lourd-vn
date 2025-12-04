import { Route, Routes } from "react-router-dom";
import MoveButton from "./components/MoveButton";
import NextButton from "./components/NextButton";
import VisibilityButton from "./components/VisibilityButton";
import { LOADING_ROUTE, MAIN_MENU_ROUTE, MAP_ROUTE, NARRATION_ROUTE, NAVIGATION_ROUTE } from "./constans";
import useNQTRDetector from "./hooks/useNQTRDetector";
import useSkipAutoDetector from "./hooks/useSkipAutoDetector";
import HistoryScreen from "./screens/HistoryScreen";
import LoadingScreen from "./screens/LoadingScreen";
import MainMenu from "./screens/MainMenu";
import TextInput from "./screens/modals/TextInput";
import NarrationScreen from "./screens/NarrationScreen";
import MapScreen from "./screens/nqtr/MapScreen";
import MemoScreen from "./screens/nqtr/MemoScreen";
import NqtrQuickTools from "./screens/nqtr/NqtrQuickTools";
import QuickActivities from "./screens/nqtr/QuickActivities";
import QuickRooms from "./screens/nqtr/QuickRooms";
import TimeScreen from "./screens/nqtr/TimeScreen";
import QuickTools from "./screens/QuickTools";
import AdminLayout from "./screens/admin/AdminLayout";
import ResourcesManagement from "./screens/admin/ResourcesManagement";
import UsersManagement from "./screens/admin/UsersManagement";
import Login from "./screens/admin/Login";
import { AuthGuard } from "./utils/auth-guard";

export default function AppRoutes() {
    return (
        <Routes>
            {/* 游戏路由 */}
            <Route key={"main_menu"} path={MAIN_MENU_ROUTE} element={<MainMenu />} />
            <Route key={"loading"} path={LOADING_ROUTE} element={<LoadingScreen />} />
            <Route key={"narration"} path={NARRATION_ROUTE} element={<NarrationElement />} />
            <Route key={"navigation"} path={NAVIGATION_ROUTE} element={<NavigationElement />} />
            <Route key={"map"} path={MAP_ROUTE} element={<MapScreen />} />
            
            {/* 管理后台路由 */}
            <Route path="/admin/login" element={<Login />} />
            <Route
                path="/admin"
                element={
                    <AuthGuard requireAdmin={true} redirectTo="/admin/login">
                        <AdminLayout />
                    </AuthGuard>
                }
            >
                <Route
                    path="resources"
                    element={
                        <AuthGuard requireAdmin={true} redirectTo="/admin/login">
                            <ResourcesManagement />
                        </AuthGuard>
                    }
                />
                <Route
                    path="users"
                    element={
                        <AuthGuard requireAdmin={true} redirectTo="/admin/login">
                            <UsersManagement />
                        </AuthGuard>
                    }
                />
            </Route>
            
            <Route path='*' element={<MainMenu />} />
        </Routes>
    );
}

function NarrationElement() {
    return (
        <>
            <HistoryScreen />
            <NarrationScreen />
            <QuickTools />
            <TextInput />
            <NextButton />
            <NarrationDetectors />
            <VisibilityButton />
        </>
    );
}

function NavigationElement() {
    NavigationDetectors();
    return (
        <>
            <HistoryScreen />
            <MemoScreen />
            <QuickActivities />
            <QuickRooms />
            <TimeScreen />
            <NqtrQuickTools />
            <MoveButton />
            <VisibilityButton />
        </>
    );
}

function NarrationDetectors() {
    useSkipAutoDetector();
    return <></>;
}

function NavigationDetectors() {
    useNQTRDetector();
    return <></>;
}
