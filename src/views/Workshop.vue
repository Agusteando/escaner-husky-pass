<template>
  <div class="workshop-view position-relative py-3" :class="{'pb-5 mb-5': selectedForAttendance.length > 0}">
    
    <!-- Loader Minimal (Non-blocking usually) -->
    <div v-if="loading && !currentWorkshop" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75 z-top">
      <div class="spinner-border text-danger border-4" style="width: 3rem; height: 3rem;" role="status"></div>
    </div>

    <!-- Background Sync Indicator -->
    <div v-if="syncing" class="position-fixed top-0 start-50 translate-middle-x mt-3 bg-dark text-white rounded-pill px-4 py-2 shadow-lg z-top animation-fade" style="opacity: 0.95;">
      <i class="fas fa-sync-alt fa-spin me-2 text-info"></i> Sincronizando...
    </div>

    <!-- ========================================== -->
    <!-- 1. SELECCIÓN DE TALLERES (INICIO)          -->
    <!-- ========================================== -->
    <div v-if="!currentWorkshop" class="fade-in container">
      <div class="text-center mb-5">
        <div class="bg-danger bg-opacity-10 text-danger mx-auto rounded-circle d-flex align-items-center justify-content-center mb-4" style="width: 80px; height: 80px;">
          <i class="fas fa-clipboard-user fa-2x"></i>
        </div>
        <h2 class="fw-bold text-dark mb-2">Mis Talleres</h2>
        <p class="text-muted fs-5">Selecciona un taller para tomar asistencia y gestionar grupos.</p>
      </div>
      
      <div class="row justify-content-center g-4 mb-5">
        <div class="col-12 col-md-4 col-lg-3" v-for="(shortcut, idx) in savedShortcuts" :key="idx">
          <div class="card h-100 border-0 shadow-sm hover-card cursor-pointer rounded-4 position-relative overflow-hidden" @click="openWorkshop(shortcut)">
            <div class="card-body p-4 d-flex flex-column align-items-center text-center">
              <button class="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-2 rounded-circle shadow-sm" @click.stop="removeShortcut(idx)" title="Quitar taller">
                <i class="fas fa-times"></i>
              </button>
              <div class="mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm" 
                   :style="{ background: getPlantelTheme(shortcut.plantel).gradient, width: '70px', height: '70px' }">
                <i class="fas fa-2x" :class="getServiceIcon(shortcut.servicio)"></i>
              </div>
              <h4 class="fw-bold text-dark mb-1">{{ shortcut.servicio }}</h4>
              <span class="badge bg-light text-secondary border rounded-pill px-3 py-2 mt-1">{{ shortcut.plantel }}</span>
            </div>
          </div>
        </div>
        
        <!-- Add Shortcut Button -->
        <div class="col-12 col-md-4 col-lg-3">
          <div class="card h-100 border-2 border-dashed shadow-none hover-card cursor-pointer rounded-4 bg-transparent d-flex align-items-center justify-content-center min-h-200" @click="showAddModal = true" style="min-height: 200px;">
            <div class="text-center text-muted">
              <div class="bg-white shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3 transition-transform" style="width: 60px; height: 60px;">
                <i class="fas fa-plus fa-xl text-danger"></i>
              </div>
              <h5 class="fw-bold mb-0">Agregar Taller</h5>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. VISTA DEL TALLER (ASISTENCIA Y GRUPOS)  -->
    <!-- ========================================== -->
    <div v-else class="fade-in">
      <!-- Header del Taller -->
      <div class="d-flex justify-content-between align-items-center mb-4 p-4 rounded-4 shadow-sm text-white flex-wrap gap-3" :style="{ background: getPlantelTheme(currentWorkshop.plantel).gradient }">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-light bg-opacity-25 text-white border-0 rounded-circle shadow-sm hover-scale" style="width: 45px; height: 45px;" @click="closeWorkshop">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <h3 class="fw-bold mb-0 lh-1">{{ currentWorkshop.servicio }}</h3>
            <span class="opacity-75 d-block mt-2 small"><i class="fas fa-map-marker-alt me-1"></i> {{ currentWorkshop.plantel }} &bull; {{ studentsList.length }} Alumnos</span>
          </div>
        </div>
      </div>

      <!-- Menú del Día Banner (Only for Meal Services) -->
      <div v-if="isMealService" class="mb-4 fade-in">
        <div v-if="loadingMenu" class="d-flex justify-content-center p-3">
          <div class="spinner-border text-warning spinner-border-sm" role="status"></div>
        </div>
        <div v-else>
          <!-- Assigned Menu Banner -->
          <div v-if="todayMenu" class="d-flex align-items-center justify-content-between p-3 bg-white rounded-4 shadow-sm border border-warning border-opacity-50 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <img v-if="todayMenu.image_url" :src="todayMenu.image_url" class="rounded-3 object-fit-cover shadow-sm" style="width: 70px; height: 70px;">
              <div v-else class="rounded-3 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center border border-warning border-opacity-25" style="width: 70px; height: 70px;">
                <i class="fas fa-utensils fa-2x"></i>
              </div>
              <div>
                <span class="badge bg-warning text-dark mb-1 shadow-sm"><i class="fas fa-star me-1"></i> Menú de Hoy ({{ currentWorkshop.servicio }})</span>
                <h6 class="fw-bold mb-1 text-dark">{{ todayMenu.title }}</h6>
                <small class="text-muted d-block" style="max-width: 400px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ todayMenu.description || 'Sin detalles' }}</small>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-light text-warning fw-bold shadow-sm rounded-pill hover-scale border" @click="openInlineMenuEditor(todayMenu)">
                <i class="fas fa-exchange-alt me-1"></i> Cambiar Plato
              </button>
            </div>
          </div>
          
          <!-- Empty Menu Banner -->
          <div v-else class="d-flex align-items-center justify-content-between p-4 bg-warning bg-opacity-10 rounded-4 shadow-sm border border-warning border-opacity-25 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3 text-dark">
              <div class="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm text-warning" style="width: 50px; height: 50px;">
                <i class="fas fa-exclamation-triangle fa-lg"></i>
              </div>
              <div>
                <h6 class="fw-bold mb-0">No hay menú asignado para hoy</h6>
                <small class="opacity-75">Asigna un menú para que los padres reciban el correo al tomar asistencia.</small>
              </div>
            </div>
            <button class="btn btn-warning fw-bold shadow-sm rounded-pill text-dark hover-scale px-4" @click="openInlineMenuEditor(null)">
              <i class="fas fa-plus me-1"></i> Asignar de Biblioteca
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-4 shadow-sm border p-4">
        <!-- NAVEGACIÓN DE GRUPOS (Horizontal Scroll) -->
        <div class="d-flex gap-2 overflow-auto py-2 custom-scrollbar mb-4 border-bottom pb-3 align-items-center">
          <button class="btn rounded-pill fw-bold border shadow-sm px-4 flex-shrink-0 transition-all" 
                  :class="activeGrupo === null ? 'btn-dark text-white' : 'btn-white text-muted'" 
                  @click="activeGrupo = null">
            <i class="fas fa-users me-2"></i> Todos
          </button>
          
          <button v-for="grp in grupos" :key="grp.id"
                  class="btn rounded-pill fw-bold border shadow-sm px-4 flex-shrink-0 transition-all d-flex align-items-center gap-2"
                  :style="{
                    backgroundColor: activeGrupo === grp.id ? grp.color : '#fff',
                    color: activeGrupo === grp.id ? '#fff' : grp.color,
                    borderColor: grp.color
                  }"
                  @click="activeGrupo = grp.id">
            <i class="fas fa-folder"></i> 
            {{ grp.name }} 
            <span class="badge rounded-pill ms-1" :style="{backgroundColor: activeGrupo === grp.id ? 'rgba(255,255,255,0.2)' : grp.color, color: '#fff'}">
              {{ grp.students.length }}
            </span>
          </button>

          <button class="btn btn-light text-primary rounded-pill fw-bold border border-dashed px-4 flex-shrink-0 shadow-sm hover-scale" @click="promptCreateGrupo(false)">
            <i class="fas fa-plus me-1"></i> Nuevo Grupo
          </button>
        </div>

        <!-- Barra de herramientas (Búsqueda, Filtros y Edición de Grupo) -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          
          <div class="position-relative" style="width: 100%; max-width: 350px;">
            <i class="fas fa-search position-absolute text-muted" style="left: 15px; top: 12px;"></i>
            <input type="text" class="form-control rounded-pill ps-5 bg-light border-0 py-2" placeholder="Buscar alumno..." v-model="searchText">
          </div>
          
          <div class="d-flex gap-2 flex-wrap align-items-center">
            <!-- Botón para eliminar el grupo actual si estamos dentro de uno -->
            <button v-if="activeGrupo" class="btn btn-outline-danger rounded-pill fw-semibold px-4 animation-fade" @click="removeGrupo(activeGrupo)">
              <i class="fas fa-trash-alt me-1"></i> Eliminar Grupo
            </button>

            <button class="btn btn-outline-secondary rounded-pill fw-semibold px-4" @click="toggleSortMode" :class="{'active bg-secondary text-white border-secondary': sortMode}">
              <i class="fas fa-sort me-1"></i> {{ sortMode ? 'Finalizar Orden' : 'Reordenar' }}
            </button>
            <button class="btn btn-outline-primary rounded-pill fw-semibold px-4" @click="manualRefresh">
              <i class="fas fa-sync-alt me-1"></i> Sincronizar
            </button>
            <button class="btn btn-outline-success rounded-pill fw-semibold px-4" @click="toggleSelectAll">
              <i class="fas" :class="allSelected ? 'fa-check-square' : 'fa-square'"></i> {{ allSelected ? 'Deseleccionar' : 'Seleccionar Todo' }}
            </button>
          </div>
        </div>

        <!-- Estado Vacío -->
        <div v-if="filteredStudents.length === 0" class="text-center py-5 text-muted bg-light rounded-4 border border-dashed my-4">
          <i class="fas fa-user-slash fa-3x mb-3 opacity-25"></i>
          <h5 class="fw-bold">No hay alumnos en esta vista.</h5>
          <p class="mb-0 small" v-if="activeGrupo">Selecciona alumnos en la pestaña "Todos" y agrúpalos aquí.</p>
        </div>

        <!-- Cuadrícula de Estudiantes -->
        <div class="row g-3">
          <div class="col-6 col-md-4 col-lg-3 col-xl-2" v-for="(stu, index) in filteredStudents" :key="stu.matricula">
            <div class="card h-100 attendance-card border-2 rounded-4 position-relative" 
                 :class="{'border-success bg-success bg-opacity-10 shadow-sm': hasAttendedToday(stu.matricula), 'border-primary shadow': selectedForAttendance.includes(stu.matricula), 'bg-light border-transparent': !hasAttendedToday(stu.matricula) && !selectedForAttendance.includes(stu.matricula)}">
              
              <!-- Nuevo Estudiante Indicator -->
              <div v-if="isNewStudent(timelineData[stu.matricula]?.started_at)" class="position-absolute top-0 start-0 m-2 z-2" style="pointer-events: none;">
                <span class="badge bg-success shadow-sm rounded-pill border border-white pulse-animation"><i class="fas fa-star text-warning me-1"></i> NUEVO</span>
              </div>

              <!-- Indicadores de Grupo Visual (Puntos de colores) -->
              <div v-if="!activeGrupo && getStudentGrupos(stu.matricula).length > 0" class="position-absolute top-0 end-0 m-2 z-2 d-flex flex-column gap-1" style="pointer-events: none;">
                <span v-for="gColor in getStudentGrupos(stu.matricula)" :key="gColor" class="badge rounded-circle shadow-sm border border-white p-2" :style="{ backgroundColor: gColor }" title="En Grupo"></span>
              </div>

              <!-- Overlay para reordenar -->
              <div v-if="sortMode" class="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 rounded-3 d-flex flex-column justify-content-center align-items-center z-3 gap-3 p-3">
                <button class="btn btn-light rounded-circle shadow-sm" @click.stop="moveStudent(index, -1)" :disabled="index === 0"><i class="fas fa-arrow-up"></i></button>
                <span class="badge bg-white text-dark fw-bold rounded-pill shadow-sm">Pos {{ index + 1 }}</span>
                <button class="btn btn-light rounded-circle shadow-sm" @click.stop="moveStudent(index, 1)" :disabled="index === filteredStudents.length - 1"><i class="fas fa-arrow-down"></i></button>
              </div>

              <!-- Cuerpo de la Tarjeta (Click para seleccionar) -->
              <div class="card-body text-center p-3 d-flex flex-column h-100 cursor-pointer" @click="!sortMode && toggleAttendanceSelection(stu.matricula)">
                <transition name="pop">
                  <div v-if="selectedForAttendance.includes(stu.matricula) || hasAttendedToday(stu.matricula)" class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50 rounded-4 z-1" style="pointer-events: none;">
                    <i class="fas fa-check-circle text-success fa-3x filter-drop-shadow"></i>
                  </div>
                </transition>
                
                <div class="mb-2 position-relative d-inline-block mx-auto mt-2">
                  <img v-if="stu.foto" :src="stu.foto" class="rounded-circle object-fit-cover shadow-sm bg-white border border-2 border-white" width="70" height="70">
                  <div v-else class="rounded-circle d-flex align-items-center justify-content-center shadow-sm bg-white text-secondary border border-2 border-white" style="width: 70px; height: 70px;">
                    <i class="fas fa-user fa-xl"></i>
                  </div>
                </div>
                
                <h6 class="small fw-bold mb-0 text-truncate text-dark w-100" :title="stu.nombreCompleto">{{ stu.nombreCompleto }}</h6>
                <small class="text-muted d-block mb-2" style="font-size: 0.7rem;">{{ stu.grado }} {{ stu.grupo }}</small>
                
                <div class="d-flex align-items-center justify-content-center gap-2 mb-2 position-relative z-2 mt-2">
                  <span class="badge shadow-sm rounded-pill px-2 py-1" :class="isNewStudent(timelineData[stu.matricula]?.started_at) ? 'bg-success text-white border border-success pulse-animation' : 'bg-white text-dark border'" style="font-size: 0.7rem;" v-if="timeAgo(timelineData[stu.matricula]?.started_at)">
                    <i class="fas fa-clock" :class="isNewStudent(timelineData[stu.matricula]?.started_at) ? 'text-white' : 'text-info'"></i> {{ timeAgo(timelineData[stu.matricula]?.started_at) }}
                  </span>
                  <button class="btn btn-sm text-primary p-0 bg-transparent border-0 hover-scale" @click.stop="openTimelineModal(stu)" title="Ver Historial"><i class="fas fa-history fs-6"></i></button>
                </div>

                <div class="mt-auto d-flex justify-content-center gap-2 position-relative z-2">
                  <button class="btn btn-sm btn-outline-warning rounded-pill px-3 shadow-sm bg-white fw-semibold hover-scale" @click.stop="openIncidenciaModal(stu)" title="Añadir Nota / Incidencia" :disabled="sortMode">
                    <i class="fas fa-exclamation-triangle"></i> Nota
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- FLOATING BOTTOM ACTION BAR (CONTEXTUAL)    -->
    <!-- ========================================== -->
    <transition name="slide-up">
      <div v-if="selectedForAttendance.length > 0 && !sortMode" class="position-fixed bottom-0 start-0 w-100 p-3 z-top" style="pointer-events: none;">
        <div class="mx-auto bg-white rounded-pill shadow-lg border p-2 d-flex align-items-center justify-content-between gap-2" style="max-width: 600px; pointer-events: auto;">
          <div class="d-flex align-items-center ms-2 flex-shrink-0">
            <span class="badge bg-primary rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style="width:30px; height:30px; font-size: 0.9rem;">{{ selectedForAttendance.length }}</span>
            <span class="fw-bold text-dark d-none d-sm-inline">Seleccionados</span>
          </div>
          
          <div class="d-flex gap-2 flex-grow-1 justify-content-end">
            <!-- Botón para quitar del grupo (Solo si estamos dentro de un grupo) -->
            <button v-if="activeGrupo" class="btn btn-light text-danger rounded-pill fw-bold border shadow-sm px-3 hover-scale" @click="removeFromGrupo">
              <i class="fas fa-user-minus"></i> <span class="d-none d-md-inline ms-1">Quitar</span>
            </button>
            
            <!-- Botón de Agrupar (Abre Modal) -->
            <button class="btn btn-warning text-dark rounded-pill fw-bold border-0 shadow-sm px-3 hover-scale" @click="showGroupSelectModal = true">
              <i class="fas fa-folder-plus"></i> <span class="d-none d-sm-inline ms-1">Agrupar</span>
            </button>
            
            <!-- Guardar Asistencia -->
            <button class="btn btn-success rounded-pill fw-bold shadow-sm px-3 hover-scale" @click="recordSelectedAttendance">
              <i class="fas fa-check"></i> <span class="d-none d-sm-inline ms-1">Asistencia</span>
            </button>
            
            <!-- Cancelar Selección -->
            <button class="btn btn-light text-danger rounded-circle shadow-sm border" style="width: 40px; height: 40px;" @click="clearSelection" title="Cancelar selección">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ========================================== -->
    <!-- MODALS                                     -->
    <!-- ========================================== -->

    <!-- Modal Agregar Taller (Acceso Directo) -->
    <div v-if="showAddModal" class="modal-backdrop fade show z-modal-bg"></div>
    <div v-if="showAddModal" class="modal fade show d-block z-modal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold text-dark">Agregar Taller a Favoritos</h5>
            <button type="button" class="btn-close" @click="closeAddModal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-4">
              <label class="form-label fw-semibold text-muted">1. Selecciona el Plantel</label>
              <select class="form-select form-select-lg rounded-pill bg-light border-0 shadow-sm" v-model="newShortcutPlantel" @change="fetchServicesForAdd">
                <option :value="null">Plantel...</option>
                <option v-for="p in allowedPlanteles" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div class="mb-5 position-relative">
              <label class="form-label fw-semibold text-muted">2. Selecciona el Taller</label>
              <select class="form-select form-select-lg rounded-pill bg-light border-0 shadow-sm" v-model="newShortcutServicio" :disabled="!newShortcutPlantel || fetchingServices">
                <option :value="null">{{ fetchingServices ? 'Cargando listado...' : 'Taller...' }}</option>
                <option v-for="s in availableServicesForAdd" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <button class="btn btn-danger w-100 rounded-pill py-3 fw-bold shadow-sm hover-scale" @click="saveNewShortcut" :disabled="!newShortcutPlantel || !newShortcutServicio">
              Guardar en Mis Talleres
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Seleccionar/Asignar Grupo -->
    <div v-if="showGroupSelectModal" class="modal-backdrop fade show z-modal-bg"></div>
    <div v-if="showGroupSelectModal" class="modal fade show d-block z-modal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header border-bottom-0 pb-2">
            <h5 class="modal-title fw-bold text-dark">Añadir a Grupo</h5>
            <button type="button" class="btn-close" @click="showGroupSelectModal = false"></button>
          </div>
          <div class="modal-body p-3 pt-0">
            <p class="small text-muted mb-3">Asigna a los {{ selectedForAttendance.length }} alumnos seleccionados a un grupo existente o crea uno nuevo.</p>
            <div class="list-group list-group-flush mb-3 rounded-3 overflow-hidden border">
              <button v-for="grp in grupos" :key="grp.id"
                      class="list-group-item list-group-item-action py-3 d-flex align-items-center fw-bold border-bottom"
                      @click="assignToGrupo(grp.id)">
                <i class="fas fa-circle me-3 fa-lg" :style="{color: grp.color}"></i> 
                {{ grp.name }}
              </button>
            </div>
            <button class="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm" @click="promptCreateGrupo(true)">
              <i class="fas fa-plus me-1"></i> Crear Nuevo Grupo
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Editor de Menú Inline (Con Picker de Biblioteca) -->
    <div v-if="showMenuEditor" class="modal-backdrop fade show z-modal-bg"></div>
    <div v-if="showMenuEditor" class="modal fade show d-block z-modal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-light">
          <div class="modal-header border-bottom-0 pb-0 bg-white">
            <h5 class="modal-title fw-bold text-dark"><i class="fas fa-utensils text-warning me-2"></i> Menú del Día: {{ currentWorkshop.servicio }}</h5>
            <button type="button" class="btn-close" @click="closeMenuEditor"></button>
          </div>
          <div class="modal-body p-0 bg-white">
            
            <div class="d-flex border-bottom text-center fw-bold">
              <div class="flex-fill p-3 cursor-pointer transition-all" :class="menuTab === 'library' ? 'bg-warning bg-opacity-10 text-dark border-bottom border-warning border-3' : 'text-muted hover-bg-light'" @click="menuTab = 'library'">
                Elegir de Biblioteca
              </div>
              <div class="flex-fill p-3 cursor-pointer transition-all" :class="menuTab === 'custom' ? 'bg-warning bg-opacity-10 text-dark border-bottom border-warning border-3' : 'text-muted hover-bg-light'" @click="menuTab = 'custom'">
                Crear Plato Rápido
              </div>
            </div>

            <!-- Panel Library -->
            <div v-if="menuTab === 'library'" class="p-4 bg-light" style="max-height: 55vh; overflow-y: auto;">
               <input type="text" class="form-control rounded-pill border-0 shadow-sm mb-4 py-2 px-4" placeholder="Buscar recetas guardadas..." v-model="searchMenuLibrary">
               <div class="row g-3">
                 <div class="col-md-6" v-for="tpl in filteredMenuLibrary" :key="tpl.id">
                    <div class="card h-100 border border-2 shadow-sm rounded-4 cursor-pointer hover-card transition-all"
                         :class="menuFormData.selectedTemplateId === tpl.id ? 'border-warning bg-warning bg-opacity-10' : 'border-transparent bg-white'"
                         @click="selectInlineTemplate(tpl)">
                      <div class="d-flex p-2 gap-3 h-100 align-items-center">
                        <img v-if="tpl.image_url" :src="tpl.image_url" class="rounded-3 object-fit-cover shadow-sm" style="width: 70px; height: 70px;">
                        <div v-else class="rounded-3 bg-light d-flex align-items-center justify-content-center text-muted" style="width: 70px; height: 70px;">
                          <i class="fas fa-image fa-lg"></i>
                        </div>
                        <div class="flex-grow-1 overflow-hidden py-1">
                          <h6 class="fw-bold mb-0 text-dark text-truncate">{{ tpl.title }}</h6>
                          <p class="small text-muted mb-0 text-truncate">{{ tpl.description }}</p>
                        </div>
                        <div class="pe-2">
                          <i class="fas fa-check-circle fa-xl transition-all" :class="menuFormData.selectedTemplateId === tpl.id ? 'text-warning' : 'text-muted opacity-25'"></i>
                        </div>
                      </div>
                    </div>
                 </div>
                 <div v-if="filteredMenuLibrary.length === 0" class="col-12 text-center py-4 text-muted">
                   No hay recetas en la biblioteca con ese nombre.
                 </div>
               </div>
            </div>

            <!-- Panel Custom -->
            <div v-if="menuTab === 'custom'" class="p-4 bg-light" style="max-height: 55vh; overflow-y: auto;">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Título del Plato Principal</label>
                <input type="text" class="form-control rounded-pill border-0 shadow-sm" v-model="menuFormData.title" placeholder="Ej: Pechuga empanizada con arroz">
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Descripción</label>
                <textarea class="form-control rounded-4 border-0 shadow-sm" v-model="menuFormData.description" rows="3" placeholder="Detalle nutricional..."></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted d-block">Fotografía (Opcional)</label>
                <div class="border-2 border-dashed rounded-4 p-3 text-center bg-white cursor-pointer" @click="triggerInlineFileInput">
                  <input type="file" ref="inlineFileInput" class="d-none" accept="image/*" @change="handleInlineFileSelect" />
                  <div v-if="menuFormData.image_url" class="position-relative">
                    <img :src="menuFormData.image_url" class="img-fluid rounded-3 object-fit-cover shadow-sm" style="max-height: 150px; width: 100%;" />
                    <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow hover-scale" @click.stop="menuFormData.image_url = ''" title="Remover imagen">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div v-else-if="uploadingMenuImage" class="py-3">
                    <div class="spinner-border text-warning mb-2"></div><p class="text-muted small mb-0 fw-bold">Subiendo imagen...</p>
                  </div>
                  <div v-else class="py-2">
                    <i class="fas fa-camera fa-2x text-warning mb-2"></i><p class="text-muted small mb-0">Haz clic para subir fotografía</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          <div class="modal-footer border-top-0 bg-white">
             <button class="btn btn-light rounded-pill px-4 fw-bold shadow-sm border" @click="closeMenuEditor">Cancelar</button>
             <button class="btn btn-warning rounded-pill px-4 fw-bold shadow-sm text-dark hover-scale" @click="saveInlineMenu" :disabled="!isMenuInlineReady || uploadingMenuImage">
               Guardar y Asignar
             </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Modal -->
    <div v-if="viewingTimelineStu" class="modal-backdrop fade show z-modal-bg"></div>
    <div v-if="viewingTimelineStu" class="modal fade show d-block z-modal" tabindex="-1">
       <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 shadow-lg">
             <div class="modal-header border-bottom-0 pb-0">
               <h5 class="modal-title fw-bold text-dark">Historial del Alumno</h5>
               <button type="button" class="btn-close" @click="closeTimelineModal"></button>
             </div>
             <div class="modal-body p-4">
                <div class="d-flex align-items-center gap-3 mb-4 bg-light p-3 rounded-4 border">
                   <img v-if="viewingTimelineStu.foto" :src="viewingTimelineStu.foto" class="rounded-circle object-fit-cover shadow-sm border border-2 border-white" width="60" height="60">
                   <div v-else class="rounded-circle shadow-sm border border-2 border-white bg-white d-flex align-items-center justify-content-center text-secondary" style="width: 60px; height: 60px;">
                      <i class="fas fa-user fa-lg"></i>
                   </div>
                   <div>
                      <h6 class="fw-bold mb-0 text-dark">{{ viewingTimelineStu.nombreCompleto }}</h6>
                      <small class="text-muted d-block">{{ viewingTimelineStu.matricula }} &bull; {{ viewingTimelineStu.grado }} {{ viewingTimelineStu.grupo }}</small>
                   </div>
                </div>

                <h6 class="fw-bold mb-3 text-secondary text-uppercase small" style="letter-spacing: 0.5px;">Línea de tiempo ({{ currentWorkshop?.plantel }})</h6>
                <div class="timeline ps-3 border-start border-info border-2 ms-2" v-if="timelineData[viewingTimelineStu.matricula]?.history?.length > 0">
                   <div class="mb-4 position-relative" v-for="entry in timelineData[viewingTimelineStu.matricula].history" :key="entry.id">
                      <i class="fas fa-circle position-absolute border border-2 border-white" :class="entry.active ? 'text-success' : 'text-secondary'" style="left: -23px; top: 0px; font-size: 0.85rem;"></i>
                      <div class="bg-white p-3 rounded-4 shadow-sm border">
                         <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="fw-bold mb-0" :class="entry.active ? 'text-dark' : 'text-muted'">{{ entry.servicio_label }}</h6>
                            <span class="badge" :class="entry.active ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-light text-muted border'">{{ entry.active ? 'Actual' : 'Baja' }}</span>
                         </div>
                         <small class="text-muted d-block"><i class="fas fa-calendar-alt me-1"></i> {{ formatDateObj(entry.started_at) }} - {{ entry.ended_at ? formatDateObj(entry.ended_at) : 'Presente' }}</small>
                      </div>
                   </div>
                </div>
                <div v-else class="text-center py-4 text-muted bg-light rounded-4 border border-dashed">
                   <i class="fas fa-history fa-2x mb-2 opacity-25"></i>
                   <p class="mb-0 small fw-semibold">No hay historial de movimientos registrado para este alumno.</p>
                </div>
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
import { getPlantelTheme, getServiceIcon } from '../utils/theme'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const syncing = ref(false)
const savedShortcuts = ref([])

