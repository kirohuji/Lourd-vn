import DirectionsIcon from '@mui/icons-material/Directions';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../hooks/useIsMobile';
import useHotspotsStore from '../stores/useHotspotsStore';
import RoundIconButton from './RoundIconButton';

export default function MoveButton() {
    const { showHotspots, toggleHotspots } = useHotspotsStore();
    const { t } = useTranslation(['ui']);
    const isMobile = useIsMobile();

    return (
        <RoundIconButton
            variant={showHotspots ? 'solid' : 'soft'}
            color={showHotspots ? 'primary' : 'neutral'}
            ariaLabel={t('move') || '移动'}
            onClick={toggleHotspots}
            sx={{
                position: 'absolute',
                bottom: isMobile ? '84px' : '4rem', // 放在活动按钮上方，避免重叠
                right: isMobile ? '16px' : '0.5rem',
                zIndex: 100,
            }}
        >
            <DirectionsIcon
                sx={{
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
                }}
            />
        </RoundIconButton>
    );
}
