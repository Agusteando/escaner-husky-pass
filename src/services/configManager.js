import { reactive } from 'vue';

const STATE_KEY = 'husky_pass_settings';
const DEFAULT_TEMPLATE = '**{fullnameP}** {grado} {grupo} {puertaEmoji}🚪 {puertaText}';

export const TELEGRAM_DELIVERY_MODES = Object.freeze({
    IMMEDIATE: 'immediate',
    TIME_BASED: 'time_based'
});

export const VALID_TELEGRAM_DELIVERY_MODES = Object.freeze(
    Object.values(TELEGRAM_DELIVERY_MODES)
);

export const DEFAULT_TELEGRAM_THRESHOLD = '15:30';

const createDefaultConfig = () => ({
    rules: [],
    templates: {
        default: DEFAULT_TEMPLATE
    },
    delivery: {
        telegram: {
            mode: TELEGRAM_DELIVERY_MODES.IMMEDIATE,
            timeBased: {
                threshold: DEFAULT_TELEGRAM_THRESHOLD
            }
        }
    }
});

export const appConfig = reactive(createDefaultConfig());

export const isValidTimeThreshold = (value) => {
    if (typeof value !== 'string') return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
};

const normalizeTemplates = (templates = {}) => ({
    default:
        typeof templates.default === 'string' && templates.default.trim() !== ''
            ? templates.default
            : DEFAULT_TEMPLATE
});

const normalizeTelegramDelivery = (telegram = {}) => {
    const mode = VALID_TELEGRAM_DELIVERY_MODES.includes(telegram?.mode)
        ? telegram.mode
        : TELEGRAM_DELIVERY_MODES.IMMEDIATE;

    const threshold = isValidTimeThreshold(telegram?.timeBased?.threshold)
        ? telegram.timeBased.threshold.trim()
        : DEFAULT_TELEGRAM_THRESHOLD;

    return {
        mode,
        timeBased: {
            threshold
        }
    };
};

export const normalizeConfig = (config = {}) => ({
    rules: Array.isArray(config?.rules)
        ? config.rules.map(rule => ({ ...rule }))
        : [],
    templates: normalizeTemplates(config?.templates),
    delivery: {
        telegram: normalizeTelegramDelivery(config?.delivery?.telegram)
    }
});

export const validateConfig = (config = {}) => {
    const errors = [];
    const normalizedConfig = normalizeConfig(config);

    const rawMode = config?.delivery?.telegram?.mode;
    if (rawMode != null && !VALID_TELEGRAM_DELIVERY_MODES.includes(rawMode)) {
        errors.push('El modo de envío de Telegram no es válido.');
    }

    const effectiveMode = normalizedConfig.delivery.telegram.mode;
    const rawThreshold = config?.delivery?.telegram?.timeBased?.threshold;

    if (effectiveMode === TELEGRAM_DELIVERY_MODES.TIME_BASED) {
        const thresholdToValidate = rawThreshold ?? normalizedConfig.delivery.telegram.timeBased.threshold;

        if (!isValidTimeThreshold(thresholdToValidate)) {
            errors.push('La hora mínima de envío de Telegram debe tener formato HH:MM en 24 horas.');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        normalizedConfig
    };
};

export const loadConfig = async () => {
    const saved = localStorage.getItem(STATE_KEY);

    if (saved) {
        try {
            saveConfig(JSON.parse(saved));
            return appConfig;
        } catch (e) {
            console.error('Failed to parse saved config', e);
            localStorage.removeItem(STATE_KEY);
        }
    }

    try {
        const response = await fetch('/config.json', { cache: 'no-store' });

        if (response.ok) {
            const data = await response.json();
            saveConfig(data);
            return appConfig;
        }
    } catch (e) {
        console.error('Failed to load default config', e);
    }

    saveConfig(createDefaultConfig());
    return appConfig;
};

export const saveConfig = (config = appConfig) => {
    const normalizedConfig = normalizeConfig(config);
    Object.assign(appConfig, normalizedConfig);
    localStorage.setItem(STATE_KEY, JSON.stringify(normalizedConfig));
    return normalizedConfig;
};

export const getMatchedRules = (plantel, nivel, grado) => {
    const matches = [];
    const plantelValue = String(plantel ?? '').toUpperCase();
    const nivelValue = String(nivel ?? '').toLowerCase();
    const gradoValue = String(grado ?? '').toLowerCase();

    for (const rule of appConfig.rules) {
        const rulePlantel = String(rule?.plantel ?? '');
        const rulePlantels = rulePlantel
            .split(',')
            .map(p => p.trim().toUpperCase())
            .filter(Boolean);

        const matchPlantel = rulePlantel.trim() === '*' || rulePlantels.includes(plantelValue);

        const ruleNivel = String(rule?.nivel ?? 'general').toLowerCase();
        const matchNivel = ruleNivel === nivelValue || ruleNivel === 'general';

        const ruleGrado = String(rule?.grado ?? 'general').toLowerCase();
        const exactGrado = ruleGrado === gradoValue;
        const generalGrado = ruleGrado === 'general';

        if (matchPlantel && matchNivel && (exactGrado || generalGrado)) {
            matches.push({ ...rule, isExact: exactGrado });
        }
    }

    matches.sort((a, b) => (a.isExact === b.isExact ? 0 : a.isExact ? 1 : -1));
    return matches;
};