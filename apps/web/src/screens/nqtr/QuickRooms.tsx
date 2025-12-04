import { navigator } from '@drincs/nqtr';
import { Avatar, AvatarGroup, Box, Grid } from '@mui/joy';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { NqtrRoundIconButtonConvertor } from '../../components/NqtrRoundIconButton.tsx';
import StackOverflow from '../../components/StackOverflow.tsx';
import useIsMobile from '../../hooks/useIsMobile';
import { INTERFACE_DATA_USE_QUEY_KEY } from '../../hooks/useQueryInterface';
import {
    CURRENT_ROOM_USE_QUEY_KEY,
    useQueryCurrentRoomId,
    useQueryQuickRooms,
    useQueryRoom,
} from '../../hooks/useQueryNQTR.ts';

export default function QuickRooms() {
    const { data: rooms = [] } = useQueryQuickRooms();
    const isMobile = useIsMobile();

    // 移动端：如果房间数量多，使用网格布局（2列）
    // 桌面端：使用横向滚动
    if (isMobile && rooms.length > 4) {
        return (
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    maxHeight: '60%',
                    maxWidth: '200px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pointerEvents: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '2px',
                    },
                }}
            >
                <Grid
                    container
                    spacing={0.5}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {rooms.map(room => (
                        <Grid key={'room-' + room.id} xs={12}>
                            <QuickRoom roomId={room.id} {...room} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    // 移动端：房间数量少时，使用单列垂直布局
    if (isMobile) {
        return (
            <StackOverflow
                direction='column'
                justifyContent='flex-start'
                alignItems='flex-start'
                spacing={0.5}
                maxLeght={'60%'}
                sx={{
                    display: 'flex',
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    pointerEvents: 'auto',
                    maxWidth: '200px',
                }}
            >
                {rooms.map(room => (
                    <QuickRoom key={'room-' + room.id} roomId={room.id} {...room} />
                ))}
            </StackOverflow>
        );
    }

    // 桌面端：横向滚动布局
    return (
        <StackOverflow
            direction='row'
            justifyContent='flex-start'
            alignItems='flex-end'
            spacing={0.25}
            maxLeght={'80%'}
            sx={{
                display: 'flex',
                position: 'absolute',
                bottom: 0,
                left: 0,
                pointerEvents: 'auto',
            }}
        >
            {rooms.map(room => (
                <QuickRoom key={'room-' + room.id} roomId={room.id} {...room} />
            ))}
        </StackOverflow>
    );
}

function QuickRoom({ roomId }: { roomId: string }) {
    const queryClient = useQueryClient();
    const { data } = useQueryRoom(roomId);
    const { data: currentRoomId } = useQueryCurrentRoomId();
    const { disabled, icon, name, characters } = data || {};
    const selected = useMemo(() => currentRoomId === roomId, [currentRoomId, roomId]);

    return (
        <NqtrRoundIconButtonConvertor
            disabled={disabled || selected}
            selected={selected}
            onClick={() => {
                if (!disabled && !selected) {
                    navigator.currentRoom = roomId;
                    queryClient.setQueryData([INTERFACE_DATA_USE_QUEY_KEY, CURRENT_ROOM_USE_QUEY_KEY], roomId);
                }
            }}
            ariaLabel={name || ''}
            image={icon}
        >
            {characters && (
                <AvatarGroup
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        '--Avatar-size': { xs: '15px', sm: '22px', md: '28px' },
                    }}
                >
                    {characters.length <= 3 && (
                        <>
                            {characters.map(character => (
                                <Avatar key={character.id} alt={character.name} src={character.icon} size='sm' />
                            ))}
                        </>
                    )}
                    {characters.length > 3 && (
                        <>
                            {characters.slice(0, 2).map(character => (
                                <Avatar key={character.id} alt={character.name} src={character.icon} size='sm' />
                            ))}
                            <Avatar
                                sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                }}
                                size='sm'
                            >
                                +{characters.length - 2}
                            </Avatar>
                        </>
                    )}
                </AvatarGroup>
            )}
        </NqtrRoundIconButtonConvertor>
    );
}
