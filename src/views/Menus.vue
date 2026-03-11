<template>
  <div class="menus-view position-relative py-4">
    <div v-if="loading" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75 z-3">
      <div class="spinner-border text-warning border-4" style="width: 3rem; height: 3rem;" role="status"></div>
    </div>

    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-4 rounded-4 shadow-sm text-dark bg-white border border-warning border-opacity-50">
      <div>
        <h2 class="fw-bold mb-1"><i class="fas fa-utensils text-warning me-2"></i> Menús del Día</h2>
        <p class="mb-0 text-muted">Gestiona el calendario del comedor y tu biblioteca de platillos reutilizables.</p>
      </div>
    </div>

    <!-- Top Tabs -->
    <ul class="nav nav-pills mb-4 bg-white p-2 rounded-pill shadow-sm border d-inline-flex flex-wrap">
      <li class="nav-item">
        <a class="nav-link rounded-pill fw-semibold px-4 cursor-pointer text-dark transition-all" 
           :class="{ 'bg-light border': activeTab !== 'schedule', 'active bg-warning text-dark shadow-sm border-warning': activeTab === 'schedule' }" 
           @click="activeTab = 'schedule'">
          <i class="fas fa-calendar-alt me-1"></i> Programación Diaria
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link rounded-pill fw-semibold px-4 cursor-pointer text-dark transition-all" 
           :class="{ 'bg-light border': activeTab !== 'library', 'active bg-warning text-dark shadow-sm border-warning': activeTab === 'library' }" 
           @click="activeTab = 'library'">
          <i class="fas fa-book-open me-1"></i> Biblioteca de Menús
        </a>
      </li>
    </ul>

    <!-- ============================================== -->
    <!-- TAB 1: PROGRAMACIÓN DIARIA (SCHEDULE)          -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'schedule'" class="fade-in">
      <div class="card border-0 rounded-4 shadow-sm mb-4 bg-white p-4 d-flex flex-row align-items-center gap-4">
        <div class="flex-grow-1" style="max-width: 250px;">
          <label class="form-label small fw-bold text-muted text-uppercase">Fecha a programar</label>
          <input type="date" class="form-control form-control-lg rounded-pill bg-light border-0 shadow-sm fw-bold" v-model="selectedDate" @change="loadDailySchedule">
        </div>
        <button class="btn btn-light rounded-circle shadow-sm border" @click="changeDate(-1)" title="Día Anterior"><i class="fas fa-chevron-left"></i></button>
        <button class="btn btn-light rounded-circle shadow-sm border" @click="changeDate(1)" title="Día Siguiente"><i class="fas fa-chevron-right"></i></button>
      </div>

      <div class="row g-4">
        <div class="col-md-4" v-for="mealType in ['DESAYUNO', 'COMIDA', 'CENA']" :key="mealType">
          <div class="card h-100 border-0 rounded-4 shadow-sm overflow-hidden" :class="scheduleMap[mealType] ? 'border-warning border-2' : 'border-light border-2'">
            
            <!-- Assigned State -->
            <div v-if="scheduleMap[mealType]">
              <div class="position-relative bg-light" style="height: 160px;">
                <img v-if="scheduleMap[mealType].image_url" :src="scheduleMap[mealType].image_url" class="w-100 h-100 object-fit-cover">
                <div v-else class="w-100 h-100 d-flex align-items-center justify-content-center bg-warning bg-opacity-25 text-warning">
                  <i class="fas fa-camera fa-3x opacity-50"></i>
                </div>
                <div class="position-absolute top-0 start-0 m-3">
                  <span class="badge bg-warning text-dark shadow-sm px-3 py-2 fw-bold rounded-pill"><i class="fas fa-clock me-1"></i> {{ mealType }}</span>
                </div>
              </div>
              <div class="card-body p-4 d-flex flex-column bg-white">
                <h5 class="fw-bold mb-2 text-dark">{{ scheduleMap[mealType].title }}</h5>
                <p class="text-muted small mb-4 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ scheduleMap[mealType].description || 'Sin descripción detallada.' }}
                </p>
                <div class="d-flex justify-content-between align-items-center border-top pt-3">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center gap-2">
                    <input class="form-check-input m-0" type="checkbox" role="switch" :checked="scheduleMap[mealType].is_active === 1" @change="toggleDailyActive(scheduleMap[mealType])" style="width: 2.2em; height: 1.1em; cursor: pointer;">
                    <span class="small fw-bold" :class="scheduleMap[mealType].is_active === 1 ? 'text-success' : 'text-muted'">{{ scheduleMap[mealType].is_active === 1 ? 'Activado' : 'Pausado' }}</span>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light text-primary rounded-circle border shadow-sm hover-scale" @click="openAssignModal(mealType, scheduleMap[mealType])"><i class="fas fa-exchange-alt"></i></button>
                    <button class="btn btn-sm btn-light text-danger rounded-circle border shadow-sm hover-scale" @click="removeDailyMenu(scheduleMap[mealType].id)"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="card-body p-5 text-center d-flex flex-column align-items-center justify-content-center h-100 bg-light">
              <span class="badge bg-light text-secondary border shadow-sm px-3 py-2 fw-bold rounded-pill mb-3"><i class="fas fa-clock me-1"></i> {{ mealType }}</span>
              <div class="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px;">
                <i class="fas fa-utensils fa-xl text-muted opacity-50"></i>
              </div>
              <h6 class="fw-bold text-dark mb-1">Sin Programar</h6>
              <p class="small text-muted mb-4">No hay menú asignado.</p>
              <button class="btn btn-warning rounded-pill fw-bold shadow-sm px-4 w-100 hover-scale" @click="openAssignModal(mealType, null)">
                Asignar Platillo
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 2: BIBLIOTECA DE MENÚS (LIBRARY)           -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'library'" class="fade-in">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="position-relative w-100" style="max-width: 400px;">
          <i class="fas fa-search position-absolute text-muted" style="left: 15px; top: 12px;"></i>
          <input type="text" class="form-control rounded-pill ps-5 bg-white border-0 shadow-sm py-2" placeholder="Buscar en la biblioteca..." v-model="searchLibrary">
        </div>
        <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm hover-scale" @click="openLibraryModal()">
          <i class="fas fa-plus me-1"></i> Nueva Receta
        </button>
      </div>

      <div class="row g-4" v-if="filteredLibrary.length > 0">
        <div class="col-md-4 col-lg-3" v-for="tpl in filteredLibrary" :key="tpl.id">
          <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-card bg-white">
            <div class="position-relative bg-light" style="height: 140px;">
              <img v-if="tpl.image_url" :src="tpl.image_url" class="w-100 h-100 object-fit-cover">
              <div v-else class="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-25">
                <i class="fas fa-image fa-3x"></i>
              </div>
            </div>
            <div class="card-body p-3 d-flex flex-column">
              <h6 class="fw-bold mb-1 text-dark">{{ tpl.title }}</h6>
              <p class="text-muted small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
                {{ tpl.description || 'Sin descripción.' }}
              </p>
              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <button class="btn btn-sm btn-light text-primary rounded-pill fw-semibold border shadow-sm" @click="openLibraryModal(tpl)">Editar</button>
                <button class="btn btn-sm btn-light text-danger rounded-circle border shadow-sm" @click="deleteLibraryTemplate(tpl.id)"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-5 bg-white rounded-4 shadow-sm border border-dashed">
        <i class="fas fa-book-open fa-3x text-muted opacity-25 mb-3"></i>
        <h5 class="fw-bold text-dark">Biblioteca Vacía</h5>
        <p class="text-muted">No tienes platillos guardados. Añade recetas para reutilizarlas en tu programación.</p>
      </div>
    </div>


    <!-- ============================================== -->
    <!-- MODAL: ASIGNAR MENÚ AL DÍA (SCHEDULE PICKER)   -->
    <!-- ============================================== -->
    <div v-if="showAssignModal" class="modal-backdrop fade show"></div>
    <div v-if="showAssignModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-light">
          <div class="modal-header border-bottom-0 pb-0 bg-white">
            <h5 class="modal-title fw-bold text-dark">
              Programar <span class="text-warning">{{ assignData.meal_type }}</span> el <span class="text-primary">{{ formatDate(assignData.meal_date) }}</span>
            </h5>
            <button type="button" class="btn-close" @click="showAssignModal = false"></button>
          </div>

          <div class="modal-body p-0 bg-white">
            <!-- Modal Tabs -->
            <div class="d-flex border-bottom text-center fw-bold">
              <div class="flex-fill p-3 cursor-pointer transition-all" :class="assignTab === 'library' ? 'bg-warning bg-opacity-10 text-dark border-bottom border-warning border-3' : 'text-muted hover-bg-light'" @click="assignTab = 'library'">
                Elegir de Biblioteca
              </div>
              <div class="flex-fill p-3 cursor-pointer transition-all" :class="assignTab === 'custom' ? 'bg-warning bg-opacity-10 text-dark border-bottom border-warning border-3' : 'text-muted hover-bg-light'" @click="assignTab = 'custom'">
                Crear Personalizado (Solo hoy)
              </div>
            </div>

            <!-- Panel: Library Picker -->
            <div v-if="assignTab === 'library'" class="p-4 bg-light" style="max-height: 60vh; overflow-y: auto;">
              <input type="text" class="form-control rounded-pill border-0 shadow-sm mb-4 py-2 px-4" placeholder="Buscar en biblioteca..." v-model="searchPicker">
              
              <div class="row g-3">
                <div class="col-md-6" v-for="tpl in filteredPickerLibrary" :key="tpl.id">
                  <div class="card h-100 border border-2 shadow-sm rounded-4 cursor-pointer hover-card transition-all"
                       :class="assignData.selectedTemplateId === tpl.id ? 'border-warning bg-warning bg-opacity-10' : 'border-transparent bg-white'"
                       @click="selectTemplateForAssignment(tpl)">
                    <div class="d-flex p-2 gap-3 h-100">
                      <img v-if="tpl.image_url" :src="tpl.image_url" class="rounded-3 object-fit-cover shadow-sm" style="width: 80px; height: 80px;">
                      <div v-else class="rounded-3 bg-light d-flex align-items-center justify-content-center text-muted" style="width: 80px; height: 80px;">
                        <i class="fas fa-image fa-lg"></i>
                      </div>
                      <div class="flex-grow-1 overflow-hidden py-1">
                        <h6 class="fw-bold mb-1 text-dark text-truncate">{{ tpl.title }}</h6>
                        <p class="small text-muted mb-0" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">{{ tpl.description }}</p>
                      </div>
                      <div class="d-flex align-items-center px-2">
                        <i class="fas fa-check-circle fa-xl transition-all" :class="assignData.selectedTemplateId === tpl.id ? 'text-warning' : 'text-muted opacity-25'"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="filteredPickerLibrary.length === 0" class="col-12 text-center py-4 text-muted">
                  No se encontraron recetas. Intenta otra búsqueda o crea uno nuevo.
                </div>
              </div>
            </div>

            <!-- Panel: Custom One-off Editor -->
            <div v-if="assignTab === 'custom'" class="p-4 bg-light" style="max-height: 60vh; overflow-y: auto;">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Título del Plato</label>
                <input type="text" class="form-control rounded-pill border-0 shadow-sm" v-model="assignData.title" placeholder="Ej: Pechuga empanizada...">
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Descripción</label>
                <textarea class="form-control rounded-4 border-0 shadow-sm" v-model="assignData.description" rows="3" placeholder="Detalles nutricionales..."></textarea>
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted d-block">Fotografía (Opcional)</label>
                <div class="border-2 border-dashed rounded-4 p-3 text-center bg-white cursor-pointer hover-card" @click="triggerFileInput('assign')">
                  <input type="file" id="assignFileInput" class="d-none" accept="image/*" @change="handleFileSelect($event, 'assign')" />
                  <div v-if="assignData.image_url" class="position-relative">
                    <img :src="assignData.image_url" class="img-fluid rounded-3 object-fit-cover shadow-sm" style="max-height: 150px; width: 100%;" />
                    <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow" @click.stop="assignData.image_url = ''"><i class="fas fa-trash"></i></button>
                  </div>
                  <div v-else-if="uploadingImage" class="py-3"><div class="spinner-border text-warning spinner-border-sm"></div></div>
                  <div v-else class="py-3 text-muted">
                    <i class="fas fa-camera fa-2x mb-2 text-warning"></i><br><small>Haz clic para subir foto</small>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer border-top-0 bg-white">
            <div class="form-check form-switch me-auto d-flex align-items-center gap-2">
              <input class="form-check-input m-0" type="checkbox" role="switch" v-model="assignData.is_active" style="width: 2.2em; height: 1.1em; cursor: pointer;">
              <label class="form-check-label small fw-bold text-dark mt-1">Activo (Enviar a Padres)</label>
            </div>
            <button class="btn btn-light rounded-pill px-4 fw-bold border shadow-sm" @click="showAssignModal = false">Cancelar</button>
            <button class="btn btn-warning rounded-pill px-4 fw-bold shadow-sm text-dark hover-scale" @click="saveDailyAssignment" :disabled="!isAssignReady || uploadingImage">
              Guardar Asignación
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- ============================================== -->
    <!-- MODAL: CREAR/EDITAR EN BIBLIOTECA              -->
    <!-- ============================================== -->
    <div v-if="showLibraryModal" class="modal-backdrop fade show"></div>
    <div v-if="showLibraryModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-light">
          <div class="modal-header border-bottom-0 pb-0 bg-white">
            <h5 class="modal-title fw-bold text-dark"><i class="fas fa-book-open text-warning me-2"></i> {{ libraryData.id ? 'Editar Receta' : 'Nueva Receta' }}</h5>
            <button type="button" class="btn-close" @click="showLibraryModal = false"></button>
          </div>
          
          <div class="modal-body p-4 bg-light pt-3">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Título de la Receta</label>
              <input type="text" class="form-control rounded-pill border-0 shadow-sm px-4 py-2" v-model="libraryData.title" placeholder="Ej: Plato Fuerte...">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Descripción Base</label>
              <textarea class="form-control rounded-4 border-0 shadow-sm p-3" v-model="libraryData.description" rows="3"></textarea>
            </div>
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted d-block">Fotografía por Defecto</label>
              <div class="border-2 border-dashed rounded-4 p-3 text-center bg-white cursor-pointer hover-card" @click="triggerFileInput('library')">
                <input type="file" id="libraryFileInput" class="d-none" accept="image/*" @change="handleFileSelect($event, 'library')" />
                <div v-if="libraryData.image_url" class="position-relative">
                  <img :src="libraryData.image_url" class="img-fluid rounded-3 object-fit-cover shadow-sm" style="max-height: 180px; width: 100%;" />
                  <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow" @click.stop="libraryData.image_url = ''"><i class="fas fa-trash"></i></button>
                </div>
                <div v-else-if="uploadingImage" class="py-4"><div class="spinner-border text-warning"></div></div>
                <div v-else class="py-4 text-muted">
                  <i class="fas fa-cloud-upload-alt fa-2x mb-2 text-warning"></i><br><small>Haz clic para explorar foto</small>
                </div>
              </div>
            </div>
            <button class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-sm hover-scale" @click="saveLibraryTemplate" :disabled="!libraryData.title || uploadingImage">
              Guardar en Biblioteca
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
const activeTab = ref('schedule')

