<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import mcnIcon from '@/assets/imgs/coin/mcn-coin.png'
import exchangeIcon from '@/assets/imgs/wallet/exchange.svg'
import PaymentPopup from '@/views/power/components/PaymentPopup.vue'
import Footer from '@/components/footer.vue'

const { t } = useI18n()
const router = useRouter()

// V2 Router（用于获取价格）
const ROUTER_ADDRESS = '0x3E4B742Df4A654F8aaF98B0BBcBAbBf507BF8b53'

// 路由合约 ABI（仅用于查询价格）
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
]

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const WPYTHIA_ADDRESS = '0x504453e7DcF9C6f4c776679498e2b32efc0a9f6b'
const USDT_ADDRESS = '0xa41b749AE2F6bFB14fA5d921DC1114635443dD39'

// 兑换配置信息
const exchangeInfo = ref(null)
// X101 余额
const x101Balance = ref('0')
// GAS 余额
const gasBalance = ref('0')
// 输入数量
const inputAmount = ref('')
// 输出数量（预计获得的 ADX）
const outputAmount = ref('0')
// 是否加载中
const isLoadingBalance = ref(false)
// 是否加载 GAS 余额
const isLoadingGasBalance = ref(false)
// 页面初始化加载状态
const isPageLoading = ref(true)
// 1 X101 等于多少 ADX 的价格
const exchangeRate = ref('0')
// 委托地址
const entrustAddress = ref('')
// 显示设置委托地址弹窗
const showEntrustDialog = ref(false)
// 输入的委托地址
const inputEntrustAddress = ref('')

// 格式化余额显示
const formattedBalance = computed(() => {
  return formatNumber(x101Balance.value, 4)
})

// 格式化 GAS 余额显示
const formattedGasBalance = computed(() => {
  return formatNumber(gasBalance.value, 4)
})

// 格式化输出显示
const formattedOutput = computed(() => {
  return formatNumber(outputAmount.value, 4)
})

const inputTokenName = computed(() => {
  return exchangeInfo.value?.x101?.name || 'SOTA'
})

const outputTokenName = computed(() => {
  return exchangeInfo.value?.mcn?.name || 'PYTHIA'
})

const quoteOutputTokenAddress = computed(() => {
  const outputAddress = exchangeInfo.value?.mcn?.contract_address

  if (!outputAddress) return ''
  if (outputAddress === ZERO_ADDRESS) return WPYTHIA_ADDRESS

  return outputAddress
})

const quotePaths = computed(() => {
  const fromAddress = exchangeInfo.value?.x101?.contract_address
  const toAddress = quoteOutputTokenAddress.value

  if (!fromAddress || !toAddress || fromAddress === ZERO_ADDRESS || toAddress === ZERO_ADDRESS) {
    return []
  }

  const directPath = [fromAddress, toAddress]
  const usdtPath = [fromAddress, USDT_ADDRESS, toAddress]

  return fromAddress.toLowerCase() === USDT_ADDRESS.toLowerCase() || toAddress.toLowerCase() === USDT_ADDRESS.toLowerCase()
    ? [directPath]
    : [directPath, usdtPath]
})

const getAmountsOutByPaths = async (amount, decimals) => {
  if (!quotePaths.value.length) return null

  await web3.ensureReady()
  const routerContract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, web3.provider)
  const amountInWei = ethers.parseUnits(amount.toString(), decimals)

  for (const path of quotePaths.value) {
    try {
      const amounts = await routerContract.getAmountsOut(amountInWei, path)
      return amounts[amounts.length - 1]
    } catch (error) {
      console.warn('报价路径失败，尝试下一条路径:', path, error)
    }
  }

  return null
}

// 获取链上 X101 余额
const getX101Balance = async () => {
  if (!exchangeInfo.value?.x101?.contract_address) {
    return
  }

  isLoadingBalance.value = true
  try {
    // 确保钱包已连接
    await web3.ensureReady()
    const balance = await web3.getTokenBalance(exchangeInfo.value.x101.contract_address)
    const formattedBalance = ethers.formatUnits(balance, exchangeInfo.value.x101.decimals)
    x101Balance.value = formattedBalance
  } catch (error) {
    console.error(`获取 ${inputTokenName.value} 余额失败:`, error)
    x101Balance.value = '0'
    // 抛出错误以便上层处理
    throw new Error(`获取 ${inputTokenName.value} 余额失败`)
  } finally {
    isLoadingBalance.value = false
  }
}

