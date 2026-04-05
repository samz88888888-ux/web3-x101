<script setup>
import { ref, computed, watch } from 'vue'
import { ethers } from 'ethers'
import api from '@/apis'
import web3 from '@/utils/useWeb3'
import { formatNumber } from '@/utils/format'
import { showLoadingToast, closeToast, showToast } from 'vant'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import mcnIcon from '@/assets/imgs/coin/mcn-coin.png'
import adxIcon from '@/assets/imgs/coin/adx-coin.png'
import pytIcon from '@/assets/imgs/coin/pyt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin-old.png'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  orderInfo: {
    type: Object,
    default: null
  },
  systemBalance: {
    type: [String, Number],
    default: 0
  },
  title: {
    type: String,
    default: ''
  }
})
const { t } = useI18n()

const NATIVE_PAYMENT_NAMES = ['PYT', 'PYTHIA']

// 弹窗标题
const popupTitle = computed(() => {
  return props.title || t('power.immediatelySubscribe')
})

const emit = defineEmits(['update:show', 'confirm'])

const getTokenIcon = (tokenName, tokenImg) => {
  if (tokenImg) return tokenImg

  const normalizedName = (tokenName || '').toUpperCase()

  if (normalizedName === 'PYTHIA' || normalizedName === 'PYT') return pytIcon
  if (normalizedName === 'ADX') return adxIcon
  if (normalizedName === 'MCN') return mcnIcon
  if (normalizedName === 'X101') return x101Icon

  return usdtIcon
}

const isSystemBalancePayment = computed(() => {
  return props.orderInfo?.payment_mode === 'system_balance' || props.orderInfo?.amount_type === 4
})

const isNativePayment = computed(() => {
  if (!props.orderInfo?.need_pay || isSystemBalancePayment.value) return false

  const normalizedName = (props.orderInfo.need_pay.name || '').toUpperCase()
  return props.orderInfo.need_pay.is_native === true || props.orderInfo.need_pay.is_native === 1 || NATIVE_PAYMENT_NAMES.includes(normalizedName)
})

// 支付数量(从订单信息中获取,不可修改)
const paymentAmount = computed(() => {
  return props.orderInfo?.need_pay?.amount || '0'
})

// 代币信息
const tokenInfo = computed(() => {
  if (!props.orderInfo?.need_pay) return null

  return {
    name: props.orderInfo.need_pay.name,
    symbol: props.orderInfo.need_pay.name,
    address: props.orderInfo.need_pay.address,
    decimals: props.orderInfo.need_pay.decimals,
    icon: getTokenIcon(props.orderInfo.need_pay.name, props.orderInfo.need_pay.img),
    balance: chainBalance.value
  }
})

// 链上余额
const chainBalance = ref('0')
const isLoadingBalance = ref(false)

// 支付确认中状态
const isConfirming = ref(false)

const tokenAddressText = computed(() => {
  if (isSystemBalancePayment.value) {
    return ''
  }

  if (!tokenInfo.value?.address) {
    return isNativePayment.value ? 'Native Coin' : '--'
  }

  return `${tokenInfo.value.address.slice(0, 6)}...${tokenInfo.value.address.slice(-4)}`
})

const balanceLabel = computed(() => {
  return isSystemBalancePayment.value ? t('power.chainBalanceText') : `${t('power.chainBalance')}:`
})

// 读取链上余额 - 使用 useWeb3 提供的方法
const getChainBalance = async () => {
  if (!props.orderInfo?.need_pay || !props.show) return

  try {
    isLoadingBalance.value = true

    if (isSystemBalancePayment.value) {
      chainBalance.value = props.systemBalance?.toString?.() || `${props.systemBalance || 0}`
      return
    }

    const decimals = props.orderInfo.need_pay.decimals

    const balance = isNativePayment.value
      ? await web3.getNativeBalance()
      : await web3.getTokenBalance(props.orderInfo.need_pay.address)

    // 格式化余额
    chainBalance.value = ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error('获取链上余额失败:', error)
    chainBalance.value = '0'
  } finally {
    isLoadingBalance.value = false
  }
}

// 监听弹窗显示状态,显示时获取余额
watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.orderInfo) {
      getChainBalance()
    } else {
      // 关闭时重置余额
      chainBalance.value = '0'
    }
  },
  { immediate: true }
)

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 确认支付
const handleConfirm = async () => {
  // 防止重复点击
  if (isConfirming.value) {
    return
  }

  if (!paymentAmount.value || !tokenInfo.value) {
    return
  }

  // 不在这里检查余额,让链上支付时自动检查
  // 因为余额可能在后台刚刚到账,这里显示的余额可能不是最新的

  try {
    isConfirming.value = true

    if (isSystemBalancePayment.value) {
      if (parseFloat(props.systemBalance || 0) < parseFloat(paymentAmount.value || 0)) {
        showToast('X101余额不足')
        return
      }

      showLoadingToast({
        message: t('power.loading'),
        forbidClick: true,
        duration: 0
      })

      const res = await api.power.powerX101Push({
        num: paymentAmount.value,
        amount_type: props.orderInfo.amount_type
      })

      closeToast()
      showToast(t('power.paymentSuccess'))

      emit('confirm', {
        amount: paymentAmount.value,
        token: tokenInfo.value,
        orderInfo: props.orderInfo,
        tx: null,
        response: res
      })

      closePopup()
      return
    }

    const paymentPayload = {
      recharge_contract_address: props.orderInfo.recharge_contract_address,
      data: props.orderInfo.data,
      need_pay: props.orderInfo.need_pay,
      value: props.orderInfo.value
    }

    // 原生币直接携带 value 支付，代币继续走授权支付
    const tx = isNativePayment.value
      ? await web3.payWithNativeCoinOnly(paymentPayload)
      : await web3.payWithTokenOnly(paymentPayload)

    // 支付成功,触发确认事件
    emit('confirm', {
      amount: paymentAmount.value,
      token: tokenInfo.value,
      orderInfo: props.orderInfo,
      tx: tx
    })

    closePopup()
  } catch (error) {
    closeToast()
    console.error('支付失败:', error)
    // 错误已经在 payWithTokenOnly 中处理了,这里不需要额外处理
  } finally {
    isConfirming.value = false
  }
}

