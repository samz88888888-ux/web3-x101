<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin.png'
import filterIcon from '@/assets/imgs/user/fitter.svg'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import addIcon from '@/assets/imgs/mining/add.svg'
import checkedIcon from '@/assets/imgs/mining/checked.svg'
import exchangeIcon from '@/assets/imgs/wallet/exchange.svg'
import LiquidityPopup from './components/LiquidityPopup.vue'

const { t } = useI18n()

// 路由合约地址
const ROUTER_ADDRESS = '0x1F7CdA03D18834C8328cA259AbE57Bf33c46647c'

// LP挖矿信息
const lpMiningInfo = ref({})
// LP挖矿订单列表
const lpMiningOrderList = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)
// 输入金额
const inputAmounts = ref({})

// 链上余额
const chainBalances = ref({})
const isLoadingBalance = ref(false)

// 防止循环更新 - 记录最后一次用户输入的币种
let lastUserInputCoin = null
// 防抖定时器
let debounceTimer = null

// 计算属性 - 数据卡片
const miningCards = computed(() => [
  [
    {
      value: formatNumber(lpMiningInfo.value?.tvl || 0, 3),
      label: t('lpMining.totalLiquidityPool'),
      unit: 'U'
    },
    {
      value: formatNumber(lpMiningInfo.value?.me_lp_amount || 0, 3),
      label: t('lpMining.myLP'),
      unit: ''
    }
  ],
  [
    {
      value: formatNumber(lpMiningInfo.value?.market_cap || 0, 3),
      label: t('lpMining.liquidityMarketCap'),
      unit: 'U'
    },
    {
      value: formatNumber(lpMiningInfo.value?.fdv || 0, 3),
      label: t('lpMining.totalMarketCap'),
      unit: 'U'
    }
  ],
  [
    {
      value: formatNumber(lpMiningInfo.value?.volume_u_24h || 0, 3),
      label: t('lpMining.twentyFourHourTransactionVolume'),
      unit: 'U'
    },
    {
      value: formatNumber(lpMiningInfo.value?.me_lp_power || 0, 3),
      label: t('lpMining.holdingPower'),
      unit: 'T'
    }
  ]
])

// ADX 当前价格
const adxPrice = computed(() => {
  return formatNumber(lpMiningInfo.value?.adx_price || 0, 4)
})

// 配置信息
const config = computed(() => lpMiningInfo.value?.asset_lp_config || {})

// 币种列表 - 转换为数组
const coinList = computed(() => {
  const list = lpMiningInfo.value?.coin_list
  if (!list) return []

  // 如果是对象,转换为数组
  if (typeof list === 'object' && !Array.isArray(list)) {
    return Object.values(list)
  }

  return list
})

// 按钮是否可用
const isButtonDisabled = computed(() => {
  return config.value?.open_enable !== '1'
})

// 获取币种图标 - 直接使用API返回的img字段
const getCoinIcon = (coin) => {
  // 如果传入的是币种对象,返回img字段
  if (coin && typeof coin === 'object') {
    return coin.img || coin.icon || usdtIcon
  }

  // 如果传入的是币种名称,从列表中查找
  if (typeof coin === 'string') {
    const found = coinList.value.find((c) => c.name === coin)
    return found?.img || found?.icon || usdtIcon
  }

  return usdtIcon
}
const params = ref({
  page: 1,
  page_size: 20
})
// 获取链上余额
const getChainBalance = async () => {
  const coins = coinList.value

  if (!coins || coins.length === 0) {
    return
  }

  isLoadingBalance.value = true

  try {
    // 并行获取所有币种的余额
    const balancePromises = coins.map(async (coin) => {
      if (!coin.contract_address) {
        console.warn(`币种 ${coin.name} 没有合约地址`)
        return { name: coin.name, balance: '0' }
      }

      try {
        console.log(`获取 ${coin.name} 余额,合约地址:`, coin.contract_address)
        const balance = await web3.getTokenBalance(coin.contract_address)
        const formattedBalance = ethers.formatUnits(balance, coin.decimals)
        console.log(`${coin.name} 余额:`, formattedBalance)
        return { name: coin.name, balance: formattedBalance }
      } catch (error) {
        console.error(`获取 ${coin.name} 余额失败:`, error)
        return { name: coin.name, balance: '0' }
      }
    })

    const results = await Promise.all(balancePromises)

    // 更新余额对象
    const newBalances = {}
    results.forEach((result) => {
      newBalances[result.name] = result.balance
    })
    chainBalances.value = newBalances
    console.log('所有余额获取完成:', chainBalances.value)
  } catch (error) {
    console.error('获取链上余额失败:', error)
  } finally {
    isLoadingBalance.value = false
  }
}

