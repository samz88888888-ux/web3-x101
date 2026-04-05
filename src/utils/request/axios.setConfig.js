import baseConfig from '@/config'
/**
 * @param {axios} axios实例
 * @param {config} 自定义配置对象，可覆盖掉默认的自定义配置
 */
export default (axios, config = {}) => {
  const defaultConfig = {
    baseURL: baseConfig.baseUrl,
    timeout: 50000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    retry: 0, // 接口请求错误时重试次数
    retryDelay: 1000 // 接口请求错误时，重试间隔
  }

  Object.assign(axios.defaults, defaultConfig, config)
  return axios
}
