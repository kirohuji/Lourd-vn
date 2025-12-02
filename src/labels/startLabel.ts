import { navigator, timeTracker } from '@drincs/nqtr';
import { newLabel } from '@drincs/pixi-vn';
import { NARRATION_ROUTE } from '../constans';
import { aliceQuest } from '../values/quests';
import { mcRoom } from '../values/rooms';
import { navigateAndJumpToLabel } from './label-utility';

const startLabel = newLabel('start', [
    async props => {
        navigator.currentRoom = mcRoom;
        await aliceQuest.start(props);
        timeTracker.currentTime = 8;

        // 先播放开场白（在 narration 界面）
        // 开场白结束后会自动导航到游戏主界面（通过 Ink 脚本中的 #navigate 指令）
        await navigateAndJumpToLabel('IntroOpening', NARRATION_ROUTE, props);
        // await props.navigate(NAVIGATION_ROUTE);
    },
]);
export default startLabel;