// 监听币种列表变化,自动获取余额
watch(
  coinList,
  (newList) => {
    if (newList && newList.length > 0) {
      getChainBalance()
    }
  },
  { immediate: true, deep: true }
)

// 获取LP挖矿信息
const getLpMiningInfo = async () => {
  try {
    const res = await api.power.lpMiningInfo()
    lpMiningInfo.value = res

    // 数据加载后获取余额
    if (res?.coin_list && res.coin_list.length > 0) {
      // 延迟执行,确保DOM已更新
      setTimeout(() => {
        getChainBalance()
      }, 500)
    }
  } catch (error) {
    showToast('获取LP挖矿信息失败')
  }
}
// 获取LP挖矿订单列表
const getLpMiningOrderList = async () => {
  try {
    const res = await api.power.lpMiningOrderList(params.value)

    if (res?.list) {
      // 如果是下拉刷新,清空列表
      if (refreshing.value) {
        lpMiningOrderList.value = res.list
        refreshing.value = false
      } else {
        // 否则追加数据
        lpMiningOrderList.value = [...lpMiningOrderList.value, ...res.list]
      }

      total.value = res.total || 0

      // 加载成功后,页码+1,准备下次加载
      params.value.page++

      // 判断是否已加载完所有数据
      if (lpMiningOrderList.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取LP挖矿订单列表失败:', error)
    showToast(error.message || '获取LP挖矿订单列表失败')
    finished.value = true
    loading.value = false
  }
}

// 上拉加载
const onLoad = () => {
  if (refreshing.value) {
    return
  }
  getLpMiningOrderList()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  params.value.page = 1
  lpMiningOrderList.value = []
  getLpMiningOrderList()
}

// 赎回LP
const handleRedeem = async (orderNo) => {
  try {
    showLoadingToast({
      message: '获取赎回信息...',
      forbidClick: true,
      duration: 0
    })

    // 调用接口获取赎回签名数据
    const res = await api.power.lpMiningRedeem({ order_no: orderNo })

    console.log('==================== 赎回订单信息 ====================')
    console.log('合约地址:', res.recharge_contract_address)
    console.log('签名数据:', res.data)
    console.log('====================================================')

    // 直接发送交易
    showLoadingToast({
      message: '发起赎回交易...',
      forbidClick: true,
      duration: 0
    })

    const signer = await web3.provider.getSigner()
    const tx = await signer.sendTransaction({
      to: res.recharge_contract_address,
      data: res.data,
      gasLimit: 500000
    })

    console.log('赎回交易已发送:', tx.hash)

    showLoadingToast({
      message: '链上确认中...',
      duration: 0
    })

    await tx.wait()
    console.log('✅ 赎回交易确认成功')

    closeToast()
    showToast('赎回成功,等待上链~')

    // 刷新列表
    onRefresh()
  } catch (error) {
    console.error('赎回失败:', error)
    closeToast()

    // 用户取消交易
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      showToast('用户取消交易')
    } else {
      showToast(error.message || '赎回失败')
    }
  }
}

// 获取指定币种的余额
const getCoinBalance = (coinName) => {
  return chainBalances.value[coinName] || '0'
}

// 最大化按钮
const handleMax = (coinName) => {
  const balance = getCoinBalance(coinName)
  // 截取3位小数
  inputAmounts.value[coinName] = parseFloat(balance).toFixed(3)
}

// 获取路由兑换价格
const getRouterAmount = async (fromCoin, toCoin, amount) => {
  if (!amount || parseFloat(amount) <= 0) {
    return '0'
  }

  try {
    const path = [fromCoin.contract_address, toCoin.contract_address]
    const amountOut = await web3.getAmountsOut(
      ROUTER_ADDRESS,
      amount,
      path,
      fromCoin.decimals,
      toCoin.decimals
    )
    return amountOut
  } catch (error) {
    console.error('获取路由价格失败:', error)
    return '0'
  }
}

// 处理焦点事件 - 明确标记用户正在输入的币种
const handleFocus = (coinName) => {
  console.log(`用户聚焦到: ${coinName}`)
  lastUserInputCoin = coinName
}

// 处理输入变化 - 统一入口
const handleInputChange = async (coinName, newAmount) => {
  // 清除之前的防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 标记这是用户输入的币种
  lastUserInputCoin = coinName

  // 如果输入为空,清空另一个输入框
  if (!newAmount || coinList.value.length < 2) {
    const otherCoin = coinList.value.find((c) => c.name !== coinName)
    if (otherCoin) {
      inputAmounts.value[otherCoin.name] = ''
    }
    return
  }

  // 防抖处理 - 避免频繁计算
  debounceTimer = setTimeout(async () => {
    const currentCoin = coinList.value.find((c) => c.name === coinName)
    const otherCoin = coinList.value.find((c) => c.name !== coinName)

    if (!currentCoin || !otherCoin) return

    console.log(`输入 ${coinName}: ${newAmount}, 自动计算 ${otherCoin.name}`)

    try {
      const amount = await getRouterAmount(currentCoin, otherCoin, newAmount)

      // 只有当前币种仍然是最后输入的币种时,才更新另一个币种
      // 这样可以避免循环更新
      if (lastUserInputCoin === coinName) {
        inputAmounts.value[otherCoin.name] = formatNumber(amount, 3)
        console.log(`自动计算结果: ${otherCoin.name} = ${amount}`)
      }
    } catch (error) {
      console.error('自动计算失败:', error)
    }
  }, 300) // 300ms防抖
}

// 监听第一个币种输入
watch(
  () => inputAmounts.value[coinList.value[0]?.name],
  (newAmount) => {
    const coinName = coinList.value[0]?.name
    if (!coinName) return

    // 如果这个币种不是最后一次用户输入的,说明是程序自动更新的,跳过
    if (lastUserInputCoin && lastUserInputCoin !== coinName) {
      return
    }

    handleInputChange(coinName, newAmount)
  }
)

// 监听第二个币种输入
watch(
  () => inputAmounts.value[coinList.value[1]?.name],
  (newAmount) => {
    const coinName = coinList.value[1]?.name
    if (!coinName) return

    // 如果这个币种不是最后一次用户输入的,说明是程序自动更新的,跳过
    if (lastUserInputCoin && lastUserInputCoin !== coinName) {
      return
    }

    handleInputChange(coinName, newAmount)
  }
)

onMounted(() => {
  getLpMiningInfo()
})

// 弹窗显示状态
const showLiquidityPopup = ref(false)

// 打开弹窗
const openLiquidityPopup = () => {
  if (isButtonDisabled.value) {
    showToast('当前暂不可提供流动性')
    return
  }

  // 验证输入
  const amount1 = parseFloat(inputAmounts.value[coinList.value[0]?.name])
  const amount2 = parseFloat(inputAmounts.value[coinList.value[1]?.name])

  if (!amount1 || !amount2) {
    showToast('请输入有效的数量')
    return
  }

  showLiquidityPopup.value = true
}

// 确认添加流动性
const handleAddLiquidity = async (data) => {
  // 清空输入
  inputAmounts.value = {}
  showToast('添加成功,等待区块到账~')
}
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="flex gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">LP流动性挖矿</span>
      </div>
      <div class="power-container mt-20 w-100% flex-col pt-40 px-25 pb-50 items-start justify-center">
        <div class="h-81 w-100% flex items-center justify-center gap-26">
          <van-image v-if="coinList[0]" width="40" height="40" :src="getCoinIcon(coinList[0])"
            fit="contain"></van-image>
          <van-image width="9" height="18" :src="addIcon" fit="contain"></van-image>
          <van-image v-if="coinList[1]" width="40" height="40" :src="getCoinIcon(coinList[1])"
            fit="contain"></van-image>
        </div>
        <span class="block mt-23 fsize-30 text-center font-roboto font-700 text-[#fff] leading-normal">PYTHIA-SOTA {{
          t('lpMining.lpMiningPool') }}</span>
        <div class="flex items-center justify-center gap-12 mt-13 w-100%">
          <span class="block fsize-20 text-center font-roboto font-500 text-[#fff] leading-normal opacity-60">{{
            t('lpMining.provideLiquidityToGetPowerReward') }}</span>
          <span class="price-badge px-12 py-4 rounded-8 fsize-18 font-roboto font-500 text-[#fff]">PYTHIA: ${{ adxPrice
            }}</span>
        </div>

        <!-- 列表展示 -->
        <div v-for="(row, rowIndex) in miningCards" :key="rowIndex"
          :class="['flex items-center justify-between gap-21', rowIndex === 0 ? 'mt-30' : 'mt-21']">
          <div v-for="(item, itemIndex) in row" :key="itemIndex"
            class="out-coin flex py-22 px-20 gap-12 rounded-20 items-center justify-start flex-1 h-128">
            <van-image width="16" height="16" :src="checkedIcon" fit="contain"> </van-image>
            <div class="flex flex-col items-start justify-center flex-1">
              <div class="flex items-baseline gap-4">
                <span class="fsize-26 font-roboto font-700 text-[#fff] lh-40">{{
                  item.value
                  }}</span>
                <span v-if="item.unit" class="fsize-20 font-roboto font-400 text-[#fff] lh-40 opacity-50">{{ item.unit
                  }}</span>
              </div>
              <span class="fsize-20 font-roboto font-400 text-[#fff] lh-32 opacity-60">{{
                item.label
                }}</span>
            </div>
          </div>
        </div>

        <!-- 配置提示 -->
        <div v-if="config" class="flex items-center justify-center gap-8 mt-24 w-100%">
          <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
          <!-- <span class="fsize-24 text-[rgba(255,255,255,0.6)] font-pingfang font-400 leading-none"
            >最小投资:{{ config.min_amount }} U | 倍数:{{ config.multiple_amount }}</span
          > -->
          <span class="fsize-24 text-[rgba(255,255,255,0.6)] font-pingfang font-400 leading-none">{{
            t('lpMining.minimumInvestment') }}: {{ config.min_amount }} U
          </span>
        </div>
      </div>

      <!-- 提供流动性 -->
      <div class="flex mt-30 flex-col items-start justify-start gap-30">
        <div class="power-container flex flex-col items-center justify-start w-100% pt-44 pb-55 px-30">
          <div class="flex gap-12 items-center justify-start w-100%">
            <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
            <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
              t('lpMining.provideLiquidity')
              }}</span>
          </div>
          <div class="flex flex-col items-start justify-center w-100%">
            <!-- 循环渲染币种输入框 -->
            <div v-for="(coin, index) in coinList" :key="coin.id" :class="['w-100%', index > 0 ? 'mt-30' : 'mt-30']">
              <div class="flex items-center justify-between w-100%">
                <div class="flex items-center gap-10">
                  <van-image width="24" height="24" :src="getCoinIcon(coin)" fit="contain"></van-image>
                  <span class="block fsize-28 font-roboto font-700 text-[#fff] leading-normal">
                    {{ coin.name }}
                  </span>
                </div>
                <span class="block fsize-24 font-roboto font-400 text-[#fff] leading-normal opacity-60">
                  {{ t('lpMining.balance') }}:{{
                    isLoadingBalance ? '加载中...' : formatNumber(getCoinBalance(coin.name), 3)
                  }}
                </span>
              </div>
              <div class="box-input mt-24 w-100% h-92 flex px-30 items-center justify-between rounded-20">
                <input v-model="inputAmounts[coin.name]" type="number" placeholder="输入数量"
                  @focus="handleFocus(coin.name)"
                  class="input-field flex-1 bg-transparent border-none outline-none fsize-28 font-roboto font-500 text-[#fff]" />
                <span class="fsize-28 font-roboto font-500 text-[#00FF6E] cursor-pointer"
                  @click="handleMax(coin.name)">Max</span>
              </div>
            </div>

            <div class="flex w-100% h-90 mt-30 items-center justify-center">
              <van-button round color="#00FF6E" :disabled="isButtonDisabled"
                class="w-100% h-100% fsize-34 font-roboto font-600 leading-none uppercase"
                @click="openLiquidityPopup">{{ t('lpMining.immediatelyProvide') }}</van-button>
            </div>
            <div v-if="isButtonDisabled" class="flex items-center justify-center gap-8 mt-16 w-100%">
              <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
              <span class="fsize-20 text-[rgba(255,255,255,0.5)] font-pingfang font-400 leading-none">{{
                t('lpMining.cannotProvideLiquidity') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 挖矿记录 -->
      <div class="flex mt-30 flex-col items-start justify-start">
        <div class="power-container flex flex-col items-center justify-start w-100% pt-37 pb-55 px-30">
          <div class="flex items-center justify-between w-100% mb-24">
            <div class="flex gap-12 items-center justify-start">
              <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
              <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">LP订单</span>
            </div>
            <span class="fsize-22 font-miSans font-400 text-[#fff] leading-none opacity-60">{{
              t('lpMining.lpMiningOrderTotal', { count: total })
              }}</span>
          </div>
          <div class="log-line"></div>

          <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
            <van-list v-model:loading="loading" :finished="finished"
              :finished-text="lpMiningOrderList.length > 0 ? '没有更多了' : ''" @load="onLoad" class="log-list">
              <!-- 空状态 -->
              <div v-if="lpMiningOrderList.length === 0 && !loading" class="empty-state">
                <van-empty :description="t('lpMining.noLPOrder')" />
              </div>

              <!-- 列表项 -->
              <div v-for="(item, index) in lpMiningOrderList" :key="item.order_no || index"
                class="flex flex-col items-start justify-center gap-25 w-100%">
                <div class="log-line"></div>
                <div class="flex flex-col w-100% gap-16 pb-20 items-start justify-center">
                  <!-- 订单编号 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.orderNumber')
                      }}</span>
                    <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-normal opacity-80">
                      {{ item.order_no }}
                    </span>
                  </div>
                  <!-- 支付代币 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.payToken')
                      }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                      {{ formatNumber(item.coin1_amount || 0, 3) }} {{ item.coin1 }} +
                      {{ formatNumber(item.coin2_amount || 0, 3) }} {{ item.coin2 }}
                    </span>
                  </div>
                  <!-- 投资数量 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.investmentQuantity')
                      }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                      {{ formatNumber(item.base_amount || 0, 3) }} U
                    </span>
                  </div>
                  <!-- LP数量 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.lpQuantity')
                      }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#16FFC2] leading-normal">
                      {{ formatNumber(item.lp_amount || 0, 3) }}
                    </span>
                  </div>
                  <!-- 总算力 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.totalPower')
                      }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#16FFC2] leading-normal">
                      +{{ formatNumber(item.total_power || 0, 3) }}
                    </span>
                  </div>
                  <!-- 日期 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.date')
                      }}</span>
                    <span class="fsize-24 font-pingfang font-400 text-[#fff] leading-normal opacity-80">
                      {{ item.created_at }}
                    </span>
                  </div>
                  <!-- 状态和赎回按钮 -->
                  <div class="flex items-center justify-between w-100% mt-8">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('lpMining.status')
                      }}</span>
                    <div class="flex items-center gap-16">
                      <span :class="[
                        'fsize-24 font-pingfang font-500 leading-normal',
                        item.state === 1 ? 'text-[#16FFC2]' : 'text-[#fff] opacity-60'
                      ]">
                        {{ item.state === 1 ? t('lpMining.inProgress') : t('lpMining.redeemed') }}
                      </span>
                      <!-- 赎回按钮 -->
                      <van-button v-if="item.state === 1" round size="small" color="#00FF6E" class="redeem-btn"
                        @click="handleRedeem(item.order_no)">{{ t('lpMining.redeem') }}</van-button>
                    </div>
                  </div>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </div>

    <!-- 流动性添加弹窗 -->
    <LiquidityPopup v-model:show="showLiquidityPopup" :coin-list="coinList" :input-amounts="inputAmounts"
      :chain-balances="chainBalances" @confirm="handleAddLiquidity" />
  </div>
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #fdfdfd;
  background: url('@/assets/imgs/mining/ming-bg.png') no-repeat top center;

  background-size: 100% 100%;
  /* 宽度100%，高度自动按比例 */
  display: flex;
  flex-direction: column;

  /* 禁用过度滚动回弹效果 */
  overscroll-behavior: none;

  // iOS 平滑滚动
  -webkit-overflow-scrolling: touch;
  // 防止双击放大
  touch-action: manipulation;
  // 防止长按菜单
  -webkit-touch-callout: none;
  // 防止高亮
  -webkit-tap-highlight-color: transparent;

  /* CSS 变量定义 - 渐变边框 */
  --Linear: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
  --Style: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
  --bgColor: linear-gradient(180deg, #352700 0%, #1d170b 12.2%, #030202 81.32%);
  --Radial: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);

  .body {
    width: 100%;
    padding: 30px 30px 300px;
    position: relative;
  }

  .power-container {
    position: relative;
    border-radius: 30px;
    background: #122626;

    /* 使用伪元素实现渐变边框 */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 30px;
      padding: 2px;
      /* 边框宽度 */
      background: var(--Linear);
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  }
}