// Schedule State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const dailyMenus = ref([])

// Library State
const library = ref([])
const searchLibrary = ref('')

// Modal States
const showAssignModal = ref(false)
const assignTab = ref('library') // 'library' | 'custom'
const assignData = ref({ id: null, meal_date: '', meal_type: '', title: '', description: '', image_url: '', is_active: true, selectedTemplateId: null })
const searchPicker = ref('')

const showLibraryModal = ref(false)
const libraryData = ref({ id: null, title: '', description: '', image_url: '' })

const uploadingImage = ref(false)

onMounted(() => {
  loadDailySchedule()
  loadLibrary()
})

// --- DATA FETCHING ---
const loadDailySchedule = async () => {
  loading.value = true
  try {
    const res = await axios.get(`https://matricula.casitaapps.com/api/meal-menus?date=${selectedDate.value}`)
    dailyMenus.value = res.data
  } catch (e) {
    logger.error('Error fetching daily menus', e)
  } finally {
    loading.value = false
  }
}

const loadLibrary = async () => {
  try {
    const res = await axios.get('https://matricula.casitaapps.com/api/menu-library')
    library.value = res.data
  } catch (e) {
    logger.error('Error fetching library', e)
  }
}

// --- COMPUTED ---
const scheduleMap = computed(() => {
  const map = {}
  dailyMenus.value.forEach(m => map[m.meal_type] = m)
  return map
})

