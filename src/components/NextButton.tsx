import { Button } from "@mui/joy";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useNarrationFunctions from "../hooks/useNarrationFunctions";
import { useQueryCanGoNext } from "../hooks/useQueryInterface";
import useIsMobile from "../hooks/useIsMobile";
import useInterfaceStore from "../stores/useInterfaceStore";
import useSkipStore from "../stores/useSkipStore";
import useStepStore from "../stores/useStepStore";

export default function NextButton() {
    const skipEnabled = useSkipStore((state) => state.enabled);
    const setSkipEnabled = useSkipStore((state) => state.setEnabled);
    const nextStepLoading = useStepStore((state) => state.loading);
    const goBackLoading = useStepStore((state) => state.backLoading);
    const { data: canContinue = false } = useQueryCanGoNext();
    const hideNextButton = useInterfaceStore((state) => state.hidden || !canContinue);
    const { goNext } = useNarrationFunctions();
    const { t } = useTranslation(["ui"]);
    const isMobile = useIsMobile();
    const varians = useMemo(
        () =>
            hideNextButton
                ? `motion-opacity-out-0 motion-translate-y-out-[50%]`
                : `motion-opacity-in-0 motion-translate-y-in-[50%]`,
        [hideNextButton]
    );

    return (
        <Button
            variant='solid'
            color='primary'
            size='sm'
            disabled={goBackLoading}
            loading={nextStepLoading}
            sx={{
                position: "absolute",
                bottom: isMobile ? '16px' : 0,
                right: isMobile ? '16px' : 0,
                width: isMobile ? '80px' : { xs: 70, sm: 100, md: 150 },
                minHeight: isMobile ? '44px' : undefined,
                border: 3,
                zIndex: 100,
                fontSize: isMobile ? '0.875rem' : undefined,
            }}
            onClick={() => {
                if (skipEnabled) {
                    setSkipEnabled(false);
                }
                goNext();
            }}
            className={varians}
        >
            {t("next")}
        </Button>
    );
}
