import { OnRunAsyncFunction } from '@drincs/nqtr';
import { useMemo } from 'react';
import { NqtrRoundIconButtonConvertor } from '../../components/NqtrRoundIconButton.tsx';
import StackOverflow from '../../components/StackOverflow.tsx';
import useGameProps from '../../hooks/useGameProps.ts';
import useIsMobile from '../../hooks/useIsMobile';
import { useQueryCurrentRoomId, useQueryRoom } from '../../hooks/useQueryNQTR';

export default function QuickActivities() {
    const { data: currentRoomId } = useQueryCurrentRoomId();
    const { data: { activities = [], routine = [] } = {} } = useQueryRoom(currentRoomId);
    const gameProps = useGameProps();
    const { uiTransition: t } = gameProps;
    const isMobile = useIsMobile();
    const onClick = useMemo(
        () => async (run: OnRunAsyncFunction) => {
            run(gameProps).then(() => {
                gameProps.invalidateInterfaceData();
            });
        },
        [gameProps],
    );

    return (
        <StackOverflow
            direction='column'
            justifyContent='center'
            alignItems='flex-end'
            spacing={isMobile ? 1 : 0.5}
            maxLeght={'80%'}
            sx={{
                display: 'flex',
                position: 'absolute',
                bottom: isMobile ? '84px' : 0,
                right: isMobile ? '12px' : 0,
                pointerEvents: 'auto',
            }}
        >
            {activities.map((item, index) => (
                <NqtrRoundIconButtonConvertor
                    key={`activity-${index}-${item.id}`}
                    disabled={item.disabled}
                    onClick={() => onClick(item.run)}
                    ariaLabel={t(item.name)}
                    image={item.icon}
                />
            ))}
            {routine.map((item, index) => (
                <NqtrRoundIconButtonConvertor
                    key={`commitment-${index}-${item.id}`}
                    disabled={item.disabled}
                    onClick={() => onClick(item.run)}
                    ariaLabel={t(item.name)}
                    image={item.icon}
                />
            ))}
        </StackOverflow>
    );
}
