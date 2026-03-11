import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Global fetch interceptor to track data usage
let totalDataConsumed = 0;
const DATA_USAGE_KEY = 'dataUsage';
const LAST_UPDATE_KEY = 'lastUpdate';

const loadDataUsage = () => {
    const storedDataUsage = localStorage.getItem(DATA_USAGE_KEY);
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    const currentDate = new Date().toDateString().trim();
    if (storedDataUsage && lastUpdate) {
        if (currentDate === lastUpdate.trim()) {
            totalDataConsumed = parseFloat(storedDataUsage);
        } else {
            totalDataConsumed = 0;
            saveDataUsage();
        }
    }
};

const saveDataUsage = () => {
    const currentDate = new Date().toDateString().trim();
    localStorage.setItem(DATA_USAGE_KEY, totalDataConsumed.toString());
    localStorage.setItem(LAST_UPDATE_KEY, currentDate);
};

loadDataUsage();

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();
    const dataSize = await clonedResponse.blob().then(blob => blob.size);
    totalDataConsumed += dataSize;
    saveDataUsage();
    window.dispatchEvent(new CustomEvent('data-usage-updated', { detail: totalDataConsumed }));
    return response;
};

createApp(App).mount('#app')