// Modals state
const showAddModal = ref(false)
const showGroupSelectModal = ref(false)

const newShortcutPlantel = ref(null)
const newShortcutServicio = ref(null)
const fetchingServices = ref(false)
const availableServicesForAdd = ref([])

const currentWorkshop = ref(null)
const studentsList = ref([])
const customSortOrder = ref([]) 
const attendanceMap = ref({})
const selectedForAttendance = ref([])
const searchText = ref('')
const allSelected = ref(false)
const sortMode = ref(false)

const timelineData = ref({})
const viewingTimelineStu = ref(null)

// Grupos (Dossiers) State
const grupos = ref([])
const activeGrupo = ref(null)

const allowedPlanteles = ["PREET", "PREEM", "PT", "PM", "ST", "SM", "ISM", "DM", "CM", "CT"]

// --- Meal Menus Context ---
const isMealService = computed(() => {
  if (!currentWorkshop.value) return false;
  return ['DESAYUNO', 'COMIDA', 'CENA'].includes(currentWorkshop.value.servicio.toUpperCase());
});

const todayMenu = ref(null);
const loadingMenu = ref(false);

const fetchTodayMenu = async () => {
  if (!isMealService.value) return;
  loadingMenu.value = true;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await axios.get(`https://matricula.casitaapps.com/api/meal-menus?date=${todayStr}&type=${currentWorkshop.value.servicio.toUpperCase()}`);
    if (res.data && res.data.length > 0) {
      todayMenu.value = res.data[0];
    } else {
      todayMenu.value = null;
    }
  } catch (e) {
    logger.error('Failed to fetch today menu', e);
  } finally {
    loadingMenu.value = false;
  }
}

