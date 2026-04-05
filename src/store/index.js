
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'
import useWeb3 from '../utils/useWeb3'
import api from '../apis'


export const useIndexStore = defineStore('index', () => {
  // 状态
  const token = ref('')
  //当前授权额度
  const currentAuth = ref(0)
  //当前余额
  const currentBalance = ref(0)
  //地址
  const address = ref('')
  //当前链
  const currentChain = ref('')
  
  // 用户信息
  const userInfo = ref({
    name: '', // 地址
    code: '', // 邀请码
    zhi_num: 0, // 直推人数
    team_num: 0, // 团队人数
    me_performance: '0.000000', // 我的业绩
    team_performance: '0.000000', // 团队业绩
    total_performance: '0.000000', // 总业绩
    min_performance: '0.000000', // 小区业绩
    level_id: 1, // 等级id
    level_name: 'V0', // 等级名称
    is_center: 0, // 是否运营中心
    is_studio: 0, // 是否讲师
    balance_list: {
      usdt_point_balance: 0, // USDT积分
      lon_balance: 0, // LON余额
      totalAsset: '0.00' // 总资产
    }
  })




  // 计算属性
  const isWalletInstalled = computed(() => {
    return typeof window !== 'undefined' && window.ethereum
  })

  const balance = computed( async() => {
    const balance = await useWeb3.mainContract.balanceOf(address.value)
    return balance
  })




  // 方法区
  const setToken = (newToken) => {
    if(!newToken){
      router.push('/')
    }
    token.value = newToken
  }

  const setAddress = (newAddress) => {
    address.value = newAddress
  }

  const setCurrentBalance = (balance) => {
    currentBalance.value = balance
  }

  const setCurrentAuth = (auth) => {
    currentAuth.value = auth
  }
  
  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = {
      ...userInfo.value,
      ...info,
      balance_list: {
        ...userInfo.value.balance_list,
        ...(info.balance_list || {})
      }
    }
  }
  
  // 更新用户余额信息
  const updateUserBalance = (balanceList) => {
    userInfo.value.balance_list = {
      ...userInfo.value.balance_list,
      ...balanceList
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const data = await api.home.userInfo()
      console.log('API 返回的用户信息:', data)
      if (data) {
        setUserInfo(data)
        console.log('Store 中的用户信息:', userInfo.value)
      }
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }
  
  const initWallet = async () => {
    //获取主合约余额
    const balance = await useWeb3.mainContract.balanceOf(address.value)
    setCurrentBalance(balance)
    //获取主合约授权额度
    const auth = await useWeb3.mainContract.getCurrentAuth(address.value)
    setCurrentAuth(auth)
  }

  // 清除所有状态
  const clearAll = () => {
    token.value = ''
    address.value = ''
    currentBalance.value = 0
    currentAuth.value = 0
    userInfo.value = {
      name: '',
      code: '',
      zhi_num: 0,
      team_num: 0,
      me_performance: '0.000000',
      team_performance: '0.000000',
      total_performance: '0.000000',
      min_performance: '0.000000',
      level_id: 1,
      level_name: 'V0',
      is_center: 0,
      is_studio: 0,
      balance_list: {
        usdt_point_balance: 0,
        lon_balance: 0,
        totalAsset: '0.00'
      }
    }
    //路由跳转到首页
    router.push('/')
  }

  // 格式化地址显示
  const formatAddress = computed(() => {
    if (!address.value) return ''
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
  })


  return { 
    // 状态
    token,
    address,
    currentBalance,
    currentAuth,
    userInfo,

    // 计算属性
    isWalletInstalled,
    formatAddress,
    balance,
    currentChain,

    // 方法区
    setToken,
    setAddress,
    setCurrentBalance,
    setCurrentAuth,
    setUserInfo,
    updateUserBalance,
    fetchUserInfo,
    initWallet,
    clearAll
  }
})
