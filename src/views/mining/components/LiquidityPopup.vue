<script setup>
import { ref, computed, watch } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import addIcon from '@/assets/imgs/mining/add.svg'
import api from '@/apis'
import web3 from '@/utils/useWeb3'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  // 币种列表
  coinList: {
    type: Array,
    default: () => []
  },
  // 输入的数量
  inputAmounts: {
    type: Object,
    default: () => ({})
  },
  // 链上余额
  chainBalances: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'confirm'])

// 路由合约地址
const ROUTER_ADDRESS = '0x3E4B742Df4A654F8aaF98B0BBcBAbBf507BF8b53'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const WPYTHIA_ADDRESS = '0x504453e7DcF9C6f4c776679498e2b32efc0a9f6b'

// PYTHIA 对 SOTA 的价格
const exchangePrice = ref('')

// 确认中状态
const isConfirming = ref(false)

const pythiaCoin = computed(() => {
  return props.coinList.find((coin) => coin.name === 'PYTHIA') || props.coinList[0] || null
})

const sotaCoin = computed(() => {
  return props.coinList.find((coin) => coin.name === 'SOTA') || props.coinList[1] || null
})

const isUserRejectedError = (error) => {
  return error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.info?.error?.code === 4001
}

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 获取路由兑换价格 1 PYTHIA = ? SOTA
const getExchangePrice = async () => {
  if (!pythiaCoin.value || !sotaCoin.value) return

  try {
    const fromAddress = pythiaCoin.value.contract_address === ZERO_ADDRESS
      ? WPYTHIA_ADDRESS
      : pythiaCoin.value.contract_address
    const toAddress = sotaCoin.value.contract_address === ZERO_ADDRESS
      ? WPYTHIA_ADDRESS
      : sotaCoin.value.contract_address
    const path = [fromAddress, toAddress]
    const price = await web3.getAmountsOut(
      ROUTER_ADDRESS,
      '1',
      path,
      pythiaCoin.value.decimals,
      sotaCoin.value.decimals
    )

    exchangePrice.value = parseFloat(price).toFixed(6)
    console.log('1 PYTHIA = ', exchangePrice.value, 'SOTA')
  } catch (error) {
    console.error('获取兑换价格失败:', error)
  }
}

// 监听弹窗显示,获取价格
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      getExchangePrice()
    }
  }
)

// 确认添加流动性
const handleConfirm = async () => {
  // 防止重复点击
  if (isConfirming.value) {
    return
  }

  if (!pythiaCoin.value || !sotaCoin.value) {
    showToast('币种信息错误')
    return
  }

  const amount1 = props.inputAmounts[pythiaCoin.value.name]
  const amount2 = props.inputAmounts[sotaCoin.value.name]

  if (!amount1 || !amount2) {
    showToast('请输入数量')
    return
  }

  const pythiaBalance = parseFloat(props.chainBalances[pythiaCoin.value.name] || 0)
  const sotaBalance = parseFloat(props.chainBalances[sotaCoin.value.name] || 0)

  if (parseFloat(amount1) > pythiaBalance) {
    showToast(`${pythiaCoin.value.name}余额不足`)
    return
  }

  if (parseFloat(amount2) > sotaBalance) {
    showToast(`${sotaCoin.value.name}余额不足`)
    return
  }

  if (!exchangePrice.value) {
    showToast('正在获取价格,请稍后')
    return
  }

  try {
    isConfirming.value = true

    // 显示加载提示
    showLoadingToast({
      message: '获取订单中...',
      forbidClick: true,
      duration: 0
    })

    // 调用接口获取订单信息
    const res = await api.power.lpMiningGetOrder({
      amount1,
      amount2,
      price: exchangePrice.value
    })

    closeToast()

    console.log('LP订单信息:', res)

    // 调用双币支付
    await handleDualPayment(res)
  } catch (error) {
    closeToast()
    showToast(error.message || '获取订单信息失败')
  } finally {
    isConfirming.value = false
  }
}

// 处理双币支付
const handleDualPayment = async (orderInfo) => {
  try {
    const { recharge_contract_address, data, need_pay_x101, need_pay_adx } = orderInfo
    const normalizedPythiaToken = {
      ...need_pay_x101,
      name: pythiaCoin.value?.name || need_pay_x101?.name,
      symbol: pythiaCoin.value?.name || need_pay_x101?.symbol,
      address: pythiaCoin.value?.contract_address || need_pay_x101?.address,
      decimals: pythiaCoin.value?.decimals ?? need_pay_x101?.decimals ?? 18,
      img: pythiaCoin.value?.img || need_pay_x101?.img,
      is_native: pythiaCoin.value?.contract_address === ZERO_ADDRESS
    }
    const normalizedSotaToken = {
      ...need_pay_adx,
      name: sotaCoin.value?.name || need_pay_adx?.name,
      symbol: sotaCoin.value?.name || need_pay_adx?.symbol,
      address: sotaCoin.value?.contract_address || need_pay_adx?.address,
      decimals: sotaCoin.value?.decimals ?? need_pay_adx?.decimals ?? 18,
      img: sotaCoin.value?.img || need_pay_adx?.img
    }

    // LP 链路单独兼容 PYTHIA 原生币 + SOTA 代币，不影响其他双 ERC20 场景
    const tx = await web3.payWithLpDualAsset({
      contractAddress: recharge_contract_address,
      data: data,
      token1: normalizedPythiaToken,
      token2: normalizedSotaToken,
      value: orderInfo?.value
    })
    // 关闭弹窗
    closePopup()

    // 通知父组件刷新
    emit('confirm', { tx })
  } catch (error) {
    if (isUserRejectedError(error)) {
      return
    }

    console.error('支付失败:', error)
    throw error
  }
}
</script>