// Inline Menu Editor State & Methods
const showMenuEditor = ref(false);
const menuTab = ref('library'); // 'library' | 'custom'
const menuLibrary = ref([]);
const searchMenuLibrary = ref('');
const uploadingMenuImage = ref(false);
const inlineFileInput = ref(null);
const menuFormData = ref({
  id: null,
  meal_date: '',
  meal_type: '',
  title: '',
  description: '',
  image_url: '',
  is_active: true,
  selectedTemplateId: null
});

const filteredMenuLibrary = computed(() => {
  if (!searchMenuLibrary.value) return menuLibrary.value;
  const q = searchMenuLibrary.value.toLowerCase();
  return menuLibrary.value.filter(t => t.title.toLowerCase().includes(q));
});

const isMenuInlineReady = computed(() => {
  if (menuTab.value === 'library') return !!menuFormData.value.selectedTemplateId;
  return !!menuFormData.value.title;
});

const openInlineMenuEditor = async (menu) => {
  searchMenuLibrary.value = '';
  menuTab.value = 'library';
  if (menu) {
    menuTab.value = 'custom';
    menuFormData.value = { ...menu, meal_date: menu.meal_date.split('T')[0], is_active: !!menu.is_active, selectedTemplateId: null };
  } else {
    menuFormData.value = {
      id: null,
      meal_date: new Date().toISOString().split('T')[0],
      meal_type: currentWorkshop.value.servicio.toUpperCase(),
      title: '',
      description: '',
      image_url: '',
      is_active: true,
      selectedTemplateId: null
    };
  }
  
  if (menuLibrary.value.length === 0) {
    try {
      const res = await axios.get('https://matricula.casitaapps.com/api/menu-library');
      menuLibrary.value = res.data;
    } catch(e) {}
  }

  showMenuEditor.value = true;
};