const filteredLibrary = computed(() => {
  if (!searchLibrary.value) return library.value
  const q = searchLibrary.value.toLowerCase()
  return library.value.filter(t => t.title.toLowerCase().includes(q))
})

const filteredPickerLibrary = computed(() => {
  if (!searchPicker.value) return library.value
  const q = searchPicker.value.toLowerCase()
  return library.value.filter(t => t.title.toLowerCase().includes(q))
})

const isAssignReady = computed(() => {
  if (assignTab.value === 'library') return !!assignData.value.selectedTemplateId
  return !!assignData.value.title
})

// --- ACTIONS: SCHEDULE ---
const changeDate = (days) => {
  const d = new Date(selectedDate.value + 'T12:00:00')
  d.setDate(d.getDate() + days)
  selectedDate.value = d.toISOString().split('T')[0]
  loadDailySchedule()
}

const openAssignModal = (mealType, existingMenu) => {
  searchPicker.value = ''
  assignTab.value = 'library'
  if (existingMenu) {
    assignTab.value = 'custom' // Default to custom if editing existing
    assignData.value = { ...existingMenu, selectedTemplateId: null, is_active: !!existingMenu.is_active }
  } else {
    assignData.value = { id: null, meal_date: selectedDate.value, meal_type: mealType, title: '', description: '', image_url: '', is_active: true, selectedTemplateId: null }
  }
  showAssignModal.value = true
}