// 设置最大值(当前场景不需要,因为金额固定)
const setMax = () => {
  // 金额固定,不可修改
}
</script>

<template>
  <van-popup :show="show" position="bottom" :style="{ background: 'transparent', padding: '0 26px 72px' }"
    :overlay-style="{ backdropFilter: 'blur(4px)' }" @click-overlay="closePopup">
    <div class="payment-popup">
      <div class="flex items-center justify-between w-100%">
        <!-- 标题 -->
        <div class="popup-title">{{ popupTitle }}</div>
        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closePopup">
          <van-icon name="cross" size="24" color="#fff" />
        </div>
      </div>
      <div class="box-line mt-27 mb-44 w-100% bg-[#fff] opacity-25 h-2"></div>

      <!-- 支付数量 -->
      <div class="section-title">{{ t('power.paymentAmount') }}</div>
      <div class="input-wrapper">
        <div class="amount-input-container">
          <div class="amount-display">
            {{ formatNumber(paymentAmount, 6) }}
          </div>
          <span class="token-symbol">{{ tokenInfo?.symbol || '' }}</span>
        </div>
      </div>

      <!-- 支付代币 -->
      <div class="section-title mt-32">{{ t('power.paymentToken') }}</div>
      <div class="token-list">
        <div v-if="tokenInfo" class="token-item selected">
          <div class="token-info">
            <van-image width="35" height="35" :src="tokenInfo.icon" fit="contain"></van-image>
            <div class="token-detail">
              <span class="token-name">{{ tokenInfo.name }}</span>
              <span class="token-address">{{ tokenAddressText }}</span>
            </div>
          </div>
          <div class="token-balance">
            <span class="balance-label">{{ balanceLabel }}</span>
            <span class="balance-value">
              {{ isLoadingBalance ? t('power.loading') : formatNumber(chainBalance, 6) }}
            </span>
          </div>
        </div>
        <div v-else class="empty-state">
          <span>{{ t('power.noTokenInfo') }}</span>
        </div>
      </div>

      <!-- 确定按钮 -->
      <div @click="handleConfirm" :class="[
        'confirm-btn',
        { disabled: !paymentAmount || !tokenInfo || isLoadingBalance || isConfirming }
      ]">
        <span v-if="isConfirming">{{ t('power.confirming') }}...</span>
        <span v-else>{{ t('power.confirm') }}</span>
      </div>
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
/* 弹窗容器 */
.payment-popup {
  position: relative;
  width: 100%;
  padding: 35px 30px 47px;
  border-radius: 40px;
  background: #122626;

  /* 渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 40px;
    padding: 2px;
    background: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
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

/* 输入框容器 */
.input-wrapper {
  width: 100%;
  margin-bottom: 20px;
}

/* 输入框外层容器 */
.amount-input-container {
  position: relative;
  width: 100%;
  height: 90px;
  padding: 0 30px;
  border-radius: 20px;
  background: rgba(255, 154, 252, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 输入框 */
.amount-input {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  line-height: 1;

  &::placeholder {
    color: #bec0ca;
    font-size: 28px;
    font-family: Roboto, sans-serif;
    font-weight: 500;
  }
}

/* 金额显示(不可编辑) */
.amount-display {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  line-height: 1;
}

/* 代币符号 */
.token-symbol {
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  color: #00ff6e;
  margin-left: 10px;
}

/* Max按钮 */
.max-btn {
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  color: #00ff6e;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}

/* 代币列表 */
.token-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
  max-height: 400px;
  overflow-y: auto;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 110, 0.5);
    border-radius: 2px;

    &:hover {
      background: rgba(0, 255, 110, 0.7);
    }
  }
}

/* 代币项 */
.token-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 110px;
  padding: 10px 30px;
  border-radius: 20px;
  background: rgba(255, 154, 252, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  &.selected {
    background: rgba(0, 255, 110, 0.2);
    border: 1px solid #00ff6e;
  }
}

/* 代币信息 */
.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-name {
  font-size: 30px;
  font-family: Roboto, sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.token-address {
  font-size: 20px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

/* 代币余额 */
.token-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.balance-label {
  font-size: 20px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  color: #eadeff;
  line-height: 1;
  opacity: 0.8;
}

.balance-value {
  font-size: 24px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  color: #fff;
  line-height: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
}

/* 选中标记 */
.selected-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 255, 110, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
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
    background: #00d95c;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