const selectInlineTemplate = (tpl) => {
  menuFormData.value.selectedTemplateId = tpl.id;
  menuFormData.value.title = tpl.title;
  menuFormData.value.description = tpl.description;
  menuFormData.value.image_url = tpl.image_url;
};

const closeMenuEditor = () => { showMenuEditor.value = false; };

const triggerInlineFileInput = () => {
  if (!uploadingMenuImage.value && inlineFileInput.value) inlineFileInput.value.click();
};

const handleInlineFileSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return Swal.fire('Inválido', 'Solo imágenes.', 'warning');
  
  uploadingMenuImage.value = true;
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await axios.post('https://matricula.casitaapps.com/api/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    menuFormData.value.image_url = res.data.url;
  } catch (error) {
    Swal.fire('Error', 'No se pudo subir la imagen.', 'error');
  } finally {
    uploadingMenuImage.value = false;
    if (inlineFileInput.value) inlineFileInput.value.value = '';
  }
};

const saveInlineMenu = async () => {
  loading.value = true;
  try {
    const payload = { 
      id: menuFormData.value.id,
      meal_date: menuFormData.value.meal_date,
      meal_type: menuFormData.value.meal_type,
      title: menuFormData.value.title,
      description: menuFormData.value.description,
      image_url: menuFormData.value.image_url,
      is_active: menuFormData.value.is_active ? 1 : 0 
    };

    if (menuTab.value === 'library' && menuFormData.value.selectedTemplateId) {
      const tpl = menuLibrary.value.find(t => t.id === menuFormData.value.selectedTemplateId);
      payload.title = tpl.title;
      payload.description = tpl.description;
      payload.image_url = tpl.image_url;
    }

    if (payload.id) {
      await axios.put(`https://matricula.casitaapps.com/api/meal-menus/${payload.id}`, payload);
    } else {
      await axios.post('https://matricula.casitaapps.com/api/meal-menus', payload);
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Menú Asignado', showConfirmButton: false, timer: 2000 });
    closeMenuEditor();
    fetchTodayMenu();
  } catch (e) {
    logger.error('Failed to save inline menu', e);
    Swal.fire('Error', 'No se pudo guardar el menú.', 'error');
  } finally {
    loading.value = false;
  }
};
// ------------------------------

onMounted(() => {
  const stored = localStorage.getItem('workshop_shortcuts')
  if (stored) savedShortcuts.value = JSON.parse(stored)
})

const getTeacherId = () => {
  if (authStore.user?.email) return authStore.user.email;
  let tid = localStorage.getItem('teacher_device_id');
  if (!tid) {
    tid = 'tid_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('teacher_device_id', tid);
    document.cookie = `teacher_device_id=${tid};path=/;max-age=31536000`;
  }
  return tid;
}

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if(isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 0) return 'Hoy';
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays/7)} sem`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays/30)} meses`;
  return `Hace ${Math.floor(diffDays/365)} años`;
}

