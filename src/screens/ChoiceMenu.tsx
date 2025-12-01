import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { Grid } from '@mui/joy';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import ChoiceButton from '../components/ChoiceButton';
import useDebouncedEffect from '../hooks/useDebouncedEffect';
import useIsMobile from '../hooks/useIsMobile';
import useNarrationFunctions from '../hooks/useNarrationFunctions';
import { useQueryChoiceMenuOptions } from '../hooks/useQueryInterface';
import useInterfaceStore from '../stores/useInterfaceStore';
import useStepStore from '../stores/useStepStore';
import useTypewriterStore from '../stores/useTypewriterStore';

export default function ChoiceMenu() {
    const isMobile = useIsMobile();
    const nextStepLoading = useStepStore(state => state.loading);
    const { data: menu = [] } = useQueryChoiceMenuOptions();
    const typewriterInProgress = useTypewriterStore(useShallow(state => state.inProgress));
    const hidden = useInterfaceStore(useShallow(state => state.hidden));
    const { selectChoice } = useNarrationFunctions();
    const [open, setOpen] = useState(false);

    useDebouncedEffect(() => setOpen(!(hidden || menu.length == 0 || typewriterInProgress)), { delay: 100 }, [
        hidden,
        menu,
        typewriterInProgress,
    ]);

    if (!open) return null;

    return (
        <Grid
            container
            direction='column'
            justifyContent='center'
            alignItems='center'
            rowSpacing={isMobile ? 1.5 : 2}
            sx={{
                overflow: 'auto',
                height: '100%',
                gap: isMobile ? 0.75 : 1,
                width: '100%',
                pointerEvents: hidden ? 'none' : 'auto',
                margin: 0,
                paddingY: isMobile ? 1 : 0,
            }}
            role='menu'
        >
            {menu.map((item, index) => (
                <Grid
                    key={'choice-' + index}
                    justifyContent='center'
                    alignItems='center'
                    className={
                        hidden
                            ? 'motion-opacity-out-0 motion-translate-y-out-[50%]'
                            : `motion-opacity-in-0 motion-translate-y-in-[50%] motion-delay-[${index * 200}ms]`
                    }
                >
                    <ChoiceButton
                        loading={nextStepLoading}
                        onClick={() =>
                            selectChoice(item).then(() => {
                                setOpen(false);
                            })
                        }
                        sx={{
                            left: 0,
                            right: 0,
                            width: isMobile ? '90%' : undefined,
                            maxWidth: isMobile ? '400px' : undefined,
                            fontSize: isMobile ? { xs: '0.875rem', sm: '0.9375rem' } : undefined,
                        }}
                        startDecorator={item.type === 'close' ? <KeyboardReturnIcon /> : undefined}
                    >
                        {item.text}
                    </ChoiceButton>
                </Grid>
            ))}
        </Grid>
    );
}
