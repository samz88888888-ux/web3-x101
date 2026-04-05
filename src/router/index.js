import { createRouter, createWebHashHistory } from 'vue-router'
import { useIndexStore } from '@/store'
import config from '@/config'
const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'Index',
    component: () => import('../views/Index/index.vue'),
    meta: {
      auth: false,
      title: '首页',
      keepAlive: true,
      headerTheme: 'dark'
    }
  }
]
const modulesFiles = import.meta.glob('./modules/*.js', { eager: true })
//自动引入module包
const moduleRoutes = Object.entries(modulesFiles).reduce((moduleRoutes, [modulePath, value]) => {
  return [...moduleRoutes, ...value.default]
}, [])

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [...routes, ...moduleRoutes]
})

router.beforeEach((to, from, next) => {
  if (config.isVerifyToken) {
    const store = useIndexStore()
    if (!store.token && to.path !== '/index') {
      return next({ path: '/index' })
    }
  }
  next()
})
export default router