// 获取链上 GAS 余额
const getGasBalance = async () => {
  if (!exchangeInfo.value?.gas?.contract_address) {
    return
  }

  isLoadingGasBalance.value = true
  try {
    // 确保钱包已连接
    await web3.ensureReady()
    const balance = await web3.getTokenBalance(exchangeInfo.value.gas.contract_address)
    const formattedBalance = ethers.formatUnits(balance, exchangeInfo.value.gas.decimals)
    gasBalance.value = formattedBalance
  } catch (error) {
    console.error('获取 GAS 余额失败:', error)
    gasBalance.value = '0'
    // 抛出错误以便上层处理
    throw new Error('获取 GAS 余额失败')
  } finally {
    isLoadingGasBalance.value = false
  }
}

// 获取兑换价格 (1 X101 = ? ADX)
const getExchangeRate = async () => {
  if (!quotePaths.value.length) {
    exchangeRate.value = '0'
    return
  }

  try {
    const amountOut = await getAmountsOutByPaths('1', exchangeInfo.value.x101.decimals)
    if (!amountOut) {
      exchangeRate.value = '0'
      throw new Error('未找到可用报价路径')
    }

    const formattedRate = ethers.formatUnits(amountOut, exchangeInfo.value.mcn.decimals)

    exchangeRate.value = formattedRate
  } catch (error) {
    console.error('获取兑换价格失败:', error)
    exchangeRate.value = '0'
    // 抛出错误以便上层处理
    throw new Error('获取链上兑换价格失败')
  }
}

// 计算输出金额
const calculateOutput = async () => {
  if (!inputAmount.value || parseFloat(inputAmount.value) <= 0) {
    outputAmount.value = '0'
    return
  }

  if (!quotePaths.value.length) {
    outputAmount.value = '0'
    return
  }

  try {
    const amountOut = await getAmountsOutByPaths(inputAmount.value.toString(), exchangeInfo.value.x101.decimals)
    if (!amountOut) {
      outputAmount.value = '0'
      return
    }

    const formatted = ethers.formatUnits(amountOut, exchangeInfo.value.mcn.decimals)

    outputAmount.value = formatted
  } catch (error) {
    console.error('计算输出金额失败:', error)
    outputAmount.value = '0'
  }
}

// 监听输入变化，自动计算输出
watch(inputAmount, () => {
  calculateOutput()
})

// 全部按钮
const handleMax = () => {
  inputAmount.value = parseFloat(x101Balance.value).toFixed(3)
}

// 支付弹窗显示状态
const showPaymentPopup = ref(false)
// 订单信息
const orderInfo = ref(null)

// 执行兑换 - 改为先获取订单
const handleExchange = async () => {
  if (!inputAmount.value || parseFloat(inputAmount.value) <= 0) {
    showToast(t('exchange.pleaseEnterExchangeAmount'))
    return
  }

  if (parseFloat(inputAmount.value) > parseFloat(x101Balance.value)) {
    showToast(t('exchange.balanceNotEnough'))
    return
  }

  if (!exchangeInfo.value?.x101 || !exchangeInfo.value?.mcn) {
    showToast(t('exchange.loadingConfigInfo'))
    return
  }

  try {
    // 显示加载提示
    showLoadingToast({
      message: t('exchange.prepareExchange'),
      duration: 0,
      forbidClick: true
    })

    // 调用获取订单接口
    const res = await api.exchange.getExchangeOrder({
      amount: inputAmount.value
    })

    closeToast()

    // 保存订单信息
    orderInfo.value = res

    // 显示支付弹窗
    showPaymentPopup.value = true
  } catch (error) {
    closeToast()
    showToast(error.message || '获取兑换信息失败')
  }
}

// 确认支付
const handlePayment = async (data) => {
  console.log('==================== 兑换支付成功回调 ====================')
  console.log('支付信息:', data)
  console.log('交易哈希:', data.tx?.hash)
  console.log('====================================================')

  // 支付成功后的处理
  // 1. 清空输入
  inputAmount.value = ''
  outputAmount.value = '0'

  // 2. 显示成功提示
  showToast(t('exchange.exchangeSuccess'))

  // 3. 刷新余额
  setTimeout(async () => {
    await getX101Balance()
    await getGasBalance()
  }, 2000)
}

