import { address as mainAddress, abi as mainAbi } from '../contract/pro/main'
import { address as customAddress, abi as customAbi } from '../contract/pro/custom'
import { address as miningAddress, abi as miningAbi, abiMap } from '../contract/pro/mining'
import { address as mappingAddress, abi as mappingAbi } from '../contract/pro/mapping'
import { network } from '../network/pro'

/**
 * 生产环境：主站 http(s)://sobottaprotocol.com → 接口 http(s)://api.sobottaprotocol.com
 * 换部署域名无需改配置重打包（非浏览器环境回退固定值，避免构建阶段报错）
 */
function resolveBrowserApiOrigin() {
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return 'https://api.sobottaprotocol.com'
  }
  const { protocol, hostname } = window.location
  const rootHost = hostname.replace(/^www\./i, '')
  return `${protocol}//api.${rootHost}`
}

export default {
  env: 'pro',
  get baseUrl() {
    return resolveBrowserApiOrigin()
  },
  get gameApiBaseUrl() {
    return resolveBrowserApiOrigin()
  },
  isEnableEncryption: true,
  isLog: false, //是否打印日志
  isEnableConsole: false, //生产环境禁用console.log输出
  isVerifyToken: true, //是否验证token 不验证则不跳转首页 写页面和调接口的时候设置为false 就不会拉起小狐狸和刷新页面
  suffix: 'ae298c2a6477a1f6c9a83e601f1b5828', //后端统一拦截路由
  main: {
    address: mainAddress,
    abi: mainAbi
  },
  custom: {
    address: customAddress,
    abi: customAbi
  },
  // 挖矿合约
  mining: {
    address: miningAddress,
    abi: miningAbi,
    abiMap
  },
  // 兑换配置 - BNB转账
  exchange: {
    bnbAddress: '0x52C9Fb84932CF18e1906659B75c9280591a995E9',
    bnbAmount: '0.00035' // BNB数量
  },
  // 映射合约
  mapping: {
    address: mappingAddress,
    abi: mappingAbi
  },
  // LON合约地址
  lonContract: {
    address: '0x9c8b16c5a22238161014ae0776630f728b651017',
    decimal: 18
  },
  network
}
