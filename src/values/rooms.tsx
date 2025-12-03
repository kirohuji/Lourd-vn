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
            x: { align: 0.8 }, // 门在右侧
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
            x: { align: 0.8 }, // 门在右侧
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
            x: { align: 0.8 }, // 门在右侧
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
            x: { align: 0.2 }, // 门在左侧
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
            x: { align: 0.2 }, // MC房间门在左侧
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'alice_room',
            x: { align: 0.3 }, // Alice房间门
            y: { align: 0.3 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'ann_room',
            x: { align: 0.3 }, // Ann房间门
            y: { align: 0.7 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'bathroom',
            x: { align: 0.7 }, // 卫生间门在右侧
            y: { align: 0.5 },
            width: 80,
            height: 120,
        },
        {
            targetRoomId: 'terrace',
            x: { align: 0.9 }, // 阳台门在最右侧
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
            x: { align: 0.1 }, // 返回客厅的门在左侧
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
