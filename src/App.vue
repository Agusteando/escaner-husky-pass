<template>
  <div class="min-h-screen relative flex flex-col">
    <!-- Header Connectivity Status -->
    <div :class="['fixed top-2 right-2 z-50 p-2 rounded-lg font-bold text-sm shadow transition-all duration-300', isOnline ? 'bg-green-100 text-green-700' : 'bg-red-500 text-white']">
      <i :class="isOnline ? 'fas fa-globe' : 'fas fa-wifi text-white'"></i>
      <span v-if="!isOnline" class="ml-2">Sin Conexión</span>
    </div>
    
    <!-- Data Usage Label -->
    <div :class="['fixed bottom-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg text-sm shadow transition-opacity duration-500', showDataUsage ? 'opacity-100' : 'opacity-0 pointer-events-none']">
      Datos usados: {{ formattedDataUsage }}
    </div>

    <!-- Main Content -->
    <ScannerUi @openSettings="showSettings = true" />

    <!-- Settings Modal -->
    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ScannerUi from './components/ScannerUi.vue';
import SettingsView from './components/SettingsView.vue';
import { loadConfig } from './services/configManager';

const isOnline = ref(navigator.onLine);
const showSettings = ref(false);
const showDataUsage = ref(false);
const totalDataConsumed = ref(0);
let dataUsageTimeout = null;

const formattedDataUsage = computed(() => {
    const dataInMB = (totalDataConsumed.value / (1024 * 1024)).toFixed(2);
    const dataInKB = (totalDataConsumed.value / 1024).toFixed(2);
    return dataInMB > 1 ? `${dataInMB} MB` : `${dataInKB} KB`;
});

const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
};

const handleDataUsage = (event) => {
    totalDataConsumed.value = event.detail;
    showDataUsage.value = true;
    clearTimeout(dataUsageTimeout);
    dataUsageTimeout = setTimeout(() => {
        showDataUsage.value = false;
    }, 3000);
};

onMounted(async () => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('data-usage-updated', handleDataUsage);
    await loadConfig();
});

onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
    window.removeEventListener('data-usage-updated', handleDataUsage);
});
</script>