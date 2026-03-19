<template>
  <div class="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col slide-in">
      <div class="p-6 bg-husky-blue text-white flex justify-between items-center shadow-md">
        <h2 class="font-display text-xl"><i class="fas fa-cogs mr-2"></i> Configuración</h2>
        <div class="flex items-center gap-4">
          <button @click="exportConfig" title="Exportar Configuración" class="text-white hover:text-gray-200 transition">
            <i class="fas fa-download"></i>
          </button>
          <label title="Importar Configuración" class="cursor-pointer text-white hover:text-gray-200 transition">
            <i class="fas fa-upload"></i>
            <input type="file" accept=".json" class="hidden" @change="importConfig" />
          </label>
          <button @click="$emit('close')" class="text-white hover:text-gray-200 transition ml-2">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-8">
        <!-- Message Template Section -->
        <section>
          <h3 class="font-display text-lg text-husky-gray mb-3 border-b pb-2">Plantilla Global por Defecto</h3>
          <p class="text-xs text-gray-500 mb-2">Variables disponibles: <br />
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{fullnameA}', null)">{fullnameA}</span> (Alumno),
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{personaAutorizada}', null)">{personaAutorizada}</span> (Tutor),
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{plantel}', null)">{plantel}</span>,
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{grado}', null)">{grado}</span>,
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{grupo}', null)">{grupo}</span>,
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{puertaEmoji}', null)">{puertaEmoji}</span>,
            <span class="text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{puertaText}', null)">{puertaText}</span>
          </p>
          <textarea v-model="localConfig.templates.default" ref="defaultTemplateInput" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-husky-blue outline-none resize-none text-sm font-medium" rows="3"></textarea>
        </section>

        <!-- Rules Mapping Section -->
        <section>
          <div class="flex justify-between items-center mb-3 border-b pb-2">
            <h3 class="font-display text-lg text-husky-gray">Grupos & Mapeo</h3>
            <button @click="addRule" class="bg-husky-green text-white px-3 py-1 rounded-md text-sm font-bold shadow hover:bg-green-700 transition">
              + Agregar
            </button>
          </div>

          <div class="space-y-4">
            <div v-for="(rule, index) in localConfig.rules" :key="rule.id || index" class="bg-gray-50 p-4 rounded-xl border relative shadow-sm">
              <button @click="removeRule(index)" class="absolute top-2 right-2 text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>

              <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div class="col-span-2">
                  <label class="block text-xs font-bold text-gray-500 mb-1">Plantel (Multi-plantel: PR, PM o * para todos)</label>
                  <input v-model="rule.plantel" placeholder="PR, PM, DM o *" class="w-full border p-2 rounded bg-white outline-none focus:border-husky-blue" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Nivel</label>
                  <input v-model="rule.nivel" placeholder="general, primaria..." class="w-full border p-2 rounded bg-white outline-none focus:border-husky-blue" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Grado</label>
                  <input v-model="rule.grado" placeholder="general, primero..." class="w-full border p-2 rounded bg-white outline-none focus:border-husky-blue" />
                </div>
              </div>

              <div class="mb-3">
                <label class="block text-xs font-bold text-gray-500 mb-1">Chat ID (WhatsApp / Telegram)</label>
                <input v-model="rule.chatId" placeholder="-100... o 1234@g.us" class="w-full border p-2 rounded bg-white outline-none focus:border-husky-blue text-sm font-mono" />
              </div>

              <div class="mb-4">
                <label class="block text-xs font-bold text-gray-500 mb-1">Plantilla Personalizada (Opcional, deja vacío para usar la global)</label>
                <textarea v-model="rule.template" :ref="(el) => templateRefs[index] = el" class="w-full p-2 border rounded bg-white outline-none focus:border-husky-blue text-sm font-medium resize-none" rows="2" placeholder="Plantilla individual para este grupo..."></textarea>
                <div class="text-right mt-1">
                  <span class="text-xs text-husky-purple font-mono cursor-pointer hover:underline mr-2" @click="insertVar('{plantel}', index)">+{plantel}</span>
                  <span class="text-xs text-husky-purple font-mono cursor-pointer hover:underline mr-2" @click="insertVar('{fullnameA}', index)">+{fullnameA}</span>
                  <span class="text-xs text-husky-purple font-mono cursor-pointer hover:underline" @click="insertVar('{puertaEmoji}', index)">+{puertaEmoji}</span>
                </div>
              </div>

              <div class="rounded-xl border bg-white p-4">
                <div class="mb-3">
                  <h4 class="font-display text-sm text-husky-gray">Envío Telegram para esta regla</h4>
                  <p class="text-xs text-gray-500 mt-1">
                    Este ajuste se aplica únicamente si el Chat ID corresponde a Telegram. En WhatsApp, el envío sigue siendo inmediato.
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    @click="setRuleTelegramMode(rule, TELEGRAM_DELIVERY_MODES.IMMEDIATE)"
                    :class="[
                      'text-left rounded-xl border p-3 transition shadow-sm',
                      rule.telegramDelivery.mode === TELEGRAM_DELIVERY_MODES.IMMEDIATE
                        ? 'border-husky-blue bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-200 bg-white hover:border-husky-blue'
                    ]"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-display text-sm text-husky-gray">Inmediato</span>
                      <i
                        :class="[
                          'fas fa-check-circle',
                          rule.telegramDelivery.mode === TELEGRAM_DELIVERY_MODES.IMMEDIATE ? 'text-husky-blue' : 'text-gray-300'
                        ]"
                      ></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                      Mantiene el comportamiento actual para este grupo.
                    </p>
                  </button>

                  <button
                    type="button"
                    @click="setRuleTelegramMode(rule, TELEGRAM_DELIVERY_MODES.TIME_BASED)"
                    :class="[
                      'text-left rounded-xl border p-3 transition shadow-sm',
                      rule.telegramDelivery.mode === TELEGRAM_DELIVERY_MODES.TIME_BASED
                        ? 'border-husky-blue bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-200 bg-white hover:border-husky-blue'
                    ]"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-display text-sm text-husky-gray">Basado en hora</span>
                      <i
                        :class="[
                          'fas fa-check-circle',
                          rule.telegramDelivery.mode === TELEGRAM_DELIVERY_MODES.TIME_BASED ? 'text-husky-blue' : 'text-gray-300'
                        ]"
                      ></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                      Solo envía Telegram cuando el escaneo ocurre a partir de la hora indicada.
                    </p>
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-start">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">Hora mínima</label>
                    <input
                      v-model="rule.telegramDelivery.timeBased.threshold"
                      type="time"
                      step="60"
                      :disabled="rule.telegramDelivery.mode !== TELEGRAM_DELIVERY_MODES.TIME_BASED"
                      class="w-full border p-2 rounded bg-white outline-none focus:border-husky-blue disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div class="text-xs text-gray-500 leading-relaxed">
                    <p>Formato de 24 horas. Ejemplo: <strong>15:30</strong>.</p>
                    <p class="mt-1">La comparación usa la hora local del dispositivo, igual que el resto de la app.</p>
                    <p class="mt-1">Zona horaria detectada: <strong>{{ deviceTimeZoneLabel }}</strong>.</p>
                    <p class="mt-1">Si el evento ocurre antes del umbral, Telegram no se envía para esta regla.</p>
                  </div>
                </div>

                <p v-if="getRuleTelegramThresholdError(rule)" class="text-xs text-red-600 font-semibold mt-2">
                  {{ getRuleTelegramThresholdError(rule) }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="p-4 border-t bg-gray-50 flex gap-3">
        <button @click="saveChanges" :disabled="isSaving" class="flex-1 bg-husky-blue text-white py-3 rounded-lg font-display text-lg shadow hover:bg-blue-600 transition disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center">
          <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
          {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';
import {
    appConfig,
    DEFAULT_TELEGRAM_THRESHOLD,
    TELEGRAM_DELIVERY_MODES,
    createDefaultTelegramDeliveryConfig,
    isValidTimeThreshold,
    normalizeConfig,
    saveConfig,
    validateConfig
} from '../services/configManager';
import { getDeviceTimeZoneLabel } from '../services/deliveryRules';

const emit = defineEmits(['close']);
const localConfig = ref(normalizeConfig(appConfig));
const defaultTemplateInput = ref(null);
const templateRefs = ref({});
const deviceTimeZoneLabel = getDeviceTimeZoneLabel();
const isSaving = ref(false);

onMounted(() => {
    localConfig.value = normalizeConfig(appConfig);
});

const ensureRuleTelegramDelivery = (rule) => {
    if (!rule.telegramDelivery) {
        rule.telegramDelivery = createDefaultTelegramDeliveryConfig();
    }

    if (!rule.telegramDelivery.timeBased) {
        rule.telegramDelivery.timeBased = {
            threshold: DEFAULT_TELEGRAM_THRESHOLD
        };
    }

    if (!rule.telegramDelivery.timeBased.threshold) {
        rule.telegramDelivery.timeBased.threshold = DEFAULT_TELEGRAM_THRESHOLD;
    }
};

const setRuleTelegramMode = (rule, mode) => {
    ensureRuleTelegramDelivery(rule);
    rule.telegramDelivery.mode = mode;

    if (
        mode === TELEGRAM_DELIVERY_MODES.TIME_BASED &&
        !rule.telegramDelivery.timeBased.threshold
    ) {
        rule.telegramDelivery.timeBased.threshold = DEFAULT_TELEGRAM_THRESHOLD;
    }
};

const getRuleTelegramThresholdError = (rule) => {
    ensureRuleTelegramDelivery(rule);

    if (rule.telegramDelivery.mode !== TELEGRAM_DELIVERY_MODES.TIME_BASED) {
        return '';
    }

    return isValidTimeThreshold(rule.telegramDelivery.timeBased.threshold)
        ? ''
        : 'Ingresa una hora válida en formato HH:MM de 24 horas.';
};

const insertVar = (variable, ruleIndex) => {
    if (ruleIndex === null) {
        const input = defaultTemplateInput.value;
        if (!input) return;

        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        localConfig.value.templates.default =
            localConfig.value.templates.default.substring(0, startPos) +
            variable +
            localConfig.value.templates.default.substring(endPos);
    } else {
        const input = templateRefs.value[ruleIndex];
        if (!input) return;

        const currentVal = localConfig.value.rules[ruleIndex].template || '';
        const startPos = input.selectionStart || currentVal.length;
        const endPos = input.selectionEnd || currentVal.length;

        localConfig.value.rules[ruleIndex].template =
            currentVal.substring(0, startPos) +
            variable +
            currentVal.substring(endPos);
    }
};

const addRule = () => {
    localConfig.value.rules.unshift({
        id: Date.now(),
        plantel: '',
        nivel: 'general',
        grado: 'general',
        chatId: '',
        template: '',
        telegramDelivery: createDefaultTelegramDeliveryConfig()
    });
};

const removeRule = (index) => {
    localConfig.value.rules.splice(index, 1);
};

const buildValidationHtml = (errors) => {
    return errors.map(error => `<div class="text-left">• ${error}</div>`).join('');
};

const saveChanges = async () => {
    const { valid, errors, normalizedConfig } = validateConfig(localConfig.value);

    if (!valid) {
        Swal.fire({
            icon: 'error',
            title: 'Revisa la configuración',
            html: buildValidationHtml(errors)
        });
        return;
    }

    isSaving.value = true;
    try {
        await saveConfig(normalizedConfig);
        localConfig.value = normalizedConfig;
        
        Swal.fire({
            icon: 'success',
            title: 'Sincronizado',
            text: 'Configuración guardada y replicada a todos los clientes.',
            timer: 2000,
            showConfirmButton: false
        });

        emit('close');
    } catch (error) {
        // Strict Error: Deny the save entirely if global sync fails.
        Swal.fire({
            icon: 'error',
            title: 'Error de Sincronización',
            text: error.message || 'No se pudo guardar globalmente.',
        });
    } finally {
        isSaving.value = false;
    }
};

const exportConfig = () => {
    const normalizedConfig = normalizeConfig(localConfig.value);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(normalizedConfig, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'husky-pass-config.json');
    dlAnchorElem.click();
};

const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            const { valid, errors, normalizedConfig } = validateConfig(parsed);

            if (!valid) {
                throw new Error(errors.join('\n'));
            }

            localConfig.value = normalizedConfig;

            Swal.fire(
                'Éxito',
                'Configuración cargada. Recuerda hacer clic en "Guardar Cambios".',
                'success'
            );
        } catch (err) {
            Swal.fire(
                'Error',
                err.message || 'El archivo JSON no es válido',
                'error'
            );
        } finally {
            event.target.value = '';
        }
    };

    reader.readAsText(file);
};
</script>

<style scoped>
.slide-in {
    animation: slideIn 0.3s ease-out forwards;
}
@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
</style>