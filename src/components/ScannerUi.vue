<template>
  <div class="flex-1 flex flex-col relative">
    <div class="absolute top-2 right-2 text-[10px] text-gray-400/80 font-mono z-30 pointer-events-none select-none">
      {{ shortCommitHash }}
    </div>

    <div v-show="isScanning" class="w-full flex">
      <button v-for="(door, i) in doors" :key="i"
              @click="selectDoor(i)"
              :class="['flex-1 py-3 text-white font-bold transition-colors', selectedDoor === i ? 'bg-husky-blue' : 'bg-gray-400']">
        {{ door.label }}
      </button>
    </div>

    <div v-show="isScanning" class="bg-husky-gray text-white text-center py-4 font-bold tracking-wider font-display text-lg">
      {{ headerText }}
    </div>

    <div v-show="!isScanning" class="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
      <div class="text-center mb-8">
        <img src="/IECS-IEDIS.png" alt="IECS-IEDIS" class="h-28 mx-auto mb-4 drop-shadow-md">
        <h4 class="font-display text-xl text-husky-gray">ESCÁNER HUSKY PASS</h4>
        <h6 class="text-gray-500 font-semibold mt-1">Ciclo escolar 2025 - 2026</h6>
      </div>

      <div class="w-full max-w-sm space-y-4">
        <button @click="startScanner('entrada')" class="w-full bg-husky-blue text-white py-4 rounded-xl font-display text-xl shadow-lg hover:bg-blue-600 transition">
          Entrada
        </button>
        <button @click="startScanner('salida')" class="w-full bg-husky-blue text-white py-4 rounded-xl font-display text-xl shadow-lg hover:bg-blue-600 transition">
          Salida
        </button>
        <button @click="startScanner('evento')" class="w-full bg-husky-purple text-white py-4 rounded-xl font-display text-xl shadow-lg hover:bg-purple-700 transition">
          Prueba / Eventos
        </button>
      </div>

      <button @click="checkPasswordAndOpenSettings" class="absolute top-4 left-4 text-husky-gray hover:text-husky-blue text-2xl transition">
        <i class="fas fa-cog"></i>
      </button>
    </div>

    <div v-show="isScanning" class="relative w-full aspect-[3/4] bg-black overflow-hidden flex-1">
      <video ref="videoEl" class="absolute inset-0 w-full h-full object-cover"></video>
      <div class="absolute inset-0 pointer-events-none z-10 flex flex-col">
        <div class="h-[15%] bg-black/40 w-full"></div>
        <div class="flex-1 flex">
          <div class="w-[15%] bg-black/40 h-full"></div>
          <div class="flex-1 border-2 border-white/50 relative">
             <div class="absolute inset-0 border-2 border-white animate-pulse"></div>
          </div>
          <div class="w-[15%] bg-black/40 h-full"></div>
        </div>
        <div class="h-[15%] bg-black/40 w-full"></div>
      </div>
      <div v-if="processingLabel" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg font-bold z-20 transition-all duration-300">
        {{ processingLabel }}
      </div>
    </div>

    <div v-show="isScanning" class="bg-white p-4 space-y-3 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div class="flex gap-3 max-w-md mx-auto">
        <button @click="stopScanner" class="flex-1 bg-gray-500 text-white py-3 rounded-lg font-display shadow hover:bg-gray-600 transition flex items-center justify-center gap-2">
          <i class="fas fa-arrow-left"></i> Regresar
        </button>
        <button @click="promptMatricula" class="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-display hover:bg-gray-50 transition">
          <i class="fas fa-keyboard mr-1"></i> Manual
        </button>
      </div>
      <div class="text-center">
        <a href="/consulta.html" class="text-husky-blue underline font-semibold text-sm">Consulta de Registros</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import QrScanner from 'qr-scanner';
import Swal from 'sweetalert2';
import NoSleep from 'nosleep.js';
import {
    fetchStudentDetails, checkDeudor, fetchTardosData,
    fetchDetailsByMatricula, applySuspension, sendEmail,
    fallbackInsertScan, fetchPersonasAutorizadas,
    sendWhatsAppMessage, sendTelegramMessage
} from '../services/api';
import { getMatchedRules, appConfig } from '../services/configManager';
import { evaluateTelegramRuleDelivery } from '../services/deliveryRules';

