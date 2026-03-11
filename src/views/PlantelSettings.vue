<template>
  <div class="settings-view position-relative py-4">
    <div v-if="loading" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75 z-3">
      <div class="spinner-border text-secondary border-4" style="width: 3rem; height: 3rem;" role="status"></div>
    </div>

    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 p-4 rounded-4 shadow-sm text-dark bg-white border border-secondary border-opacity-25">
      <div>
        <h2 class="fw-bold mb-1"><i class="fas fa-cogs text-secondary me-2"></i> Configuración de Planteles</h2>
        <p class="mb-0 text-muted">Ajusta identidades de remitente para notificaciones de padres y estados del servicio.</p>
      </div>
      <div class="d-flex gap-2 mt-3 mt-md-0">
        <button class="btn btn-outline-secondary rounded-pill px-4 fw-bold shadow-sm bg-white hover-scale" @click="exportConfigs">
          <i class="fas fa-download me-1"></i> JSON
        </button>
        <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm hover-scale" @click="triggerImport">
          <i class="fas fa-upload me-1"></i> Importar
        </button>
        <input type="file" ref="importInput" class="d-none" accept=".json" @change="handleImport">
      </div>
    </div>

    <!-- Grid -->
    <div class="row g-4">
      <div class="col-md-6 col-xl-4" v-for="plantel in allowedPlanteles" :key="plantel">
        <div class="card h-100 border-0 shadow-sm rounded-4 hover-card overflow-hidden" :class="{'border-2 border-primary': editingPlantel === plantel}">
          
          <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
            <h4 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <div class="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="fas fa-building"></i>
              </div>
              {{ plantel }}
            </h4>
            
            <!-- Status Badge logic -->
            <span v-if="!isConfigured(plantel)" class="badge bg-light text-warning border border-warning rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-1">
               <i class="fas fa-exclamation-triangle"></i> Incompleto
            </span>
            <span v-else-if="!getConfig(plantel).isActive" class="badge bg-light text-danger border border-danger rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-1">
               <i class="fas fa-pause-circle"></i> Pausado
            </span>
            <span v-else class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-1">
               <i class="fas fa-check-circle"></i> Activo
            </span>
          </div>

          <div class="card-body p-4 bg-light bg-opacity-50">
            <div class="mb-4">
              <span class="d-block small text-muted fw-bold text-uppercase mb-1" style="letter-spacing: 0.5px;">Identidad de Envío (Remitente)</span>
              <div class="bg-white border rounded-3 p-3 shadow-sm">
                <div class="fw-bold text-dark mb-1">{{ getConfig(plantel).senderName || '---' }}</div>
                <div class="text-muted small font-monospace"><i class="fas fa-envelope text-secondary me-1"></i> {{ getConfig(plantel).senderEmail || '---' }}</div>
              </div>
            </div>
            <div>
              <span class="d-block small text-muted fw-bold text-uppercase mb-1" style="letter-spacing: 0.5px;">Responsable</span>
              <span class="badge bg-white text-secondary border px-3 py-2 shadow-sm text-dark">{{ getConfig(plantel).adminName || 'No asignado' }}</span>
            </div>
          </div>
          
          <div class="card-footer bg-white border-top-0 p-3">
             <button class="btn btn-light text-primary w-100 rounded-pill fw-bold shadow-sm border hover-scale" @click="editConfig(plantel)">
              <i class="fas fa-cog me-1"></i> Configurar Plantel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingPlantel" class="modal-backdrop fade show"></div>
    <div v-if="editingPlantel" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          <div class="modal-header border-bottom-0 bg-white pb-2 pt-4 px-4">
            <h4 class="modal-title fw-bold text-dark d-flex align-items-center gap-2">
              <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="fas fa-sliders-h"></i>
              </div>
              {{ editingPlantel }}
            </h4>
            <button type="button" class="btn-close" @click="editingPlantel = null"></button>
          </div>
          <div class="modal-body p-4 bg-white">
            
            <div class="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4 mb-4 text-dark small">
              <strong>Nota:</strong> Los correos a padres se enviarán utilizando este nombre y correo. Si el estado está pausado, la asistencia del comedor se guardará pero no se enviarán notificaciones automáticas para esta sede.
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold text-muted text-uppercase">Nombre Visible del Remitente</label>
              <input type="text" class="form-control form-control-lg rounded-pill border shadow-sm px-4" v-model="editForm.senderName" placeholder="Ej: Servicios Alimenticios PREET">
            </div>
            
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted text-uppercase">Correo de Salida (Reply-To)</label>
              <input type="email" class="form-control form-control-lg rounded-pill border shadow-sm px-4" v-model="editForm.senderEmail" placeholder="Ej: comedor@colegio.edu.mx">
            </div>
            
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted text-uppercase">Admin. Responsable (Uso interno)</label>
              <input type="text" class="form-control form-control-lg rounded-pill border shadow-sm px-4" v-model="editForm.adminName" placeholder="Nombre del directivo">
            </div>

            <div class="form-check form-switch mb-4 bg-light p-3 rounded-4 shadow-sm border border-light d-flex align-items-center">
              <input class="form-check-input ms-0 me-3 mt-0" type="checkbox" role="switch" id="activeSwitch" v-model="editForm.isActive" style="width: 2.5em; height: 1.25em; cursor: pointer;">
              <label class="form-check-label fw-bold text-dark mb-0 cursor-pointer" for="activeSwitch">Activar envíos de correo en esta sede</label>
            </div>

            <button class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-sm hover-scale" @click="saveConfig" :disabled="!isEditValid">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { logger } from '../utils/logger'

