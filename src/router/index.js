import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { logger } from '../utils/logger'

import Dashboard from '../views/Dashboard.vue'
import Admin from '../views/Admin.vue'
import Teacher from '../views/Teacher.vue'
import Workshop from '../views/Workshop.vue'
import AtencionPadres from '../views/AtencionPadres.vue'
import StudentHistory from '../views/StudentHistory.vue'
import Overview from '../views/Overview.vue'
import Menus from '../views/Menus.vue'
import PlantelSettings from '../views/PlantelSettings.vue'
import Forbidden from '../views/Forbidden.vue'

const routes = [
  { path: '/', component: Dashboard, meta: { active: 'dashboard' } },
  { path: '/admin/:plantel?/:servicio?', component: Admin, meta: { active: 'admin', requiresAuth: true, adminOnly: true } },
  { path: '/teacher/:servicio?', component: Teacher, meta: { active: 'teacher' } },
  { path: '/workshop', component: Workshop, meta: { active: 'workshop' } },
  { path: '/atencion-padres/:matricula?', component: AtencionPadres, meta: { active: 'atencion-padres' } },
  { path: '/student-history', component: StudentHistory, meta: { active: 'student-history' } },
  { path: '/overview', component: Overview, meta: { active: 'overview', requiresAuth: true, adminOnly: true } },
  { path: '/menus', component: Menus, meta: { active: 'menus', requiresAuth: true, adminOnly: true } },
  { path: '/plantel-settings', component: PlantelSettings, meta: { active: 'plantel-settings', requiresAuth: true, adminOnly: true } },
  { path: '/forbidden', component: Forbidden }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  logger.info(`Navigating to ${to.path}`);
  const authStore = useAuthStore();
  
  if (!authStore.initialized) {
    await authStore.fetchProfile();
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    logger.warn('Access denied: Authentication required.');
    next('/forbidden');
  } else if (to.meta.adminOnly && !authStore.hasAdminAccess) {
    logger.warn('Access denied: Admin role required.');
    next('/forbidden');
  } else {
    next();
  }
})

export default router