.box {
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
}

.price-badge {
  background: rgba(0, 255, 110, 0.15);
  border: 1px solid rgba(0, 255, 110, 0.3);
}

.out-coin {
  background: rgba(0, 255, 110, 0.08);
  border: 1px solid rgba(0, 255, 110, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 110, 0.12);
    border-color: rgba(0, 255, 110, 0.2);
  }
}

.box-input {
  background: rgba(0, 255, 110, 0.08);
  border: 1px solid rgba(0, 255, 110, 0.15);
  transition: all 0.3s ease;

  &:focus-within {
    background: rgba(0, 255, 110, 0.12);
    border-color: rgba(0, 255, 110, 0.3);
    box-shadow: 0 0 0 2px rgba(0, 255, 110, 0.1);
  }
}

.input-field {
  color: #fff;

  &::placeholder {
    color: #bec0ca;
  }

  /* 移除 number 类型的上下箭头 */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
}

.exchange-btn {
  border-radius: 55px;
  background: var(--Style, linear-gradient(180deg, #00ff6e 0%, #009543 100%));
  box-shadow: 0 0 8px 0 rgba(0, 255, 110, 0.25) inset;
}

.log-line {
  width: 100%;
  height: 1px;
  opacity: 0.1;
  background: #fff;
}

/* 空状态 */
.empty-state {
  padding: 80px 0;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.van-empty__description) {
    color: rgba(255, 255, 255, 0.5);
  }
}

/* Vant List 组件样式覆盖 */
.log-list {
  width: 100%;
  min-height: 200px;

  :deep(.van-list__finished-text) {
    color: rgba(255, 255, 255, 0.4);
    font-size: 22px;
    padding: 30px 0;
  }

  :deep(.van-list__loading) {
    padding: 30px 0;

    .van-loading__spinner {
      color: #00ff6e;
    }

    .van-loading__text {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

/* 下拉刷新样式 */
:deep(.van-pull-refresh) {
  min-height: 300px;

  .van-pull-refresh__track {
    .van-pull-refresh__head {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

/* 赎回按钮 */
.redeem-btn {
  padding: 8px 24px;
  font-size: 22px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 500;
  height: auto;
  min-width: 80px;

  :deep(.van-button__content) {
    color: #fff;
  }
}
</style>
