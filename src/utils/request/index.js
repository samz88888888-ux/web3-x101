
import axios from 'axios'
import setConfig from './axios.setConfig.js'
import handleResponse from './axios.handleResponse.js'
import { guid, aesEncrypt, aesDecrypt } from './axios.middleware.js'
import { useIndexStore } from '@/store'
import { showToast,showLoadingToast,closeToast } from 'vant'
import baseConfig from '@/config'
import md5 from 'md5'
import { i18n } from '../../lang'
import qs from 'qs'

let intactRequest = setConfig(axios)
let request = setConfig(intactRequest.create())

// 请求中的api
let pendingPool = new Map()

/**
 * 请求拦截
 */
const requestInterceptorId = request.interceptors.request.use(
  (config) => {
    showLoadingToast({
      duration: 0,
      forbidClick: true,
    })
    
    // 判断是否是游戏API请求
    const isGameApi = config.url && config.url.startsWith('/game-api')
    
    // 如果是游戏API请求，使用游戏API的baseUrl
    if (isGameApi) {
      config.baseURL = baseConfig.gameApiBaseUrl
    }
    
    const store = useIndexStore()
    let token = store.token || ''
    delete config.headers['Authorization']
    if (token) {
      config.headers['Authorization'] = token
    }
    config.headers['LANG'] = (i18n.global.locale.value || 'tw').toUpperCase()
    
    // 游戏API请求不需要加密，直接返回
    if (isGameApi) {
      console.log('🎮 游戏API请求(不加密):', config.url)
      return config
    }
    
    // 只有非游戏API且开启加密时才进行加密
    if (baseConfig.isEnableEncryption) {
      if(config.method == 'get'){
        //加密的get请求使用form-urlencoded 别问为什么 就是这原因
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
        config.data = config.params
        delete config.params
      }
      let signParam = {
        method: config.method.toUpperCase(),
        uri: `${config.url}`,
        header: config.headers,
        params: { ...config.data }
      }
      if (token) {
        config.headers['Authorization'] = token
      }

      let handshake = guid()
      let timestamp = Date.now()
      let sign = md5(`${signParam}${timestamp}${handshake}`)
      let signKey = JSON.stringify(signParam)

      let encrypData = aesEncrypt(signKey, handshake)
      config.data = {
        handshake,
        timestamp,
        sign,
        data: encrypData
      }
      config.data = qs.stringify(config.data)
      config.method = 'post'
      config.url = `${config.baseURL}/api/${baseConfig.suffix}`
    }

    return config
  },
  (err) => {
    // 对请求错误做些什么
    return Promise.reject(err)
  }
)
/**
 * 响应拦截
 */
const responseInterceptorId = request.interceptors.response.use(
  (response) => {
    closeToast()
    const { data, config } = response
    
    // 判断是否是游戏API请求
    const isGameApi = config.url && config.url.startsWith('/game-api')
    
    try {
      // 游戏API请求不需要解密，直接返回数据
      if (isGameApi) {
        console.log('🎮 游戏API响应(不解密):', config.url, data)
        if (data.code != 200) {
          showToast(data.msg || data.message)
          return Promise.reject(data)
        }
        return Promise.resolve(data.data)
      }
      
      // 非游戏API且开启加密时才进行解密
      if (baseConfig.isEnableEncryption) {
        const cipher = data.data
        const plain = aesDecrypt(cipher, data.handshake)
        try {
          let res = JSON.parse(plain)
          
          if (baseConfig.isLog) {
            console.log('[ res ] >', res)
          }
          // 如果code不为200，则显示错误信息
          if (res.code != 200) {
            showToast(res.message)
            return Promise.reject(res)
          }
          return Promise.resolve(res.data)
        } catch (e) {
          console.log(e);
        }
      } else {
        if (data.code != 200) {
          showToast(data.message)
          return Promise.reject(data)
        }
        return Promise.resolve(data.data)
      }
    } catch (e) {
      showToast(e.message)
    }
    // 清理 pending
    if (config && config.__dedupeKey) {
      pendingPool.delete(config.__dedupeKey)
    }
    return Promise.resolve(handleResponse(response))
  },
  (err) => {
    if (!err) return Promise.reject(err)
    showToast(err.message)
    // closeToast()
    return Promise.reject(err)
  }
)

// 移除全局的请求拦截器
function removeRequestInterceptor() {
  request.interceptors.request.eject(requestInterceptorId)
}

// 移除全局的响应拦截器
function removeResponseInterceptor() {
  request.interceptors.response.eject(responseInterceptorId)
}

/**
 * 清除所有pending状态的请求
 * @param {Array} whiteList 白名单，里面的请求不会被取消
 * 返回值 被取消了的api请求
 */
function clearPendingPool(whiteList = []) {
  if (!pendingPool.size) return

  const pendingUrlList = Array.from(pendingPool.keys()).filter((url) => !whiteList.includes(url))
  if (!pendingUrlList.length) return

  pendingUrlList.forEach((pendingUrl) => {
    // 清除掉所有非全局的pending状态下的请求
    if (!pendingPool.get(pendingUrl).global) {
      pendingPool.get(pendingUrl).cancelFn()
      pendingPool.delete(pendingUrl)
    }
  })

  return pendingUrlList
}

request.removeRequestInterceptor = removeRequestInterceptor
request.removeResponseInterceptor = removeResponseInterceptor
request.clearPendingPool = clearPendingPool

export { intactRequest, request }
