import {
    appConfig,
    DEFAULT_TELEGRAM_THRESHOLD,
    TELEGRAM_DELIVERY_MODES,
    isValidTimeThreshold
} from './configManager';

const getSafeDate = (date = new Date()) => {
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
    }

    return new Date();
};

export const getDeviceTimeZoneLabel = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'hora local del dispositivo';
};

export const parseTimeThresholdToMinutes = (value) => {
    if (!isValidTimeThreshold(value)) return null;

    const [hours, minutes] = value.trim().split(':').map(Number);
    return (hours * 60) + minutes;
};

export const getLocalMinutesSinceMidnight = (date = new Date()) => {
    const safeDate = getSafeDate(date);
    return (safeDate.getHours() * 60) + safeDate.getMinutes();
};

export const evaluateTelegramDelivery = ({ date = new Date(), config = appConfig } = {}) => {
    const safeDate = getSafeDate(date);

    const mode = config?.delivery?.telegram?.mode === TELEGRAM_DELIVERY_MODES.TIME_BASED
        ? TELEGRAM_DELIVERY_MODES.TIME_BASED
        : TELEGRAM_DELIVERY_MODES.IMMEDIATE;

    const threshold = isValidTimeThreshold(config?.delivery?.telegram?.timeBased?.threshold)
        ? config.delivery.telegram.timeBased.threshold.trim()
        : DEFAULT_TELEGRAM_THRESHOLD;

    const thresholdMinutes =
        parseTimeThresholdToMinutes(threshold) ??
        parseTimeThresholdToMinutes(DEFAULT_TELEGRAM_THRESHOLD) ??
        0;

    const currentMinutes = getLocalMinutesSinceMidnight(safeDate);
    const shouldSend =
        mode === TELEGRAM_DELIVERY_MODES.IMMEDIATE || currentMinutes >= thresholdMinutes;

    return {
        channel: 'telegram',
        mode,
        shouldSend,
        threshold,
        thresholdMinutes,
        currentMinutes,
        timezone: getDeviceTimeZoneLabel(),
        evaluatedAt: safeDate.toISOString(),
        reason:
            mode === TELEGRAM_DELIVERY_MODES.IMMEDIATE
                ? 'immediate'
                : shouldSend
                    ? 'threshold_met'
                    : 'before_threshold'
    };
};