// 设置委托地址
const handleSetEntrustAddress = async () => {
  if (!inputEntrustAddress.value || !inputEntrustAddress.value.trim()) {
    showToast('请输入委托地址')
    return
  }

  // 简单的以太坊地址格式验证
  if (!/^0x[a-fA-F0-9]{40}$/.test(inputEntrustAddress.value.trim())) {
    showToast('请输入有效的钱包地址')
    return
  }

  try {
    showLoadingToast({
      message: '设置中...',
      duration: 0,
      forbidClick: true
    })

    const res = await api.exchange.setEntrustAddress({
      address: inputEntrustAddress.value.trim()
    })

    closeToast()
    showToast('设置成功')

    // 更新本地委托地址
    entrustAddress.value = inputEntrustAddress.value.trim()

    // 关闭弹窗
    showEntrustDialog.value = false
    inputEntrustAddress.value = ''
  } catch (error) {
    closeToast()
    showToast(error.message || '设置失败，请重试')
  }
}

// 打开设置委托地址弹窗
const openEntrustDialog = () => {
  inputEntrustAddress.value = ''
  showEntrustDialog.value = true
}

onMounted(async () => {
  try {
    isPageLoading.value = true

    // 1. 获取兑换配置信息
    const res = await api.exchange.exchangeInfo()
    const normalizedExchangeInfo = {
      ...res,
      x101: res?.sota || res?.x101 || null,
      mcn: res?.pythia || res?.mcn || null
    }

    if (normalizedExchangeInfo.x101 && normalizedExchangeInfo.mcn) {
      // 兼容后端字段从 x101/mcn 切换为 sota/pythia
      exchangeInfo.value = normalizedExchangeInfo

      // 设置委托地址
      if (res.entrust) {
        entrustAddress.value = res.entrust
      }

      // 2. 并行获取链上数据
      try {
        const results = await Promise.allSettled([
          getX101Balance(),
          getGasBalance(),
          getExchangeRate()
        ])

        // 检查每个请求的结果
        const failedTasks = []

        if (results[0].status === 'rejected') {
          failedTasks.push(`${inputTokenName.value}余额`)
        }
        if (results[1].status === 'rejected') {
          failedTasks.push('GAS余额')
        }
        if (results[2].status === 'rejected') {
          failedTasks.push('兑换价格')
        }

        // 如果有失败的任务，显示提示
        if (failedTasks.length > 0) {
          const errorMsg = `获取${failedTasks.join('、')}失败，请检查网络连接或稍后重试`
          showToast({
            message: errorMsg,
            duration: 3000
          })
        }
      } catch (error) {
        console.error('获取链上数据失败:', error)
        showToast({
          message: '获取链上数据失败，请检查网络连接',
          duration: 3000
        })
      }
    } else {
      showToast(t('exchange.dataFormatError'))
    }
  } catch (error) {
    console.error('获取配置信息失败:', error)
    showToast(t('exchange.getConfigInfoFailed'))
  } finally {
    // 无论成功失败，都隐藏加载状态
    isPageLoading.value = false
  }
})
</script>
<template>
  <div class="container">
    <!-- 页面加载遮罩层 -->
    <div v-if="isPageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <van-loading type="spinner" size="40" color="#00FF6E" />
        <p class="loading-text">{{ t('exchange.loadingChainInfo') }}</p>
        <p class="loading-tips">{{ t('exchange.loadingTips') }}</p>
      </div>
    </div>

    <div class="body" :class="{ 'is-loading': isPageLoading }">
      <!-- 页面标题 -->
      <div class="page-header flex items-center justify-between">
        <div class="flex gap-12 items-center">
          <div class="title-badge"></div>
          <span class="page-title">{{ t('exchange.title') }}</span>
        </div>
        <div class="record-button" @click="router.push('/exchange-log')">
          <van-icon name="orders-o" size="18" color="#00FF6E" />
          <span class="record-text">兑换记录</span>
        </div>
      </div>

      <!-- 兑换卡片 -->
      <div class="swap-card">
        <!-- From Token -->
        <div class="token-section">
          <div class="section-header">
            <span class="section-label">{{ t('exchange.pay') }}</span>
            <div class="balance-info">
              <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
              <span class="balance-text">{{ t('exchange.balance') }}:
                {{ isLoadingBalance ? '...' : formattedBalance }}</span>
            </div>
          </div>

          <div class="token-input-wrapper">
            <div class="token-selector">
              <van-image v-if="exchangeInfo?.x101?.img" width="32" height="32" :src="exchangeInfo.x101.img"
                fit="contain" class="token-icon"></van-image>
              <span class="token-name">{{ inputTokenName }}</span>
            </div>

            <div class="amount-input-group">
              <input v-model="inputAmount" type="number" placeholder="0.00" class="amount-input" />
              <button class="max-btn close-btn-text" @click="handleMax">MAX</button>
            </div>
          </div>
        </div>

        <!-- 交换图标 -->
        <div class="swap-icon-wrapper">
          <div class="swap-icon">
            <van-icon name="exchange" size="20" color="#00FF6E" />
          </div>
        </div>

        <!-- To Token -->
        <div class="token-section">
          <div class="section-header">
            <span class="section-label">{{ t('exchange.receive') }}</span>
          </div>

          <div class="token-input-wrapper">
            <div class="token-selector">
              <van-image v-if="exchangeInfo?.mcn?.img" width="32" height="32" :src="exchangeInfo.mcn.img" fit="contain"
                class="token-icon"></van-image>
              <span class="token-name">{{ outputTokenName }}</span>
            </div>

            <div class="amount-display">
              <span class="amount-text">{{ formattedOutput }}</span>
            </div>
          </div>
        </div>

        <!-- 兑换价格信息 -->
        <div v-if="exchangeRate && parseFloat(exchangeRate) > 0" class="exchange-rate-info">
          <div class="rate-item">
            <span class="rate-label">{{ t('exchange.exchangeRate') }}</span>
            <span class="rate-value">1 {{ inputTokenName }} ≈ {{ formatNumber(exchangeRate, 4) }}
              {{ outputTokenName }}</span>
          </div>
          <!-- <div class="rate-item">
            <span class="rate-label">{{ t('exchange.slipProtection') }}</span>
            <span class="rate-value">20%</span>
          </div> -->
        </div>

        <!-- 兑换按钮 -->
        <button class="swap-button" @click="handleExchange">
          <!-- <van-image width="18" height="18" :src="exchangeIcon" fit="contain"></van-image> -->
          <span class="swap-button-text close-btn-text">{{
            t('exchange.immediatelyExchange')
          }}</span>
        </button>
      </div>

      <!-- 委托地址卡片 -->
      <div class="entrust-card">
        <div class="entrust-header">
          <van-icon name="manager-o" size="16" color="#00FF6E" />
          <span class="entrust-title">委托地址</span>
        </div>
        <div class="entrust-content">
          <!-- 已设置委托地址 -->
          <div v-if="entrustAddress" class="entrust-address-display">
            <span class="address-label">当前委托地址：</span>
            <span class="address-value">{{ entrustAddress }}</span>
          </div>
          <!-- 未设置委托地址 -->
          <button v-else class="set-entrust-button close-btn-text" @click="openEntrustDialog">
            <van-icon name="plus" size="18" />
            <span>设置委托地址</span>
          </button>
        </div>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-card">
        <div class="tips-header">
          <van-icon name="info-o" size="16" color="#00FF6E" />
          <span class="tips-title">{{ t('exchange.tips') }}</span>
        </div>
        <div class="tips-content">
          <!-- <p class="tip-item">• {{ t('exchange.tips1') }}</p> -->
          <p class="tip-item">• {{ t('exchange.tips2') }}</p>
          <p class="tip-item">• {{ t('exchange.tips3') }}</p>

          <!-- GAS 余额显示 -->
          <div class="gas-balance-info">
            <div class="flex items-center gap-10">
              <!-- <van-image
                v-if="exchangeInfo?.gas?.img"
                width="24"
                height="24"
                :src="exchangeInfo.gas.img"
                fit="contain"
                class="gas-icon"></van-image> -->
              <span class="gas-label">{{ exchangeInfo?.gas?.name || 'GAS' }} {{ t('exchange.balance') }}:</span>
              <span class="gas-amount">
                {{ isLoadingGasBalance ? t('exchange.loading') : formattedGasBalance }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 设置委托地址弹窗 -->
  <van-popup v-model:show="showEntrustDialog" position="center" :style="{ width: '85%', maxWidth: '450px' }" round
    closeable close-icon="cross" :overlay-style="{ background: 'rgba(0, 0, 0, 0.7)' }">
    <div class="entrust-dialog">
      <div class="dialog-header">
        <van-icon name="manager-o" size="24" color="#00FF6E" />
        <span class="dialog-title">设置委托地址</span>
      </div>

      <div class="dialog-body">
        <div class="input-wrapper">
          <input v-model="inputEntrustAddress" type="text" placeholder="请输入委托地址（0x开头）" maxlength="42"
            class="address-input" />
          <van-icon v-if="inputEntrustAddress" name="cross" size="20" color="rgba(255, 255, 255, 0.4)"
            class="clear-icon" @click="inputEntrustAddress = ''" />
        </div>

        <div class="dialog-tip">
          <van-icon name="info-o" size="14" color="rgba(255, 255, 255, 0.5)" />
          <span>请输入有效的以太坊钱包地址</span>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="showEntrustDialog = false">取消</button>
        <button class="confirm-btn close-btn-text" @click="handleSetEntrustAddress">确认</button>
      </div>
    </div>
  </van-popup>

  <!-- 支付弹窗 -->
  <PaymentPopup v-model:show="showPaymentPopup" :order-info="orderInfo" title="发起兑换" @confirm="handlePayment" />

  <Footer />
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: url('@/assets/imgs/power/power-log-bg.png') no-repeat top center;
  background-size: 100% 100%;
  display: flex;
  flex-direction: column;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  --Style: linear-gradient(180deg, #3fff6c 0%, #009543 100%);

  // 页面加载遮罩层
  .page-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 50px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);

      .loading-text {
        font-size: 28px;
        font-weight: 600;
        color: #fff;
        margin: 0;
        font-family: 'PingFang SC', sans-serif;
      }

      .loading-tips {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
        font-family: 'PingFang SC', sans-serif;
        text-align: center;
        max-width: 300px;
      }
    }
  }

  .body {
    width: 100%;
    padding: 40px 30px 100px;
    display: flex;
    flex-direction: column;
    gap: 30px;

    // 加载时降低不透明度
    &.is-loading {
      opacity: 0.3;
      pointer-events: none;
    }
  }
}

