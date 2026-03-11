<template>
  <div class="flex-1 flex flex-col">
    <!-- Door Selection (Hidden until scanning) -->
    <div v-show="isScanning" class="w-full flex">
      <button v-for="(door, i) in doors" :key="i"
              @click="selectDoor(i)"
              :class="['flex-1 py-3 text-white font-bold transition-colors', selectedDoor === i ? 'bg-husky-blue' : 'bg-gray-400']">
        {{ door.label }}
      </button>
    </div>

    <!-- Video Header -->
    <div v-show="isScanning" class="bg-husky-gray text-white text-center py-4 font-bold tracking-wider font-display text-lg">
      {{ headerText }}
    </div>

    <!-- Main View (Buttons when not scanning) -->
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

    <!-- Video Container -->
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
      <!-- Processing Label Overlay -->
      <div v-if="processingLabel" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg font-bold z-20 transition-all duration-300">
        {{ processingLabel }}
      </div>
    </div>

    <!-- Controls while scanning -->
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

const emit = defineEmits(['openSettings']);

const isScanning = ref(false);
const scanType = ref('');
const videoEl = ref(null);
let scannerInstance = null;
const noSleep = new NoSleep();

const selectedDoor = ref(0);
const doors = [
    { label: 'Default', value: 0 },
    { label: 'Puerta 1', value: 1 },
    { label: 'Puerta 2', value: 2 },
    { label: 'Puerta 3', value: 3 },
    { label: 'Puerta 4', value: 4 }
];

const headerText = computed(() => {
    if (scanType.value === 'entrada') return 'ENTRADA';
    if (scanType.value === 'salida') return 'SALIDA';
    return 'EVENTO';
});

let scanQueue = new Set();
let processedIds = new Set();
let processedMatriculas = new Set();
let conRetardos = [];
let deudorCheckController = null;
const processingLabel = ref('');

const checkPasswordAndOpenSettings = async () => {
    const actualPwd = import.meta.env.PWD;
    
    if (!actualPwd) {
        // Fallback for local development if not provided
        emit('openSettings');
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

const selectDoor = (index) => {
    selectedDoor.value = index;
    document.cookie = `puerta=${index}; path=/;`;
};

onMounted(() => {
    const cookies = document.cookie.split("; ");
    const puertaCookie = cookies.find(c => c.startsWith('puerta='));
    if (puertaCookie) selectedDoor.value = parseInt(puertaCookie.split('=')[1]) || 0;
    
    fetchTardosData().then(data => conRetardos = data).catch(console.error);
});

onUnmounted(() => {
    if (scannerInstance) scannerInstance.destroy();
});

const startScanner = async (type) => {
    scanType.value = type;
    isScanning.value = true;
    noSleep.enable();
    
    if (!scannerInstance) {
        scannerInstance = new QrScanner(videoEl.value, result => handleScan(result), {
            preferredCamera: 'environment',
            highlightCodeOutline: false,
            maxScansPerSecond: 2
        });
    }
    
    try {
        await scannerInstance.start();
    } catch (e) {
        console.error('Camera error', e);
        Swal.fire('Error', 'No se pudo acceder a la cámara.', 'error');
        stopScanner();
    }
};

const stopScanner = () => {
    isScanning.value = false;
    if (scannerInstance) scannerInstance.stop();
    noSleep.disable();
};

const restartScannerWhenNoSwal = () => {
    const checkConditions = setInterval(() => {
        if (!Swal.isVisible() && isScanning.value) {
            scannerInstance.start();
            clearInterval(checkConditions);
        }
    }, 1000);
};

let inThrottle = false;
const handleScan = (result) => {
    if (inThrottle) return;
    inThrottle = true;
    setTimeout(() => inThrottle = false, 2000);

    const [, , baseURL, route, id = ''] = result.data.split('/');
    
    if (processedIds.has(id)) {
        showLabel(navigator.onLine ? '¡Listo!' : 'Sin conectividad');
        return;
    }
    
    if (navigator.onLine) processedIds.add(id);
    else showLabel('Sin conectividad');

    scannerInstance.pause();

    if (!id || route === 'husky' || baseURL !== "admin.casitaiedis.edu.mx") {
        Swal.fire({
            icon: 'error',
            title: 'Escaneo inválido',
            text: 'Este QR no es válido o no pertenece a este sistema.'
        }).then(restartScannerWhenNoSwal);
        return;
    }

    if (!scanQueue.has(id)) {
        scanQueue.add(id);
        processScanQueue();
    }
};

const showLabel = (text) => {
    processingLabel.value = text;
    setTimeout(() => processingLabel.value = '', 2000);
};

const processScanQueue = async () => {
    if (scanQueue.size > 0) {
        for (let id of scanQueue) {
            scanQueue.delete(id);
            await processSingleId(id);
        }
    }
};

const processSingleId = async (id) => {
    try {
        const studentData = await fetchStudentDetails(id);
        if (!studentData || !studentData[0]) throw new Error('Data no válida');
        
        const ack = await fallbackInsertScan({ data: [{ ss_id: id, type: scanType.value, puerta: selectedDoor.value }], table: 'acceso' });
        
        if (ack.id == '0') {
            Swal.fire({ icon: 'warning', toast: true, title: 'Ya se escaneó', timer: 2000, position: 'top-end', showConfirmButton: false });
            restartScannerWhenNoSwal();
            return;
        }

        await handleStudentDataDisplay(studentData);
    } catch (e) {
        if (e.message === 'Código QR inválido') {
            Swal.fire({ icon: 'error', title: 'Anulado', text: 'El QR fue anulado. Reimprimir.' }).then(restartScannerWhenNoSwal);
        } else {
            console.error(e);
            setTimeout(restartScannerWhenNoSwal, 2000);
        }
    }
};

const handleStudentDataDisplay = async (data) => {
    const { matricula, fullnameP, fotoP, fullnameA, nivelEduA, gradoA, grupoA, fotoA, parentesco, plantel } = data[0];

    if (processedMatriculas.has(matricula)) return;
    processedMatriculas.add(matricula);

    if (scanType.value === 'entrada') {
        checkDeudorAndToast(matricula);
    }

    const studentWithTardy = conRetardos.find(s => s.matricula === matricula);
    const now = new Date();
    const isPrimaria = nivelEduA.toLowerCase() === 'primaria' && (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() >= 0));
    const isSecundaria = nivelEduA.toLowerCase() === 'secundaria' && now.getHours() >= 7;
    
    if ((isPrimaria || isSecundaria) && studentWithTardy && scanType.value === 'entrada') {
        await handleRetardosFlow(studentWithTardy, nivelEduA, gradoA, grupoA, matricula, plantel);
    } else {
        await showSuccessFlow(data[0]);
    }
};

const checkDeudorAndToast = async (matricula) => {
    if (deudorCheckController) deudorCheckController.abort();
    deudorCheckController = new AbortController();
    try {
        const isDeudor = await checkDeudor(matricula, deudorCheckController.signal);
        if (isDeudor && !Swal.isVisible()) {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'warning',
                title: 'Pasar a administración', showConfirmButton: false, timer: 2200,
                customClass: { popup: 'deudor-toast' }, backdrop: false
            });
        }
    } catch (e) {}
};

