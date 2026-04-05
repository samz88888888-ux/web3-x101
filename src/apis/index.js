
import { request } from '../utils/request/index'
const modulesFiles = import.meta.glob('./modules/*.js', { eager: true })

const apiMap = Object.entries(modulesFiles).reduce((modules, [modulePath, value]) => {
  const name = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1').split('modules/')[1]
  modules[name] = value.default
  return modules
}, {})

let apiModulesMap = {}
const injectRequest = (apiObj) => {
  return dealWithApi(apiObj, apiModulesMap)
}

// 封装处理apiMap
const dealWithApi = (apiObj, modulesMap) => {
  Object.keys(apiObj).forEach((alias) => {
    let { method, url, config } = apiObj[alias]

    if (url) {
      method = method.toUpperCase()
      modulesMap[alias] = (dataOrParams = {}, instanceConf = {}) => {
        const keyName = ['PUT', 'POST', 'PATCH'].includes(method) ? 'data' : 'params'
        return request({
          method,
          url,
          [keyName]: dataOrParams,
          ...Object.assign(config || {}, instanceConf)
        })
      }
    } else {
      modulesMap[alias] = {}
      dealWithApi(apiObj[alias], modulesMap[alias])
    }
  })
  return apiModulesMap
}

export default injectRequest(apiMap)