/* 页面标题 */
.page-header {
  .title-badge {
    width: 8px;
    height: 32px;
    border-radius: 4px;
    background: var(--Style);
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
    letter-spacing: 1px;
  }

  .record-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: 20px;
    background: rgba(0, 255, 110, 0.1);
    border: 1px solid rgba(0, 255, 110, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 255, 110, 0.2);
      border-color: rgba(0, 255, 110, 0.5);
    }

    &:active {
      transform: scale(0.95);
    }

    .record-text {
      font-size: 22px;
      font-weight: 500;
      color: #00ff6e;
      font-family: 'PingFang SC', sans-serif;
      white-space: nowrap;
    }
  }
}

/* 兑换卡片 */
.swap-card {
  position: relative;
  width: 100%;
  padding: 35px 25px;
  border-radius: 24px;
  background: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

/* Token 区域 */
.token-section {
  margin-bottom: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-label {
      font-size: 24px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-family: 'Roboto', sans-serif;
    }

    .balance-info {
      display: flex;
      align-items: center;
      gap: 6px;

      .balance-text {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Roboto', sans-serif;
      }
    }
  }

  .token-input-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .token-selector {
      display: flex;
      align-items: center;
      gap: 12px;

      .token-icon {
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .token-name {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        font-family: 'Roboto', sans-serif;
        letter-spacing: 0.5px;
      }
    }

    .amount-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      justify-content: flex-end;

      .amount-input {
        flex: 1;
        max-width: 200px;
        background: transparent;
        border: none;
        outline: none;
        font-size: 32px;
        font-weight: 600;
        color: #fff;
        text-align: right;
        font-family: 'Roboto', sans-serif;

        &::placeholder {
          color: rgba(255, 255, 255, 0.3);
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

      .max-btn {
        padding: 8px 20px;
        background: linear-gradient(135deg, #00ff6e 0%, #009543 100%);
        border: none;
        border-radius: 12px;
        font-size: 22px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 255, 110, 0.3);

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .amount-display {
      flex: 1;
      display: flex;
      justify-content: flex-end;

      .amount-text {
        font-size: 32px;
        font-weight: 600;
        color: #fff;
        font-family: 'Roboto', sans-serif;
      }
    }
  }
}

/* 交换图标 */
.swap-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 40%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  .swap-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(0, 255, 110, 0.3);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1;

    &:hover {
      background: rgba(0, 255, 110, 0.15);
      border-color: rgba(0, 255, 110, 0.5);
      transform: rotate(180deg);
    }
  }
}

/* 兑换价格信息 */
.exchange-rate-info {
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .rate-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .rate-label {
      font-size: 22px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.6);
      font-family: 'Roboto', sans-serif;
    }

    .rate-value {
      font-size: 22px;
      font-weight: 500;
      color: #fff;
      font-family: 'Roboto', sans-serif;
    }
  }
}