<template>
  <van-popup :show="show" position="bottom" :style="{ background: 'transparent', padding: '0 26px 72px' }"
    :overlay-style="{ backdropFilter: 'blur(4px)' }" @click-overlay="closePopup">
    <div class="liquidity-popup">
      <div class="flex items-center justify-between w-100%">
        <!-- 标题 -->
        <div class="popup-title">{{ t('miningPopup.addLiquidity') }}</div>
        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closePopup">
          <van-icon name="cross" size="24" color="#fff" />
        </div>
      </div>
      <div class="box-line mt-27 mb-44 w-100% bg-[#fff] opacity-25 h-2"></div>

      <!-- 质押代币 -->
      <div class="section-title">{{ t('miningPopup.stakeToken') }}</div>
      <div class="coin-type-box">
        <div class="coin-icons">
          <van-image v-for="(coin, index) in coinList" :key="coin.id" :class="[index > 0 ? '-ml-14' : '']" width="22"
            height="22" :src="coin.img" fit="contain"></van-image>
        </div>
        <span class="coin-type-text">
          {{coinList.map((c) => c.name).join(' + ')}}
        </span>
      </div>

      <!-- 支付详情 -->
      <div class="section-title mt-32">{{ t('miningPopup.paymentDetails') }}</div>
      <div class="payment-details">
        <div v-for="coin in coinList" :key="coin.id" class="payment-item">
          <div class="flex items-center gap-10">
            <van-image width="24" height="24" :src="coin.img" fit="contain"></van-image>
            <span class="coin-name">{{ coin.name }}</span>
          </div>
          <div class="flex flex-col items-end gap-4">
            <span class="amount">{{ formatNumber(inputAmounts[coin.name] || 0, 3) }}</span>
            <span class="balance">{{ t('miningPopup.balance') }}: {{ formatNumber(chainBalances[coin.name] || 0, 3)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 汇率信息 -->
      <div v-if="exchangePrice" class="exchange-rate">
        <div class="dot"></div>
        <span>1 {{ pythiaCoin?.name || 'PYTHIA' }} ≈ {{ exchangePrice }} {{ sotaCoin?.name || 'SOTA' }}</span>
      </div>

      <!-- 确定按钮 -->
      <div @click="handleConfirm" :class="[
        'confirm-btn',
        {
          disabled: !inputAmounts[coinList[0]?.name] || !inputAmounts[coinList[1]?.name] || isConfirming
        }
      ]">
        <span v-if="isConfirming">{{ t('miningPopup.adding') }}...</span>
        <span v-else>{{ t('miningPopup.immediatelyAdd') }}</span>
      </div>
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
/* 弹窗容器 */
.liquidity-popup {
  position: relative;
  width: 100%;
  padding: 35px 30px 47px;
  border-radius: 40px;
  background: linear-gradient(180deg, #000 0%, #450047 100%);

  /* 渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 40px;
    padding: 2px;
    background: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }

  >* {
    position: relative;
    z-index: 1;
  }
}

/* 关闭按钮 */
.close-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.9);
  }
}

/* 标题 */
.popup-title {
  font-size: 36px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

/* 小标题 */
.section-title {
  font-size: 32px;
  font-family: Roboto, sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20px;

  &.mt-32 {
    margin-top: 32px;
  }
}

/* 币种类型选择框 */
.coin-type-box {
  display: flex;
  width: 100%;
  height: 90px;
  padding: 0 30px;
  background: rgba(255, 154, 252, 0.1);
  align-items: center;
  justify-content: flex-start;
  gap: 15px;
  border-radius: 20px;
}

.coin-icons {
  display: flex;
  align-items: center;
}

.coin-type-text {
  font-size: 26px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  color: #fff;
  line-height: 1;
}

/* 支付详情 */
.payment-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.payment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 24px 30px;
  background: rgba(255, 154, 252, 0.1);
  border-radius: 20px;
}

.coin-name {
  font-size: 26px;
  font-family: Roboto, sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.amount {
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.balance {
  font-size: 22px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

/* 汇率信息 */
.exchange-rate {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    opacity: 0.6;
  }

  span {
    color: #eadeff;
    font-family: Roboto;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }
}

/* 确定按钮 */
.confirm-btn {
  width: 100%;
  height: 88px;
  border-radius: 8888px;
  background: #00ff6e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  span {
    font-size: 32px;
    font-family: Roboto, sans-serif;
    font-weight: 600;
    color: #000;
    line-height: 1;
  }

  &:active {
    transform: scale(0.98);
    background: #d8038a;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
