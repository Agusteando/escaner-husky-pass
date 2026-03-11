<template>
  <div class="container py-2">
    <div class="text-center mb-5 animation-fade-in-up">
      <img src="/img/workshops.png" alt="Talleres App Logo" class="mb-4 drop-shadow" style="height: 120px;">
      <div v-if="authStore.isLoggedIn">
        <h2 class="fw-bold text-dark mb-1">Bienvenido, {{ authStore.user.displayName }}</h2>
        <p class="text-muted fs-5">¿Qué deseas gestionar hoy en Talleres App?</p>
      </div>
      <div v-else class="d-flex justify-content-center mt-4">
        <div id="g_id_signin_main"></div>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="row g-4 animation-fade-in-up delay-1">
      
      <!-- Featured Card -->
      <div class="col-12 col-lg-8">
        <a href="/Talleres.apk" target="_blank" class="card h-100 border-0 rounded-4 text-decoration-none text-white featured-card position-relative overflow-hidden shadow">
          <div class="card-body p-5 d-flex flex-column justify-content-center position-relative z-1">
            <span class="badge bg-white bg-opacity-25 border border-white text-uppercase tracking-wide rounded-pill px-3 py-2 mb-3 align-self-start" style="font-size: 0.7rem;">
              <i class="fab fa-android me-1"></i> App Exclusiva
            </span>
            <h2 class="fw-bold display-5 mb-2">Talleres Offline</h2>
            <p class="fs-5 opacity-75 mb-4 max-w-75">Sincroniza, toma asistencia y trabaja en áreas sin conexión a internet.</p>
            <button class="btn btn-light rounded-pill px-4 py-3 align-self-start fw-bold text-success shadow-sm hover-scale">
              <i class="fas fa-download me-2"></i> Descargar APK Android
            </button>
          </div>
          <i class="fas fa-mobile-alt position-absolute text-white opacity-10 fa-10x" style="right: -20px; bottom: -30px; transform: rotate(-15deg);"></i>
        </a>
      </div>

      <!-- Admin -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/admin" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-primary bg-opacity-10 text-primary mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-sliders-h fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Administración</h4>
            <p class="text-muted mb-0 small">Añade estudiantes, programa listas por Telegram y gestiona plantillas y roles.</p>
          </div>
        </router-link>
      </div>

      <!-- Menús del Día -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/menus" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-warning bg-opacity-10 text-warning mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-utensils fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Menús del Día</h4>
            <p class="text-muted mb-0 small">Programa el comedor y configura los correos que reciben los padres.</p>
          </div>
        </router-link>
      </div>

      <!-- Portal Docente -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/teacher" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-info bg-opacity-10 text-info mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-chalkboard-user fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Portal Docente</h4>
            <p class="text-muted mb-0 small">Visualiza listas y contactos de los estudiantes regulares de tu salón.</p>
          </div>
        </router-link>
      </div>
      
      <!-- Portal Tallerista -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/workshop" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-danger bg-opacity-10 text-danger mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-clipboard-user fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Portal Tallerista</h4>
            <p class="text-muted mb-0 small">Toma asistencia de tus talleres, registra incidencias y organiza alumnos.</p>
          </div>
        </router-link>
      </div>

      <!-- Configuración Planteles -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/plantel-settings" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-secondary bg-opacity-10 text-secondary mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-cogs fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Configuración</h4>
            <p class="text-muted mb-0 small">Controla remitentes de correos y ajustes generales de cada sede.</p>
          </div>
        </router-link>
      </div>

      <!-- Visión Global -->
      <div class="col-md-6 col-lg-4">
        <router-link to="/overview" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4">
          <div class="card-body p-4 d-flex flex-column">
            <div class="icon-box bg-success bg-opacity-10 text-success mb-4 rounded-4 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-chart-pie fa-xl"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Visión Global</h4>
            <p class="text-muted mb-0 small">Monitoreo y analíticas de asistencia en tiempo real con exportación.</p>
          </div>
        </router-link>
      </div>

      <!-- Atención Padres -->
      <div class="col-md-6 col-lg-6">
        <router-link to="/atencion-padres" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4 bg-white">
          <div class="card-body p-4 d-flex align-items-center gap-4">
            <div class="icon-box bg-warning bg-opacity-10 text-warning rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 70px; height: 70px;">
              <i class="fas fa-users fa-2x"></i>
            </div>
            <div>
              <h4 class="fw-bold text-dark mb-1">Atención Padres</h4>
              <p class="text-muted mb-0 small">Creación y seguimiento de fichas e incidencias de Artes y Deportes.</p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Historial Alumno -->
      <div class="col-md-6 col-lg-6">
        <router-link to="/student-history" class="card h-100 border-0 shadow-sm tool-card text-decoration-none rounded-4 bg-white">
          <div class="card-body p-4 d-flex align-items-center gap-4">
            <div class="icon-box bg-purple bg-opacity-10 text-purple rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 70px; height: 70px; color: #8b5cf6; background-color: #f3e8ff;">
              <i class="fas fa-user-graduate fa-2x"></i>
            </div>
            <div>
              <h4 class="fw-bold text-dark mb-1">Historial Alumno</h4>
              <p class="text-muted mb-0 small">Busca un estudiante y visualiza su registro completo de talleres y reportes.</p>
            </div>
          </div>
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.isLoggedIn) {
    nextTick(() => {
      setTimeout(() => {
        authStore.initGoogleAuth('g_id_signin_main');
      }, 150);
    });
  }
})

// Reliable re-render upon logout
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    nextTick(() => {
      setTimeout(() => {
        authStore.initGoogleAuth('g_id_signin_main');
      }, 150);
    });
  }
})
</script>

<style scoped>
.featured-card {
  background: linear-gradient(135deg, #2D7D46 0%, #298E96 100%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.featured-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(45, 125, 70, 0.3) !important;
}
.tool-card { transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid rgba(0,0,0,0.05) !important; }
.tool-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; border-color: transparent !important; }
.drop-shadow { filter: drop-shadow(0 15px 25px rgba(45, 125, 70, 0.15)); }
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }

.animation-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
.delay-1 { animation-delay: 0.1s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>