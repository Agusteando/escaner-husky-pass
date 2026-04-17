import { reactive } from 'vue';

const DEFAULT_TEMPLATE = '**{fullnameA}** {grado} {grupo} {puertaEmoji}🚪{puertaText}';
export const DEFAULT_TELEGRAM_THRESHOLD = '15:30';

export const TELEGRAM_DELIVERY_MODES = Object.freeze({
    IMMEDIATE: 'immediate',
    TIME_BASED: 'time_based'
});

export const VALID_TELEGRAM_DELIVERY_MODES = Object.freeze(
    Object.values(TELEGRAM_DELIVERY_MODES)
);

export const isValidTimeThreshold = (value) => {
    if (typeof value !== 'string') return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
};

export const createDefaultTelegramDeliveryConfig = () => ({
    mode: TELEGRAM_DELIVERY_MODES.IMMEDIATE,
    timeBased: {
        threshold: DEFAULT_TELEGRAM_THRESHOLD
    }
});

const createDefaultConfig = () => ({
    rules: [],
    templates: {
        default: DEFAULT_TEMPLATE
    }
});

const normalizeTemplates = (templates = {}) => ({
    default:
        typeof templates.default === 'string' && templates.default.trim() !== ''
            ? templates.default
            : DEFAULT_TEMPLATE
});

const normalizeTelegramDelivery = (deliveryConfig = {}, fallbackConfig = null) => {
    const source = deliveryConfig && typeof deliveryConfig === 'object'
        ? deliveryConfig
        : (fallbackConfig && typeof fallbackConfig === 'object' ? fallbackConfig : {});

    const mode = VALID_TELEGRAM_DELIVERY_MODES.includes(source?.mode)
        ? source.mode
        : TELEGRAM_DELIVERY_MODES.IMMEDIATE;

    const threshold = isValidTimeThreshold(source?.timeBased?.threshold)
        ? source.timeBased.threshold.trim()
        : DEFAULT_TELEGRAM_THRESHOLD;

    return {
        mode,
        timeBased: {
            threshold
        }
    };
};

const normalizeRule = (rule = {}, legacyGlobalTelegramConfig = null) => {
    const telegramDeliverySource =
        rule?.telegramDelivery ??
        rule?.delivery?.telegram ??
        legacyGlobalTelegramConfig;

    return {
        ...rule,
        plantel: typeof rule?.plantel === 'string' ? rule.plantel : '',
        nivel: typeof rule?.nivel === 'string' && rule.nivel.trim() !== '' ? rule.nivel : 'general',
        grado: typeof rule?.grado === 'string' && rule.grado.trim() !== '' ? rule.grado : 'general',
        chatId: typeof rule?.chatId === 'string' ? rule.chatId : '',
        template: typeof rule?.template === 'string' ? rule.template : '',
        telegramDelivery: normalizeTelegramDelivery(telegramDeliverySource)
    };
};

export const normalizeConfig = (config = {}) => {
    const legacyGlobalTelegramConfig = config?.delivery?.telegram ?? null;

    return {
        rules: Array.isArray(config?.rules)
            ? config.rules.map(rule => normalizeRule(rule, legacyGlobalTelegramConfig))
            : [],
        templates: normalizeTemplates(config?.templates)
    };
};

// Objeto Global Reactivo
export const appConfig = reactive(normalizeConfig(createDefaultConfig()));

const validateSingleTelegramDelivery = (telegramDelivery, label) => {
    const errors = [];

    if (
        telegramDelivery?.mode != null &&
        !VALID_TELEGRAM_DELIVERY_MODES.includes(telegramDelivery.mode)
    ) {
        errors.push(`${label}: el modo de envío de Telegram no es válido.`);
        return errors;
    }

    const mode = telegramDelivery?.mode ?? TELEGRAM_DELIVERY_MODES.IMMEDIATE;
    const threshold = telegramDelivery?.timeBased?.threshold;

    if (mode === TELEGRAM_DELIVERY_MODES.TIME_BASED && !isValidTimeThreshold(threshold)) {
        errors.push(`${label}: la hora mínima de Telegram debe tener formato HH:MM en 24 horas.`);
    }

    return errors;
};

export const validateConfig = (config = {}) => {
    const errors = [];
    const normalizedConfig = normalizeConfig(config);

    const rawRules = Array.isArray(config?.rules) ? config.rules : [];
    const legacyGlobalTelegramConfig = config?.delivery?.telegram ?? null;

    rawRules.forEach((rawRule, index) => {
        const telegramDeliverySource =
            rawRule?.telegramDelivery ??
            rawRule?.delivery?.telegram ??
            legacyGlobalTelegramConfig;

        errors.push(
            ...validateSingleTelegramDelivery(
                telegramDeliverySource,
                `Regla ${index + 1}`
            )
        );
    });

    return {
        valid: errors.length === 0,
        errors,
        normalizedConfig
    };
};

export const loadConfig = async () => {
    let loadedFromDatabase = false;

    // 1. Siempre intentar cargar la configuración global desde MySQL
    try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            
            // Si los datos son válidos, los aplicamos. 
            // Incluso si no hay reglas, es una configuración válida (el admin pudo borrarlas).
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                const normalized = normalizeConfig(data);
                Object.assign(appConfig, normalized);
                loadedFromDatabase = true;
                return appConfig;
            }
        }
    } catch (e) {
        console.warn('Fallo en la sincronización con la base de datos. Intentando usar el archivo local de respaldo.', e);
    }

    // 2. Respaldo al archivo JSON local temporal solo en memoria.
    if (!loadedFromDatabase) {
        try {
            const response = await fetch('/config.json', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                const normalized = normalizeConfig(data);
                Object.assign(appConfig, normalized);
                
                // NOTA CRÍTICA: Se eliminó el guardado automático mediante POST.
                // Si la red del cliente falla, cargará el JSON solo para sí mismo, 
                // evitando sobrescribir la configuración central de todos los demás usuarios.
                
                return appConfig;
            }
        } catch (e) {
            console.error('No se pudo cargar la configuración de respaldo config.json', e);
        }
    }

    return appConfig;
};

export const saveConfig = async (config = appConfig) => {
    const normalizedConfig = normalizeConfig(config);

    // Guardado Estricto: Si MySQL no responde adecuadamente, rechazamos el guardado local.
    const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedConfig)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo guardar la configuración global en la base de datos.');
    }

    // Actualiza la memoria instantáneamente si el éxito está garantizado
    Object.assign(appConfig, normalizedConfig);
    return normalizedConfig;
};

export const startConfigSync = () => {
    // Escucha eventos de visibilidad para asegurar que la app tenga la versión más fresca
    // Esto asegura 0 costos continuos en Vercel sin recurrir a "Heavy Polling".
    // Solo hace un request al volver a visualizar o usar el dispositivo de forma activa.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
            loadConfig();
        }
    });
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