/* 兑换按钮 */
.swap-button {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #00ff6e 0%, #009543 100%);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 255, 110, 0.4);
  margin-top: 12px;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 255, 110, 0.6);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  .swap-button-text {
    font-size: 28px;
    font-weight: 600;
    color: #fff;
    font-family: 'Roboto', sans-serif;
    letter-spacing: 1px;
  }
}

/* 温馨提示卡片 */
.tips-card {
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .tips-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .tips-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .tips-content {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .tip-item {
      font-size: 22px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      font-family: 'PingFang SC', sans-serif;
      margin: 0;
    }

    .gas-balance-info {
      margin-top: 12px;
      padding: 16px;
      background: rgba(0, 255, 110, 0.08);
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 110, 0.15);

      .gas-icon {
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .gas-label {
        font-size: 22px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        font-family: 'PingFang SC', sans-serif;
      }

      .gas-amount {
        font-size: 24px;
        font-weight: 600;
        color: #00ff6e;
        font-family: 'Roboto', sans-serif;
      }
    }
  }
}

/* 委托地址卡片 */
.entrust-card {
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .entrust-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .entrust-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .entrust-content {
    .entrust-address-display {
      padding: 16px;
      background: rgba(0, 255, 110, 0.08);
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 110, 0.15);
      display: flex;
      flex-direction: column;
      gap: 8px;

      .address-label {
        font-size: 20px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'PingFang SC', sans-serif;
      }

      .address-value {
        font-size: 22px;
        font-weight: 500;
        color: #00ff6e;
        font-family: 'Roboto', monospace;
        word-break: break-all;
      }
    }

    .set-entrust-button {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #00ff6e 0%, #009543 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 255, 110, 0.3);
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;

      &:hover {
        box-shadow: 0 6px 18px rgba(0, 255, 110, 0.5);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

/* 委托地址弹窗样式 */
.entrust-dialog {
  padding: 30px 25px;
  background: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);
  border-radius: 24px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;

    .dialog-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .dialog-body {
    position: relative;
    z-index: 1;
    margin-bottom: 24px;

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;

      &:focus-within {
        background: rgba(255, 255, 255, 0.12);
        border-color: #00ff6e;
        box-shadow: 0 0 0 2px rgba(0, 255, 110, 0.2);
      }

      .address-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 22px;
        font-weight: 500;
        color: #fff;
        font-family: 'Roboto', monospace;
        letter-spacing: 0.5px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-family: 'PingFang SC', sans-serif;
          letter-spacing: 0;
        }
      }

      .clear-icon {
        flex-shrink: 0;
        margin-left: 10px;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        &:active {
          transform: scale(0.9);
        }
      }
    }

    .dialog-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 0 4px;

      span {
        font-size: 20px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'PingFang SC', sans-serif;
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    position: relative;
    z-index: 1;

    button {
      flex: 1;
      height: 54px;
      border: none;
      border-radius: 12px;
      font-size: 26px;
      font-weight: 600;
      font-family: 'PingFang SC', sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
      }
    }

    .cancel-btn {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .confirm-btn {
      background: linear-gradient(135deg, #00ff6e 0%, #009543 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 255, 110, 0.4);

      &:hover {
        box-shadow: 0 6px 18px rgba(0, 255, 110, 0.6);
      }
    }
  }
}

/* 自定义 van-popup 关闭按钮样式 */
:deep(.van-popup__close-icon) {
  color: rgba(255, 255, 255, 0.6);
  font-size: 22px;
  top: 20px;
  right: 20px;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

// 淡入动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.close-btn-text {
  color: #000 !important;
  /* 按钮文字颜色改为黑色 */
}
</style>
