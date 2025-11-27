// 只声明，运行时由 loader 注入
declare const navigator: any;
declare const canvas: any;
declare const narration: any;
declare const newChoiceOption: any;
declare const newCloseChoiceOption: any;
declare const newLabel: any;
declare const showImage: any;
declare const BACKGROUND_ID: string;
async function showRoomBackground(props: any) {
    const currentRoom = navigator.currentRoom;
    if (!currentRoom) return;

    const bg = currentRoom.background as any;

    if (typeof bg === 'string') {
        await showImage(BACKGROUND_ID, bg);
    } else {
        canvas.add(BACKGROUND_ID, bg);
    }
}

const sleepHourLabel = newLabel('Sleep1HourLabel', [
    ({ hour, ...props }: { hour: number } & any) => {
        props.sleep(hour, props);
        narration.goNext(props);
    },
]);

const napHourLabel = newLabel('Nap1HourLabel', [
    ({ hour, ...props }: { hour: number } & any) => {
        props.wait(hour);
        narration.goNext(props);
    },
]);

export const sleepLabel = newLabel('SleepLabel', [
    async (props: any) => {
        await showRoomBackground(props);

        narration.dialogue = 'What time do you want to set the alarm?';
        narration.choiceMenuOptions = [
            newChoiceOption(props.uiTransition('allarm_menu_item', { hour: 8 }), sleepHourLabel, { hour: 8 }),
            newChoiceOption(props.uiTransition('allarm_menu_item', { hour: 9 }), sleepHourLabel, { hour: 9 }),
            newChoiceOption(props.uiTransition('allarm_menu_item', { hour: 10 }), sleepHourLabel, { hour: 10 }),
            newCloseChoiceOption('Cancel'),
        ];
    },
]);

export const napLabel = newLabel('NapLabel', [
    async (props: any) => {
        await showRoomBackground(props);

        narration.dialogue = 'You are tired and decide to take a nap.';
        narration.choiceMenuOptions = [
            newChoiceOption(props.uiTransition('nap_menu_item', { hour: 3 }), napHourLabel, { hour: 3 }),
            newChoiceOption(props.uiTransition('sleep'), sleepLabel, { hour: 3 }),
            newCloseChoiceOption('Cancel'),
        ];
    },
]);