const emit = defineEmits(['openSettings']);

// ─── refs ────────────────────────────────────────────────────────────────────
const isScanning = ref(false);
const scanType   = ref('');
const videoEl    = ref(null);
const processingLabel = ref('');

// ─── scanner state ────────────────────────────────────────────────────────────
// One instance per session; destroyed and recreated on each startScanner call
// (mirrors how script_2.js calls `new QrScanner(...)` inside startScanner).
let scannerInstance = null;
const noSleep = new NoSleep();

// Per-session duplicate-scan guards; cleared on each startScanner call.
let processedIds       = new Set();
let processedMatriculas = new Set();
let scanQueue          = new Set();

// Throttle flag – mirrors script_2.js's throttle(scanSuccess, 2000)
let inThrottle = false;

// Restart poller handle
let restartIntervalId  = null;

// Deudor abort controller
let deudorCheckController = null;

// ─── runtime data ─────────────────────────────────────────────────────────────
let conRetardos = [];

// ─── door / UI state ──────────────────────────────────────────────────────────
const selectedDoor = ref(0);
const doors = [
    { label: 'Default', value: 0 },
    { label: 'Puerta 1', value: 1 },
    { label: 'Puerta 2', value: 2 },
    { label: 'Puerta 3', value: 3 },
    { label: 'Puerta 4', value: 4 }
];

// ─── computed ─────────────────────────────────────────────────────────────────
const shortCommitHash = computed(() => {
    const configuredHash =
        import.meta.env.VITE_COMMIT_HASH ||
        import.meta.env.VITE_GIT_COMMIT ||
        (typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : '') ||
        globalThis?.__APP_COMMIT_HASH__ ||
        'dev-local';
    return String(configuredHash).trim().slice(0, 10);
});

const headerText = computed(() => {
    if (scanType.value === 'entrada') return 'ENTRADA';
    if (scanType.value === 'salida')  return 'SALIDA';
    return 'EVENTO';
});

// ─── lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    const cookies    = document.cookie.split('; ');
    const puertaCookie = cookies.find(c => c.startsWith('puerta='));
    if (puertaCookie) selectedDoor.value = parseInt(puertaCookie.split('=')[1], 10) || 0;

    fetchTardosData().then(data => { conRetardos = data; }).catch(console.error);
});

onUnmounted(() => {
    _clearRestartPoller();
    if (scannerInstance) {
        scannerInstance.destroy();
        scannerInstance = null;
    }
});

// ─── settings / password ─────────────────────────────────────────────────────
const getConfiguredSettingsPassword = () => {
    const candidates = [
        import.meta.env.VITE_SETTINGS_PASSWORD,
        import.meta.env.VITE_CONFIG_PASSWORD,
        import.meta.env.VITE_PWD
    ];
    const found = candidates.find(v => typeof v === 'string' && v.trim() !== '');
    return found ? found.trim() : '';
};