const isNewStudent = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if(isNaN(d.getTime())) return false;
  const diffDays = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 14; 
}

const formatDateObj = (dateStr) => {
   if(!dateStr) return '...';
   const d = new Date(dateStr);
   if(isNaN(d.getTime())) return dateStr;
   return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

const openTimelineModal = (stu) => { viewingTimelineStu.value = stu; }
const closeTimelineModal = () => { viewingTimelineStu.value = null; }

const fetchServicesForAdd = async () => {
  if (!newShortcutPlantel.value) {
    availableServicesForAdd.value = []
    return
  }
  fetchingServices.value = true
  try {
    const res = await axios.get(`https://matricula.casitaapps.com/fetch-servicios-data?plantel=${newShortcutPlantel.value}`)
    if (res.data && res.data[newShortcutPlantel.value]) {
      availableServicesForAdd.value = Object.keys(res.data[newShortcutPlantel.value]).sort()
    } else {
      availableServicesForAdd.value = []
    }
  } catch (e) {
    logger.error('Failed to fetch services', e)
  } finally {
    fetchingServices.value = false
  }
}

const saveNewShortcut = () => {
  const exists = savedShortcuts.value.find(s => s.plantel === newShortcutPlantel.value && s.servicio === newShortcutServicio.value)
  if (!exists) {
    savedShortcuts.value.push({ plantel: newShortcutPlantel.value, servicio: newShortcutServicio.value })
    localStorage.setItem('workshop_shortcuts', JSON.stringify(savedShortcuts.value))
  }
  closeAddModal()
}

const closeAddModal = () => {
  showAddModal.value = false
  newShortcutPlantel.value = null
  newShortcutServicio.value = null
  availableServicesForAdd.value = []
}

const removeShortcut = (idx) => {
  savedShortcuts.value.splice(idx, 1)
  localStorage.setItem('workshop_shortcuts', JSON.stringify(savedShortcuts.value))
}

const getCacheKey = () => `ws_cache_${currentWorkshop.value.plantel}_${currentWorkshop.value.servicio}`
const getSortKey = () => `ws_sort_${currentWorkshop.value.plantel}_${currentWorkshop.value.servicio}`
const getGruposKey = () => `ws_grupos_${getTeacherId()}_${currentWorkshop.value.plantel}_${currentWorkshop.value.servicio}`

const applySortOrder = (list) => {
  if (customSortOrder.value.length === 0) return list;
  return [...list].sort((a, b) => {
    const idxA = customSortOrder.value.indexOf(a.matricula);
    const idxB = customSortOrder.value.indexOf(b.matricula);
    if (idxA === -1 && idxB === -1) return a.nombreCompleto.localeCompare(b.nombreCompleto);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}

const loadGrupos = async () => {
   if (!currentWorkshop.value) return;
   const key = getGruposKey();
   
   const local = localStorage.getItem(key);
   if (local) grupos.value = JSON.parse(local);
   else grupos.value = [];

   try {
     const res = await axios.get(`https://bot.casitaapps.com/api/talleres/dossiers`, {
       params: { teacher_id: getTeacherId(), plantel: currentWorkshop.value.plantel, servicio: currentWorkshop.value.servicio }
     });
     if (res.data && res.data.dossiers) {
       grupos.value = res.data.dossiers;
       localStorage.setItem(key, JSON.stringify(grupos.value));
     }
   } catch(e) {
     logger.warn('Grupos remotos no disponibles', e);
   }
}

const saveGruposRemote = async () => {
   const key = getGruposKey();
   localStorage.setItem(key, JSON.stringify(grupos.value));
   try {
     await axios.post(`https://bot.casitaapps.com/api/talleres/dossiers`, {
       teacher_id: getTeacherId(),
       plantel: currentWorkshop.value.plantel,
       servicio: currentWorkshop.value.servicio,
       dossiers: grupos.value
     });
   } catch(e) {
     logger.warn('Fallo sync de grupos', e);
   }
}

const promptCreateGrupo = async (fromModal = false) => {
   if (fromModal) showGroupSelectModal.value = false;

   const { value: name } = await Swal.fire({
     title: 'Crear Nuevo Grupo',
     input: 'text',
     inputPlaceholder: 'Ej: Avanzados, Lunes/Miércoles, Equipo A',
     showCancelButton: true,
     confirmButtonText: 'Crear',
     cancelButtonText: 'Cancelar'
   });
   
   if (name) {
     const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
     const newGrupo = {
       id: 'grp_' + Date.now(),
       name,
       color: palette[grupos.value.length % palette.length],
       students: [...selectedForAttendance.value] 
     };
     grupos.value.push(newGrupo);
     saveGruposRemote();
     selectedForAttendance.value = [];
     allSelected.value = false;
     Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Grupo creado exitosamente', showConfirmButton: false, timer: 2000});
   } else if (fromModal) {
     showGroupSelectModal.value = true;
   }
}

const assignToGrupo = (grupoId) => {
   const grp = grupos.value.find(g => g.id === grupoId);
   if (!grp) return;
   
   let added = 0;
   selectedForAttendance.value.forEach(mat => {
     if (!grp.students.includes(mat)) {
       grp.students.push(mat);
       added++;
     }
   });
   
   showGroupSelectModal.value = false;

   if (added > 0) {
     saveGruposRemote();
     selectedForAttendance.value = [];
     allSelected.value = false;
     Swal.fire({toast: true, position: 'top-end', icon: 'success', title: `Añadidos a "${grp.name}"`, showConfirmButton: false, timer: 2000});
   } else {
     selectedForAttendance.value = [];
     Swal.fire({toast: true, position: 'top-end', icon: 'info', title: 'Ya estaban en el grupo', showConfirmButton: false, timer: 2000});
   }
}

const removeFromGrupo = () => {
   if (!activeGrupo.value) return;
   const grp = grupos.value.find(g => g.id === activeGrupo.value);
   if (grp) {
     grp.students = grp.students.filter(mat => !selectedForAttendance.value.includes(mat));
     saveGruposRemote();
     selectedForAttendance.value = [];
     allSelected.value = false;
     Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Quitados del grupo', showConfirmButton: false, timer: 2000});
   }
}

const removeGrupo = async (grupoId) => {
   const conf = await Swal.fire({ title: '¿Eliminar Grupo?', text: 'Los alumnos no se borrarán del taller general.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#ef4444' });
   if (!conf.isConfirmed) return;

   grupos.value = grupos.value.filter(g => g.id !== grupoId);
   if (activeGrupo.value === grupoId) activeGrupo.value = null;
   saveGruposRemote();
}

const getStudentGrupos = (matricula) => {
   return grupos.value.filter(g => g.students.includes(matricula)).map(g => g.color);
}

const openWorkshop = async (shortcut) => {
  currentWorkshop.value = shortcut
  searchText.value = ''
  selectedForAttendance.value = []
  allSelected.value = false
  sortMode.value = false
  timelineData.value = {}
  activeGrupo.value = null
  showGroupSelectModal.value = false
  todayMenu.value = null
  
  const savedSort = localStorage.getItem(getSortKey())
  customSortOrder.value = savedSort ? JSON.parse(savedSort) : []

  loadGrupos();

  const cachedData = localStorage.getItem(getCacheKey())
  if (cachedData) {
    studentsList.value = applySortOrder(JSON.parse(cachedData))
    syncing.value = true
    await fetchAttendance() 
    fetchTimeline() 
  } else {
    loading.value = true 
  }

  await fetchWorkshopData();
  if (isMealService.value) fetchTodayMenu();
}

const manualRefresh = async () => {
  loading.value = true
  await fetchWorkshopData()
  await fetchAttendance()
  await fetchTimeline()
  if (isMealService.value) fetchTodayMenu();
  loading.value = false
}

const fetchWorkshopData = async () => {
  if(!currentWorkshop.value) return;
  if (!syncing.value) loading.value = true;
  
  try {
    const res = await axios.get(`https://matricula.casitaapps.com/fetch-servicios-data?plantel=${currentWorkshop.value.plantel}`)
    if (res.data && res.data[currentWorkshop.value.plantel] && res.data[currentWorkshop.value.plantel][currentWorkshop.value.servicio]) {
      const freshList = res.data[currentWorkshop.value.plantel][currentWorkshop.value.servicio]
      localStorage.setItem(getCacheKey(), JSON.stringify(freshList))
      studentsList.value = applySortOrder(freshList)
      
      if(customSortOrder.value.length === 0 && freshList.length > 0) {
        customSortOrder.value = freshList.map(s => s.matricula)
        localStorage.setItem(getSortKey(), JSON.stringify(customSortOrder.value))
      }
      
      fetchTimeline()
    } else {
      studentsList.value = []
      Swal.fire('Atención', 'No hay alumnos inscritos en este taller.', 'info')
    }
  } catch (e) {
    logger.error('Failed to sync workshop', e)
  } finally {
    loading.value = false
    syncing.value = false
  }
}

const fetchTimeline = async () => {
  if (!currentWorkshop.value || studentsList.value.length === 0) return;
  const matriculas = studentsList.value.map(s => s.matricula);
  try {
    const res = await axios.post('https://bot.casitaapps.com/api/talleres/timeline/bulk', {
      plantel: currentWorkshop.value.plantel,
      servicio: currentWorkshop.value.servicio,
      matriculas
    });
    timelineData.value = res.data?.data || {};
  } catch(e) {}
}

const closeWorkshop = () => {
  currentWorkshop.value = null
  studentsList.value = []
  attendanceMap.value = {}
  selectedForAttendance.value = []
  sortMode.value = false
  activeGrupo.value = null
  todayMenu.value = null
}

const filteredStudents = computed(() => {
  const q = searchText.value.toLowerCase()
  let list = studentsList.value

  if (activeGrupo.value) {
    const grp = grupos.value.find(g => g.id === activeGrupo.value);
    if (grp) list = list.filter(s => grp.students.includes(s.matricula));
  }

  if (q) list = list.filter(s => s.nombreCompleto.toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q))
  return applySortOrder(list)
})

const fetchAttendance = async () => {
  if (studentsList.value.length === 0) return
  const payload = studentsList.value.map(s => ({ matricula: s.matricula, servicio: currentWorkshop.value.servicio }))
  try {
    const res = await axios.post('https://bot.casitaapps.com/get-monthly-attendance-bulk', { students: payload })
    attendanceMap.value = res.data.attendanceData || {}
  } catch (e) { logger.error("Attendance fetch error", e) }
}

const hasAttendedToday = (matricula) => {
  const day = new Date().getDate()
  const key = `${matricula}-${currentWorkshop.value.servicio}`
  const arr = attendanceMap.value[key]
  return arr && arr.map(Number).includes(Number(day))
}

const clearSelection = () => {
  selectedForAttendance.value = [];
  allSelected.value = false;
}

const toggleAttendanceSelection = (matricula) => {
  const idx = selectedForAttendance.value.indexOf(matricula)
  if (idx > -1) selectedForAttendance.value.splice(idx, 1)
  else selectedForAttendance.value.push(matricula)
  allSelected.value = filteredStudents.value.length > 0 && selectedForAttendance.value.length === filteredStudents.value.length
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedForAttendance.value = []
  } else {
    selectedForAttendance.value = filteredStudents.value.map(s => s.matricula)
  }
  allSelected.value = !allSelected.value
}

const recordSelectedAttendance = async () => {
  loading.value = true
  try {
    await axios.post('https://bot.casitaapps.com/record-attendance-bulk', { matriculas: selectedForAttendance.value, servicio: currentWorkshop.value.servicio })
    
    if (isMealService.value) {
      await triggerParentNotifications(selectedForAttendance.value);
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Asistencia Guardada', showConfirmButton: false, timer: 2000 })
    }

    clearSelection();
    await fetchAttendance()
  } catch (e) {
    Swal.fire('Error', 'No se guardó asistencia', 'error')
  } finally {
    loading.value = false
  }
}

const triggerParentNotifications = async (matriculasIds) => {
    const studentsToNotify = matriculasIds.map(m => {
        const s = studentsList.value.find(x => x.matricula === m);
        return { matricula: m, nombreCompleto: s ? s.nombreCompleto : m };
    });

    try {
        const res = await axios.post('https://matricula.casitaapps.com/api/meal-menus/notify-parents', {
            students: studentsToNotify,
            servicio: currentWorkshop.value.servicio,
            plantel: currentWorkshop.value.plantel,
            date: new Date().toISOString().split('T')[0]
        });
        
        if(res.data.sentCount > 0) {
            Swal.fire('Asistencia y Notificación', `Se guardó asistencia y se enviaron ${res.data.sentCount} correos.`, 'success');
        } else {
            Swal.fire('Asistencia Guardada', 'Asistencia registrada. (No hubo correos que enviar).', 'success');
        }
    } catch (e) {
        logger.error('Failed to notify parents', e);
        Swal.fire({
            title: 'Notificaciones Fallidas',
            text: 'La asistencia se guardó correctamente, pero el envío de correos falló. Puedes reintentar enviar los correos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reintentar',
            cancelButtonText: 'No enviar'
        }).then(result => {
            if (result.isConfirmed) {
                loading.value = true;
                triggerParentNotifications(matriculasIds).finally(() => loading.value = false);
            }
        });
    }
}

const toggleSortMode = () => {
  sortMode.value = !sortMode.value
  searchText.value = '' 
}

const moveStudent = (index, direction) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= filteredStudents.value.length) return

  const stuA = filteredStudents.value[index].matricula;
  const stuB = filteredStudents.value[targetIndex].matricula;
  
  if(customSortOrder.value.length === 0) {
    customSortOrder.value = studentsList.value.map(s => s.matricula)
  }
  
  const idxA = customSortOrder.value.indexOf(stuA);
  const idxB = customSortOrder.value.indexOf(stuB);
  
  if(idxA !== -1 && idxB !== -1) {
    const temp = customSortOrder.value[idxA]
    customSortOrder.value[idxA] = customSortOrder.value[idxB]
    customSortOrder.value[idxB] = temp
    
    localStorage.setItem(getSortKey(), JSON.stringify(customSortOrder.value))
    studentsList.value = [...studentsList.value] 
  }
}

