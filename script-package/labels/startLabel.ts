// 这些声明只用于类型提示，运行时会由 loader 注入同名变量
// 注意：不要写 import！
declare const navigator: any;
declare const RegisteredQuests: any;
declare const RegisteredRooms: any;
declare const timeTracker: any;
declare const narration: any;
declare const newLabel: any;

/**
 * 剧情包里的真实开场逻辑：
 * - 设定当前房间为 mc_room（如果存在）
 * - 启动 aliceQuest（如果存在且未开始）
 * - 设置时间为早上 8 点
 */
export const startFromPackageLabel = newLabel('start_from_package', [
    async (props: any) => {
        const mcRoom = RegisteredRooms.get('mc_room');
        const aliceQuest = RegisteredQuests.get('aliceQuest');

        if (mcRoom) {
            navigator.currentRoom = mcRoom;
        }

        if (aliceQuest && !aliceQuest.started) {
            await aliceQuest.start(props);
        }

        timeTracker.currentTime = 8;
        narration.dialogue = 'Game started from script package.';
    },
]);