const checkPasswordAndOpenSettings = async () => {
    const actualPwd = getConfiguredSettingsPassword();

    if (!actualPwd) {
        if (import.meta.env.DEV) { emit('openSettings'); return; }
        await Swal.fire({
            icon: 'error',
            title: 'Configuración incompleta',
            text: 'No se encontró la contraseña de configuración. Define VITE_SETTINGS_PASSWORD en Vercel y vuelve a desplegar.'
        });
        return;
    }

    const { value: password } = await Swal.fire({
        title: 'Acceso Restringido',
        input: 'password',
        inputLabel: 'Ingrese la contraseña de configuración',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Entrar',
        cancelButtonText: 'Cancelar'
    });

    if (password === actualPwd) {
        emit('openSettings');
    } else if (password !== undefined) {
        Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
};

// ─── door selection ───────────────────────────────────────────────────────────
const selectDoor = (index) => {
    selectedDoor.value = index;
    document.cookie = `puerta=${index}; path=/;`;
};

// ─── scanner lifecycle ────────────────────────────────────────────────────────
const startScanner = (type) => {
    scanType.value   = type;
    isScanning.value = true;
    noSleep.enable();

    processedIds.clear();
    processedMatriculas.clear();
    scanQueue.clear();
    processingLabel.value = '';

    _clearRestartPoller();

    if (scannerInstance) {
        try { scannerInstance.destroy(); } catch (_) {}
        scannerInstance = null;
    }

    scannerInstance = new QrScanner(videoEl.value, result => _throttledScanSuccess(result), {
        preferredCamera: 'environment',
        highlightCodeOutline: true,
        maxScansPerSecond: 2
    });

    _startWithRetry(scannerInstance, 5);
};

const stopScanner = () => {
    isScanning.value = false;
    processingLabel.value = '';
    _clearRestartPoller();

    if (scannerInstance) {
        try { scannerInstance.stop(); } catch (_) {}
    }

    noSleep.disable();
};

const _startWithRetry = (instance, maxAttempts, attempt = 1) => {
    if (!instance || !isScanning.value) return;

    instance.start()
        .then(() => {
            console.log(`Scanner started (attempt ${attempt})`);
        })
        .catch(err => {
            console.error(`Scanner start error (attempt ${attempt}):`, err);
            if (attempt < maxAttempts) {
                setTimeout(() => _startWithRetry(instance, maxAttempts, attempt + 1), 1000);
            } else {
                console.error('Max start attempts reached.');
                Swal.fire('Error', 'No se pudo acceder a la cámara.', 'error');
                stopScanner();
            }
        });
};

const _clearRestartPoller = () => {
    if (restartIntervalId) {
        clearInterval(restartIntervalId);
        restartIntervalId = null;
    }
};

const restartScannerWhenNoSwal = () => {
    _clearRestartPoller();

    restartIntervalId = setInterval(() => {
        if (!isScanning.value || !scannerInstance) {
            _clearRestartPoller();
            return;
        }

        if (Swal.isVisible()) return;

        _clearRestartPoller();
        scannerInstance.start().catch(err => {
            console.warn('restartScannerWhenNoSwal: scanner.start() failed:', err);
        });
    }, 1000);
};

// ─── scan throttle ────────────────────────────────────────────────────────────
const _throttledScanSuccess = (result) => {
    if (inThrottle) return;
    inThrottle = true;
    setTimeout(() => { inThrottle = false; }, 2000);
    _scanSuccess(result);
};

// ─── scan success handler ─────────────────────────────────────────────────────
const _scanSuccess = (result) => {
    const [, , baseURL, route, id = ''] = result.data.split('/');

    if (processedIds.has(id)) {
        _showLabel(navigator.onLine ? '¡Listo!' : 'Sin conectividad, acércate al Router');
        return;
    }

    if (navigator.onLine) {
        processedIds.add(id);
    } else {
        _showLabel('Sin conectividad, acércate al Router');
        return;
    }

    scannerInstance.pause();

    if (!id) {
        Swal.fire({
            icon: 'error',
            title: 'Escaneo inválido',
            html: 'El QR no coincide con algún registro vigente. Si se trata de un error, asegúrate de que no haya reflejos, sombras u obstrucciones.',
            position: 'top'
        }).then(() => restartScannerWhenNoSwal());
        return;
    }

    if (route === 'husky' || baseURL !== 'admin.casitaiedis.edu.mx') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Este QR no debe escanearse con este escáner'
        }).then(() => restartScannerWhenNoSwal());
        return;
    }

    if (!scanQueue.has(id)) {
        scanQueue.add(id);
        _processScanQueue();
    }

    restartScannerWhenNoSwal();
};

// ─── queue processing ─────────────────────────────────────────────────────────
const _processScanQueue = async () => {
    for (const id of [...scanQueue]) {
        scanQueue.delete(id);
        await _sendAjaxRequest(id);
    }
};