const openIncidenciaModal = async (stu) => {
  const { value: formValues } = await Swal.fire({
    title: `Reportar: ${stu.nombreCompleto}`,
    html: `
      <div class="text-start">
        <label class="fw-bold mb-2 text-dark small">Motivo / Descripción de la incidencia:</label>
        <textarea id="swal-motivo" class="form-control mb-3 bg-light rounded-4 p-3 border-0" rows="3" placeholder="Describe lo sucedido (min 10 caracteres)..."></textarea>
        <label class="fw-bold mb-2 text-dark small">Acciones Tomadas:</label>
        <textarea id="swal-acciones" class="form-control bg-light rounded-4 p-3 border-0" rows="3" placeholder="¿Qué se hizo al respecto? (min 10 caracteres)..."></textarea>
      </div>
    `,
    focusConfirm: false, showCancelButton: true, confirmButtonText: 'Guardar Reporte', cancelButtonText: 'Cancelar',
    confirmButtonColor: '#eab308',
    preConfirm: () => {
      const motivo = document.getElementById('swal-motivo').value
      const acciones = document.getElementById('swal-acciones').value
      if(motivo.length < 10 || acciones.length < 10) {
        Swal.showValidationMessage('Ambos campos requieren al menos 10 caracteres.')
        return false
      }
      return { motivo, acciones }
    }
  })

  if (formValues) {
    loading.value = true
    try {
      await axios.post('https://bot.casitaapps.com/api/servicios-atencion', {
        matricula: stu.matricula, 
        nombre_alumno: stu.nombreCompleto, 
        servicios: currentWorkshop.value.servicio,
        motivo: formValues.motivo, 
        acciones: formValues.acciones, 
        plantel: currentWorkshop.value.plantel, 
        area: 'Artes y Deportes'
      })
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Incidencia guardada', showConfirmButton: false, timer: 3000 })
    } catch(e) {
      Swal.fire('Error', 'Fallo al guardar reporte. Revisa la conexión.', 'error')
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.hover-card { transition: transform 0.2s, box-shadow 0.2s; }
.hover-card:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
.attendance-card { transition: all 0.2s; overflow: hidden; }
.attendance-card:hover { transform: scale(1.02); }
.border-transparent { border-color: transparent; }
.filter-drop-shadow { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
.min-h-200 { min-height: 200px; }
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }
.hover-bg-light:hover { background-color: #f8fafc; }

.pulse-animation { animation: pulse 2s infinite; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.fade-in { animation: fadeIn 0.4s ease-out; }
.animation-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.pop-enter-active, .pop-leave-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from, .pop-leave-to { transform: scale(0); opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }

.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.transition-all { transition: all 0.3s ease; }

.z-top { z-index: 1060 !important; }
.z-modal-bg { z-index: 1040 !important; }
.z-modal { z-index: 1050 !important; }
</style>