const handleRetardosFlow = async (studentWithTardy, nivelEduA, gradoA, grupoA, matricula, plantel) => {
    const res = await Swal.fire({
        title: `El alumno ${studentWithTardy.student_fullname} tiene ${studentWithTardy.TardyCount} retardos.`,
        showCancelButton: true, confirmButtonText: 'Ver retardos', cancelButtonText: 'Cancelar'
    });
    if (!res.isConfirmed) {
        restartScannerWhenNoSwal();
        return;
    }
    
    try {
        const details = await fetchDetailsByMatricula(matricula);
        const ids = details.map(d => d.id);
        let tableHtml = `<table class="w-full border mt-2"><thead><tr class="bg-gray-100"><th>Fecha</th><th>Hora</th></tr></thead><tbody>`;
        details.forEach(d => tableHtml += `<tr><td class="border p-2">${new Date(d.date).toLocaleDateString()}</td><td class="border p-2">${d.time}</td></tr>`);
        tableHtml += `</tbody></table>`;
        
        const suspendRes = await Swal.fire({
            title: 'Detalles de Retardos', html: tableHtml, showCancelButton: true, confirmButtonText: 'Suspender',
        });

        if (suspendRes.isConfirmed) {
            await applySuspension(ids, matricula);
            sendEmail({
                to: `dir.${nivelEduA.toLowerCase().substring(0,3)}.${plantel.toLowerCase()}@casitaiedis.edu.mx`,
                subject: `Suspensión por Retardos - ${studentWithTardy.student_fullname}`,
                message: `El alumno acumuló ${studentWithTardy.TardyCount} retardos.<br>${tableHtml}`
            });
        }
    } catch (e) {
        Swal.fire('Error', 'No se pudieron obtener detalles', 'error');
    }
    restartScannerWhenNoSwal();
};