const _sendAjaxRequest = async (id) => {
    try {
        const data = await fetchStudentDetails(id);

        if (!data || !data[0]) throw new Error('Data no válida');

        await _handleStudentDataDisplay(data);

        void fallbackInsertScan({
            data: [{ ss_id: id, type: scanType.value, puerta: selectedDoor.value }],
            table: 'acceso'
        }).catch(console.error);

    } catch (err) {
        console.error('sendAjaxRequest error:', err);
        if (err.message === 'Código QR inválido') {
            await Swal.fire({
                icon: 'error',
                title: 'Esta persona autorizada fue anulada - Reimprimir',
                text: 'Su QR fue anulado, hay que volverlo a generar desde la plataforma e imprimirlo nuevamente.'
            });
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error al procesar escaneo',
                text: err?.message || 'Inténtalo de nuevo.',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
        restartScannerWhenNoSwal();
    }
};

// ─── student data display ─────────────────────────────────────────────────────
const _handleStudentDataDisplay = async (data) => {
    const { matricula, nivelEduA, gradoA, grupoA, plantel } = data[0];

    if (processedMatriculas.has(matricula)) {
        console.log(`Matricula ${matricula} already processed.`);
        restartScannerWhenNoSwal();
        return;
    }
    processedMatriculas.add(matricula);

    if (scanType.value === 'entrada') {
        void _checkDeudorAndToast(matricula);
    }

    const studentWithTardy = conRetardos.find(s => s.matricula === matricula);
    const now   = new Date();
    const level = String(nivelEduA || '').toLowerCase();
    const isPrimaria  = level === 'primaria'   && (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() >= 0));
    const isSecundaria = level === 'secundaria' && now.getHours() >= 7;

    if ((isPrimaria || isSecundaria) && studentWithTardy && scanType.value === 'entrada') {
        await _handleRetardosFlow(studentWithTardy, nivelEduA, gradoA, grupoA, matricula, plantel);
    } else {
        _showSuccessModal(data[0]);
    }
};

// ─── success modal ────────────────────────────────────────────────────────────
const PHOTO_MODAL_TIMER_MS = 3000;
const PHOTO_PLACEHOLDER    = 'https://via.placeholder.com/150?text=Sin+foto';

const _loadIntoImg = (domImg, src) => {
    if (!src || !src.trim()) { domImg.src = PHOTO_PLACEHOLDER; return; }
    const loader = new Image();
    loader.onload = () => { domImg.src = src; domImg.style.filter = ''; };
    loader.onerror = () => { domImg.src = PHOTO_PLACEHOLDER; domImg.style.filter = ''; };
    loader.src = src;
};