const loading = ref(false)
const configs = ref({})
const allowedPlanteles = ["PREET", "PREEM", "PT", "PM", "ST", "SM", "ISM", "DM", "CM", "CT"]

const editingPlantel = ref(null)
const editForm = ref({ senderName: '', senderEmail: '', adminName: '', isActive: true })
const importInput = ref(null)

onMounted(() => { loadConfigs() })

const loadConfigs = async () => {
  loading.value = true
  try {
    const res = await axios.get('https://matricula.casitaapps.com/api/plantel-configs')
    configs.value = res.data || {}
  } catch (e) {
    logger.error('Failed to load configs', e)
  } finally {
    loading.value = false
  }
}

const getConfig = (plantel) => configs.value[plantel] || {}

const isConfigured = (plantel) => {
  const c = getConfig(plantel)
  return !!(c.senderName && c.senderEmail)
}

const editConfig = (plantel) => {
  editingPlantel.value = plantel
  const c = getConfig(plantel)
  editForm.value = { 
    senderName: c.senderName || '', 
    senderEmail: c.senderEmail || '', 
    adminName: c.adminName || '',
    isActive: c.isActive !== false // defaults to true if not explicitly false
  }
}

const isEditValid = computed(() => {
  return editForm.value.senderName.trim().length > 0 && editForm.value.senderEmail.trim().length > 0
})

const saveConfig = async () => {
  loading.value = true
  try {
    const payload = { [editingPlantel.value]: { ...editForm.value } }
    await axios.post('https://matricula.casitaapps.com/api/plantel-configs/import', payload)
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Configuración Aplicada', showConfirmButton: false, timer: 2000 })
    editingPlantel.value = null
    await loadConfigs()
  } catch (e) {
    logger.error('Error saving config', e)
    Swal.fire('Error', 'No se pudo guardar la configuración.', 'error')
  } finally {
    loading.value = false
  }
}

const exportConfigs = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs.value, null, 2))
  const dlAnchorElem = document.createElement('a')
  dlAnchorElem.setAttribute("href", dataStr)
  dlAnchorElem.setAttribute("download", "planteles_config.json")
  dlAnchorElem.click()
}

const triggerImport = () => { importInput.value.click() }

const handleImport = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const importedData = JSON.parse(event.target.result)
      loading.value = true
      await axios.post('https://matricula.casitaapps.com/api/plantel-configs/import', importedData)
      Swal.fire('Éxito', 'Configuraciones restauradas exitosamente.', 'success')
      loadConfigs()
    } catch (err) {
      Swal.fire('Error', 'El archivo JSON es inválido o está corrupto.', 'error')
    } finally {
      loading.value = false
      e.target.value = ''
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.hover-card { transition: transform 0.2s, box-shadow 0.2s; }
.hover-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.08)!important; }
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }
.cursor-pointer { cursor: pointer; }
</style>