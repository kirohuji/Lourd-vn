import { RegisteredRooms } from '@drincs/nqtr';
import TimeSlotsImage from '../models/TimeSlotsImage';
import Room from '../models/nqtr/Room';
import { bed } from './activities';
import { gym, mcHome, school } from './locations';

export const mcRoom = new Room('mc_room', mcHome, {
    name: 'MC room',
    background: new TimeSlotsImage({
        morning: 'location_myroom-0',
        afternoon: 'location_myroom-1',
        evening: 'location_myroom-2',
        night: 'location_myroom-3',
    }),
    activities: [bed],
    hotspots: [
        {
            targetRoomId: 'lounge',
            x: { align: 0.95 }, // 门在右侧边缘，箭头指向左
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
    ],
});

export const aliceRoom = new Room('alice_room', mcHome, {
    name: 'Alice room',
    background: new TimeSlotsImage({
        morning: 'location_aliceroom-0',
        afternoon: 'location_aliceroom-1',
        evening: 'location_aliceroom-2',
        night: 'location_aliceroom-3',
    }),
    hotspots: [
        {
            targetRoomId: 'lounge',
            x: { align: 0.95 }, // 门在右侧边缘，箭头指向左
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
    ],
});

export const annRoom = new Room('ann_room', mcHome, {
    name: 'Ann room',
    background: new TimeSlotsImage({
        morning: 'location_annroom-0',
        afternoon: 'location_annroom-1',
        evening: 'location_annroom-2',
        night: 'location_annroom-3',
    }),
    hotspots: [
        {
            targetRoomId: 'lounge',
            x: { align: 0.95 }, // 门在右侧边缘，箭头指向左
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
    ],
});

export const bathroom = new Room('bathroom', mcHome, {
    name: 'Bathroom',
    background: 'location_bathroom',
    hotspots: [
        {
            targetRoomId: 'lounge',
            x: { align: 0.05 }, // 门在左侧边缘，箭头指向右
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
    ],
});

export const lounge = new Room('lounge', mcHome, {
    name: 'Lounge',
    background: new TimeSlotsImage({
        morning: 'location_lounge-0',
        afternoon: 'location_lounge-1',
        evening: 'location_lounge-2',
        night: 'location_lounge-3',
    }),
    hotspots: [
        {
            targetRoomId: 'mc_room',
            iconType: 'hand', // 使用手套图标
            x: { align: 0.05 }, // MC房间门在左侧边缘
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'alice_room',
            iconType: 'arrow', // 使用箭头图标
            x: { align: 0.05 }, // Alice房间门在左侧边缘
            y: { align: 0.3 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'ann_room',
            iconType: 'hand', // 使用手套图标
            x: { align: 0.05 }, // Ann房间门在左侧边缘
            y: { align: 0.7 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'bathroom',
            iconType: 'arrow', // 使用箭头图标
            x: { align: 0.95 }, // 卫生间门在右侧边缘
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'terrace',
            iconType: 'hand', // 使用手套图标（示例：可以配置为 'arrow' 或 'hand'）
            x: { align: 0.95 }, // 阳台门在右侧边缘，箭头指向左
            y: { align: 0.5 },
            width: 100,
            height: 150,
        },
    ],
});

export const terrace = new Room('terrace', mcHome, {
    name: 'Terrace',
    isEntrance: true,
    background: new TimeSlotsImage({
        morning: 'location_terrace-0',
        afternoon: 'location_terrace-1',
        evening: 'location_terrace-2',
        night: 'location_terrace-3',
    }),
    hotspots: [
        {
            targetRoomId: 'lounge',
            x: { align: 0.05 }, // 返回客厅的门在左侧边缘，箭头指向右
            y: { align: 0.5 },
            width: 100,
            height: 150,
        },
    ],
});

export const gymRoom = new Room('gym_room', gym, {
    name: 'Gym',
    background: 'location_gym',
});

export const classRoom = new Room('class_room', school, {
    name: 'School',
    background: '',
});

RegisteredRooms.add([mcRoom, aliceRoom, annRoom, bathroom, lounge, terrace, gymRoom, classRoom]);
