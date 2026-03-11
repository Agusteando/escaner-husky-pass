import { reactive } from 'vue';

const STATE_KEY = 'husky_pass_settings';

export const appConfig = reactive({
    rules: [],
    templates: {
        default: "**{fullnameP}** {grado} {grupo} {puertaEmoji}🚪 {puertaText}"
    }
});

export const loadConfig = async () => {
    // Attempt to load from localStorage first
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        Object.assign(appConfig, JSON.parse(saved));
        return;
    }
    
    // Fallback to default config.json
    try {
        const response = await fetch('/config.json');
        if (response.ok) {
            const data = await response.json();
            Object.assign(appConfig, data);
            saveConfig();
        }
    } catch (e) {
        console.error("Failed to load default config", e);
    }
};

export const saveConfig = () => {
    localStorage.setItem(STATE_KEY, JSON.stringify(appConfig));
};

export const getMatchedRules = (plantel, nivel, grado) => {
    const matches = [];
    
    for (const rule of appConfig.rules) {
        // Multi-plantel logic (comma separated or * for all)
        const rulePlantels = rule.plantel.split(',').map(p => p.trim().toUpperCase());
        const matchPlantel = rule.plantel === '*' || rulePlantels.includes(plantel.toUpperCase());
        
        const matchNivel = rule.nivel.toLowerCase() === nivel.toLowerCase() || rule.nivel.toLowerCase() === 'general';
        const exactGrado = rule.grado.toLowerCase() === grado.toLowerCase();
        const generalGrado = rule.grado.toLowerCase() === 'general';
        
        if (matchPlantel && matchNivel && (exactGrado || generalGrado)) {
            matches.push({ ...rule, isExact: exactGrado });
        }
    }
    
    // Sort so exact matches overwrite general matches if they happen to share the same chatId
    matches.sort((a, b) => (a.isExact === b.isExact ? 0 : a.isExact ? 1 : -1));
    return matches;
};