const showSuccessFlow = async (studentInfo) => {
    const { fullnameP, fotoP, fullnameA, nivelEduA, gradoA, grupoA, fotoA, parentesco, plantel } = studentInfo;
    const colors = { 'preescolar': '#E94B4D', 'primaria': '#FDC53D', 'secundaria': '#5AA6DC', 'preparatoria': '#514F9D' };
    const color = colors[nivelEduA.toLowerCase()] || '#8EC152';

    await Swal.fire({
        icon: 'success',
        title: 'Escaneo exitoso',
        html: `
            <div class="flex flex-col items-center justify-center">
              <div class="px-6 py-1 rounded-full text-white font-bold mb-3 uppercase shadow-md" style="background-color: ${color};">
                ${nivelEduA}
              </div>
              <div class="bg-husky-gray text-white w-full rounded-lg py-2 mb-3">
                <p class="m-0 font-display text-lg">${fullnameA}</p>
                <small>${gradoA} ${grupoA}</small>
              </div>
              <p class="mb-1">Autorizado: <strong>${fullnameP}</strong> <small>(${parentesco})</small></p>
              <div class="flex justify-center gap-4 mt-2">
                <img src="${fotoA || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-full object-cover border border-gray-200">
                <img src="${fotoP || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-full object-cover border border-gray-200">
              </div>
            </div>
        `,
        confirmButtonText: '<i class="fas fa-sync"></i> OK',
        confirmButtonColor: '#3085D6',
        customClass: 'my-swal'
    });

    if (scanType.value !== 'entrada') {
        sendMessage(fullnameA, fullnameP, gradoA, grupoA, plantel, nivelEduA, selectedDoor.value);
    }
    restartScannerWhenNoSwal();
};

const sendMessage = (fullnameA, fullnameP, grado, grupo, plantel, nivel, puerta) => {
    const matchedRules = getMatchedRules(plantel, nivel, grado);
    if (matchedRules.length === 0) return;

    const emojiNumbers = { 0: '', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣' };
    let puertaText = puerta === 3 ? ' POR CARRUSEL' : (puerta === 4 ? ' PEATONAL' : '');
    
    const uniquePayloads = new Map();

    matchedRules.forEach(rule => {
        let template = (rule.template && rule.template.trim() !== '') ? rule.template : appConfig.templates.default;
        
        let msg = template
                 .replace(/{fullnameP}/g, fullnameP)
                 .replace(/{fullnameA}/g, fullnameA)
                 .replace(/{grado}/g, grado)
                 .replace(/{grupo}/g, grupo)
                 .replace(/{plantel}/g, plantel)
                 .replace(/{nivel}/g, nivel)
                 .replace(/{puertaEmoji}/g, emojiNumbers[puerta] || '')
                 .replace(/{puertaText}/g, puertaText);
                 
        // Setting it in a Map ensures deduplication per ChatID
        uniquePayloads.set(rule.chatId, msg);
    });

    uniquePayloads.forEach((msg, chatId) => {
        const payload = { chatId: [String(chatId)], message: msg };
        if (/@g\.us$/i.test(chatId)) sendWhatsAppMessage(payload).catch(console.error);
        else sendTelegramMessage(payload).catch(console.error);
    });
};

const promptMatricula = async () => {
    scannerInstance.pause();
    const { value: matricula } = await Swal.fire({
        title: 'Ingrese la matrícula', input: 'text', inputAttributes: { maxlength: 6 },
        showCancelButton: true, confirmButtonText: `Buscar`
    });

    if (matricula && matricula.length === 6) {
        const personas = await fetchPersonasAutorizadas(matricula);
        if (personas.length > 0) {
            const htmlContent = personas.map(p => `
              <div class="m-2 text-center p-2 border rounded cursor-pointer hover:bg-gray-100" id="btn-manual-${p.persona_id}">
                <img src="${p.fotoP}" class="w-16 h-16 rounded-full mx-auto" />
                <p class="text-xs font-bold mt-1">${p.fullnameP}</p>
              </div>
            `).join('');
            
            Swal.fire({
                title: 'Seleccione Persona Autorizada', html: `<div class="grid grid-cols-2 gap-2">${htmlContent}</div>`, showConfirmButton: false,
                didRender: () => {
                    personas.forEach(p => {
                        document.getElementById(`btn-manual-${p.persona_id}`).addEventListener('click', () => {
                            Swal.close();
                            processSingleId(p.persona_id);
                        });
                    });
                }
            });
        } else {
            Swal.fire('Error', 'No se encontraron personas autorizadas.', 'error').then(restartScannerWhenNoSwal);
        }
    } else {
        restartScannerWhenNoSwal();
    }
};
</script>