const _showSuccessModal = (studentInfo) => {
    const { fullnameP, fotoP, fullnameA, nivelEduA, gradoA, grupoA, fotoA, parentesco, plantel } = studentInfo;

    const colors = {
        'guarderia': '#8EC152', 'guardería': '#8EC152',
        'preescolar': '#E94B4D', 'primaria': '#FDC53D',
        'secundaria': '#5AA6DC', 'preparatoria': '#514F9D'
    };
    const color = colors[String(nivelEduA || '').toLowerCase()] || '#8EC152';

    const spinner = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='20' fill='%23eee'/%3E%3Cpath d='M25 5a20 20 0 0 1 0 40' stroke='%23aaa' stroke-width='4' fill='none'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='0.8s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E`;

    void Swal.fire({
        icon: 'success',
        title: 'Escaneo exitoso',
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <div style="background-color:${color};border-radius:999px;padding:4px 20px;margin-bottom:12px;display:inline-flex;align-items:center;">
                <span style="color:#fff;font-weight:bold;text-transform:uppercase;">${nivelEduA}</span>
              </div>
              <div style="background:#585858;color:#fff;width:100%;border-radius:6px;padding:8px 12px;margin-bottom:12px;text-align:center;">
                <p style="margin:0;font-size:1rem;font-weight:bold;">${fullnameA}</p>
                <small>${gradoA} ${grupoA}</small>
              </div>
              <p style="margin-top:8px;margin-bottom:4px;">Persona autorizada:<br><strong>${fullnameP}</strong></p>
              <small>(${parentesco})</small>
              <div style="display:flex;justify-content:center;gap:12px;margin-top:12px;">
                <img id="swal-foto-alumno" src="${spinner}" alt="${fullnameA}"
                     style="width:120px;height:120px;object-fit:cover;border-radius:4px;filter:blur(2px);transition:filter 0.3s;">
                <img id="swal-foto-persona" src="${spinner}" alt="${fullnameP}"
                     style="width:120px;height:120px;object-fit:cover;border-radius:4px;filter:blur(2px);transition:filter 0.3s;">
              </div>
            </div>
        `,
        showConfirmButton: false,
        timer: PHOTO_MODAL_TIMER_MS,
        timerProgressBar: true,
        customClass: 'my-swal',
        didOpen: () => {
            _loadIntoImg(document.getElementById('swal-foto-alumno'), fotoA);
            _loadIntoImg(document.getElementById('swal-foto-persona'), fotoP);

            Swal.getPopup()?.addEventListener('touchstart', () => Swal.close(), { once: true, passive: true });
        }
    }).then(() => {
        if (scannerInstance && isScanning.value) {
            scannerInstance.start().catch(() => {});
        }
        restartScannerWhenNoSwal();
    });

    if (scanType.value !== 'entrada') {
        void _sendMessage(fullnameA, gradoA, grupoA, plantel, nivelEduA, selectedDoor.value);
    }
};

// ─── deudor toast ─────────────────────────────────────────────────────────────
let _deudorController = null;

const _checkDeudorAndToast = async (matricula) => {
    try { if (_deudorController) _deudorController.abort(); } catch (_) {}
    _deudorController = new AbortController();

    try {
        const isDeudor = await checkDeudor(matricula, _deudorController.signal);
        if (isDeudor === true && !Swal.isVisible()) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Pasar a administración',
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
                backdrop: false,
                allowOutsideClick: true,
                allowEscapeKey: true
            });
        }
    } catch (e) {
        if (e?.name !== 'AbortError') console.warn('deudor check failed:', e);
    }
};

// ─── retardos flow ────────────────────────────────────────────────────────────
const _handleRetardosFlow = async (studentWithTardy, nivelEduA, gradoA, grupoA, matricula, plantel) => {
    const res = await Swal.fire({
        title: `El alumno ${studentWithTardy.student_fullname} tiene ${studentWithTardy.TardyCount} retardos. ¿Qué acción desea tomar?`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Ver retardos',
        denyButtonText: 'Cancelar'
    });

    if (!res.isConfirmed) {
        restartScannerWhenNoSwal();
        return;
    }

    try {
        const details = await fetchDetailsByMatricula(matricula);
        const ids = details.map(d => d.id);

        let tableHtml = '<table class="w-full border mt-2"><thead><tr class="bg-gray-100"><th>Fecha</th><th>Hora</th></tr></thead><tbody>';
        details.forEach(d => {
            tableHtml += `<tr><td class="border p-2">${new Date(d.date).toLocaleDateString()}</td><td class="border p-2">${d.time}</td></tr>`;
        });
        tableHtml += '</tbody></table>';

        const suspendRes = await Swal.fire({
            title: 'Detalles de los retardos',
            html: tableHtml,
            confirmButtonText: 'Continuar para suspender',
            showCancelButton: true
        });

        if (suspendRes.isConfirmed) {
            await applySuspension(ids, matricula);
            void sendEmail({
                to: `dir.${nivelEduA.toLowerCase().substring(0, 3)}.${plantel.toLowerCase()}@casitaiedis.edu.mx`,
                subject: `Suspensión por Retardos - ${studentWithTardy.student_fullname}`,
                message: `El alumno acumuló ${studentWithTardy.TardyCount} retardos.<br>${tableHtml}`
            });
        }
    } catch (e) {
        Swal.fire('Error', 'No se pudieron obtener los detalles de los retardos.', 'error');
    }

    restartScannerWhenNoSwal();
};

// ─── label overlay ────────────────────────────────────────────────────────────
const _showLabel = (text) => {
    processingLabel.value = text;
    setTimeout(() => { processingLabel.value = ''; }, 3000);
};

// ─── Telegram / WhatsApp notification ────────────────────────────────────────
const _sendMessage = async (fullnameA, grado, grupo, plantel, nivel, puerta) => {
    try {
        const matchedRules = getMatchedRules(plantel, nivel, grado);
        if (!matchedRules || matchedRules.length === 0) return;

        const emojiNumbers = { 0: '', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣' };
        const puertaEmoji = emojiNumbers[puerta] || '';
        const puertaText  = puerta === 3 ? ' **POR CARRUSEL**' : (puerta === 4 ? ' **PEATONAL**' : '');

        const uniquePayloads = new Map();

        matchedRules.forEach(rule => {
            const template = (rule.template && rule.template.trim() !== '')
                ? rule.template
                : appConfig.templates?.default || '**{fullnameA}** {grado} {grupo} {puertaEmoji}🚪{puertaText}';

            const msg = template
                .replace(/{fullnameA}/g, fullnameA)
                .replace(/{grado}/g, grado)
                .replace(/{grupo}/g, grupo)
                .replace(/{plantel}/g, plantel)
                .replace(/{nivel}/g, nivel)
                .replace(/{puertaEmoji}/g, puertaEmoji)
                .replace(/{puertaText}/g, puertaText);

            // Store the full rule alongside the message so we can apply
            // delivery rules (e.g. time-based gating) when sending.
            uniquePayloads.set(String(rule.chatId), { message: msg, rule });
        });

        uniquePayloads.forEach(({ message, rule }, chatId) => {
            const id = String(chatId ?? '').trim();
            if (!id) return;
            const payload = { chatId: [id], message };
            if (/@g\.us$/i.test(id)) {
                // WhatsApp — always send immediately; time-based rules only apply to Telegram.
                void sendWhatsAppMessage(payload).catch(console.error);
            } else {
                // Telegram — evaluate delivery rules before sending.
                const delivery = evaluateTelegramRuleDelivery(rule);
                if (delivery.shouldSend) {
                    void sendTelegramMessage(payload).catch(console.error);
                } else {
                    console.log(
                        `[Telegram] Skipped chatId ${id} — before threshold ${delivery.threshold}` +
                        ` (now ${delivery.currentMinutes} min, need ${delivery.thresholdMinutes} min)`
                    );
                }
            }
        });
    } catch (err) {
        console.error('sendMessage error:', err);
    }
};

// ─── manual matricula entry ───────────────────────────────────────────────────
const promptMatricula = async () => {
    if (scannerInstance) scannerInstance.pause();

    const { value: matricula } = await Swal.fire({
        title: 'Ingrese la matrícula',
        input: 'text',
        inputAttributes: { maxlength: 6 },
        showCancelButton: true,
        confirmButtonText: `Enviar ${scanType.value}`
    });

    if (matricula && matricula.length === 6) {
        const personas = await fetchPersonasAutorizadas(matricula);
        if (personas.length > 0) {
            const htmlContent = personas.map(p => `
              <div class="m-2 text-center p-2 border rounded cursor-pointer hover:bg-gray-100" id="btn-manual-${p.persona_id}">
                <img src="${p.fotoP}" class="w-16 h-16 rounded-full mx-auto"
                     onerror="this.src='https://via.placeholder.com/64?text=?'" />
                <p class="text-xs font-bold mt-1">${p.fullnameP}</p>
              </div>
            `).join('');

            Swal.fire({
                title: 'Seleccione una persona autorizada',
                html: `<div style="display:flex;flex-wrap:wrap;justify-content:center;">${htmlContent}</div>`,
                showConfirmButton: false,
                didRender: () => {
                    personas.forEach(p => {
                        document.getElementById(`btn-manual-${p.persona_id}`)?.addEventListener('click', () => {
                            Swal.close();
                            void _sendAjaxRequest(p.persona_id);
                        });
                    });
                }
            }).then(() => restartScannerWhenNoSwal());
        } else {
            Swal.fire('No se encontraron personas autorizadas para esta matrícula.')
                .then(() => restartScannerWhenNoSwal());
        }
    } else {
        restartScannerWhenNoSwal();
    }
};
</script>