
import { createApp } from 'vue'
import 'normalize.css'
import 'assets/styles/index.scss'
import App from './App.vue'
import router from './router'
import './vant'
import 'virtual:uno.css'
import 'vant/lib/index.css'
import { i18n, setLocales } from './lang'
import { createPinia } from 'pinia'
import config from './config'

// 根据配置禁用console.log
if (!config.isEnableConsole) {
    console.log = () => { }
    console.debug = () => { }
    console.info = () => { }
}

const pinia = createPinia()
const app = createApp(App)
// 挂载组件
setLocales(localStorage.lang || 'tw')
// 挂载路由及状态存储
app.use(router).use(pinia).use(i18n)

app.mount('#app')
