
// 获取当前应用运行变量，默认为 development
const ENV = import.meta.env.VITE_BASE_ENV || 'development'
const modulesFiles = import.meta.glob('./modules/*.js', { eager: true })

const modules = Object.entries(modulesFiles).reduce((modules, [modulePath, value]) => {
    const name = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1').split('modules/')[1];
    modules[name] = value.default;
    return modules
}, {})

// 若 ENV 無對應配置，回退到 development，避免 undefined
const resolvedConfig = modules[ENV] || modules['development']

export default resolvedConfig