const selectTemplateForAssignment = (tpl) => {
  assignData.value.selectedTemplateId = tpl.id
  // Automatically fill custom data behind the scenes just in case they switch tabs
  assignData.value.title = tpl.title
  assignData.value.description = tpl.description
  assignData.value.image_url = tpl.image_url
}

const saveDailyAssignment = async () => {
  loading.value = true
  try {
    const payload = {
      id: assignData.value.id,
      meal_date: assignData.value.meal_date,
      meal_type: assignData.value.meal_type,
      title: assignData.value.title,
      description: assignData.value.description,
      image_url: assignData.value.image_url,
      is_active: assignData.value.is_active
    }
    
    if (assignTab.value === 'library' && assignData.value.selectedTemplateId) {
      const tpl = library.value.find(t => t.id === assignData.value.selectedTemplateId)
      payload.title = tpl.title
      payload.description = tpl.description
      payload.image_url = tpl.image_url
    }

    if (payload.id) {
      await axios.put(`https://matricula.casitaapps.com/api/meal-menus/${payload.id}`, payload)
    } else {
      await axios.post('https://matricula.casitaapps.com/api/meal-menus', payload)
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Asignación guardada', showConfirmButton: false, timer: 2000 })
    showAssignModal.value = false
    loadDailySchedule()
  } catch (e) {
    Swal.fire('Error', 'Fallo al guardar.', 'error')
  } finally {
    loading.value = false
  }
}

const toggleDailyActive = async (menu) => {
  try {
    const payload = { ...menu, is_active: menu.is_active ? 0 : 1 }
    await axios.put(`https://matricula.casitaapps.com/api/meal-menus/${menu.id}`, payload)
    loadDailySchedule()
  } catch(e) {
    logger.error("Toggle failed", e)
  }
}

const removeDailyMenu = async (id) => {
  const conf = await Swal.fire({ title: '¿Quitar del calendario?', icon: 'warning', showCancelButton: true })
  if (!conf.isConfirmed) return
  loading.value = true
  try {
    await axios.delete(`https://matricula.casitaapps.com/api/meal-menus/${id}`)
    loadDailySchedule()
  } finally { loading.value = false }
}

// --- ACTIONS: LIBRARY ---
const openLibraryModal = (tpl = null) => {
  if (tpl) {
    libraryData.value = { ...tpl }
  } else {
    libraryData.value = { id: null, title: '', description: '', image_url: '' }
  }
  showLibraryModal.value = true
}

const saveLibraryTemplate = async () => {
  loading.value = true
  try {
    if (libraryData.value.id) {
      await axios.put(`https://matricula.casitaapps.com/api/menu-library/${libraryData.value.id}`, libraryData.value)
    } else {
      await axios.post('https://matricula.casitaapps.com/api/menu-library', libraryData.value)
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Receta Guardada', showConfirmButton: false, timer: 2000 })
    showLibraryModal.value = false
    loadLibrary()
  } catch (e) {
    Swal.fire('Error', 'Fallo al guardar en la biblioteca.', 'error')
  } finally {
    loading.value = false
  }
}

const deleteLibraryTemplate = async (id) => {
  const conf = await Swal.fire({ title: '¿Borrar receta?', text: 'Esto no afectará los menús que ya fueron programados con esta receta en el calendario.', icon: 'warning', showCancelButton: true })
  if (!conf.isConfirmed) return
  loading.value = true
  try {
    await axios.delete(`https://matricula.casitaapps.com/api/menu-library/${id}`)
    loadLibrary()
  } finally { loading.value = false }
}

// --- UPLOAD HANDLING ---
const triggerFileInput = (context) => {
  if (uploadingImage.value) return
  const id = context === 'library' ? 'libraryFileInput' : 'assignFileInput'
  document.getElementById(id).click()
}

const handleFileSelect = async (e, context) => {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return Swal.fire('Error', 'Solo imágenes', 'warning')
  
  uploadingImage.value = true
  try {
    const form = new FormData()
    form.append('image', file)
    const res = await axios.post('https://matricula.casitaapps.com/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }})
    
    if (context === 'library') libraryData.value.image_url = res.data.url
    else assignData.value.image_url = res.data.url
  } catch (err) {
    Swal.fire('Error', 'Subida fallida', 'error')
  } finally {
    uploadingImage.value = false
    e.target.value = ''
  }
}

// --- UTILS ---
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<style scoped>
.hover-card { transition: transform 0.2s, box-shadow 0.2s; }
.hover-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1)!important; }
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }
.hover-bg-light:hover { background-color: #f8fafc; }
.transition-all { transition: all 0.2s ease; }
.cursor-pointer { cursor: pointer; }
.border-transparent { border-color: transparent; }

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>