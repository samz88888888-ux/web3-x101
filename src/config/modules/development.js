import { address as mainAddress, abi as mainAbi } from '../contract/dev/main'
import { address as customAddress, abi as customAbi } from '../contract/dev/custom'
import { address as miningAddress, abi as miningAbi, abiMap } from '../contract/dev/mining'
import { address as mappingAddress, abi as mappingAbi } from '../contract/dev/mapping'
import { network } from '../network/dev'
export default {
  env: 'dev',
  baseUrl: 'http://x101.dapp.com',
  gameApiBaseUrl: 'http://172.22.142.71:19999', // 游戏API的baseUrl (带端口)
  isEnableEncryption: false, //是否加密
  isLog: true, //是否打印日志
  isEnableConsole: true, //是否允许console.log输出
  isVerifyToken: true, //是否验证token 不验证则不跳转首页 写页面和调接口的时候设置为false 就不会拉起小狐狸和刷新页面
  debugCode: 'abcdef', //调试的时候邀请码
  suffix: 'ae298c2a6477a1f6c9a83e601f1b5828', //后端统一拦截路由
  // 主合约 一般是测试网或者主网的usdt合约
  main: {
    address: mainAddress,
    abi: mainAbi
  },
  // 自定义合约 一般是自己写的合约
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
