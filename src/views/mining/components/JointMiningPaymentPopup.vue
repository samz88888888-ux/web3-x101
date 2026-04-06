<template>
  <van-popup
    :show="show"
    position="bottom"
    :style="{ background: 'transparent', padding: '0 26px 72px' }"
    :overlay-style="{ backdropFilter: 'blur(4px)' }"
    @click-overlay="closePopup">
    <div class="liquidity-popup">
      <div class="flex items-center justify-between w-100%">
        <!-- 标题 -->
        <div class="popup-title">{{ t('miningPopup.confirmPayment') }}</div>
        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closePopup">
          <van-icon name="cross" size="24" color="#fff" />
        </div>
      </div>
      <div class="box-line mt-27 mb-44 w-100% bg-[#fff] opacity-25 h-2"></div>

      <!-- 质押代币 -->
      <div class="section-title">{{ t('miningPopup.payToken') }}</div>
      <div class="coin-type-box">
        <div class="coin-icons">
          <van-image
            v-for="(coin, index) in needPayList"
            :key="index"
            :class="[index > 0 ? '-ml-14' : '']"
            width="22"
            height="22"
            :src="coin.img || defaultCoinIcon"
            fit="contain"></van-image>
        </div>
        <span class="coin-type-text">
          {{ needPayList.map((c) => c.name).join(' + ') }}
        </span>
      </div>

      <!-- 支付详情 -->
      <div class="section-title mt-32">{{ t('miningPopup.paymentDetails') }}</div>
      <div class="payment-details">
        <div v-for="(coin, index) in needPayList" :key="index" class="payment-item">
          <div class="flex items-center gap-10">
            <van-image
              width="24"
              height="24"
              :src="coin.img || defaultCoinIcon"
              fit="contain"></van-image>
            <span class="coin-name">{{ coin.name }}</span>
          </div>
          <div class="flex flex-col items-end gap-4">
            <span class="amount">{{ formatNumber(coin.amount || 0, 3) }}</span>
            <span class="balance" :class="{ loading: isLoadingBalance }">
              <template v-if="isLoadingBalance">{{ t('miningPopup.loading') }}</template>
              <template v-else
                >{{ t('miningPopup.balance') }}:
                {{ formatNumber(chainBalances[coin.name] || 0, 3) }}</template
              >
            </span>
          </div>
        </div>
      </div>

      <!-- 合约地址信息 -->
      <!-- <div v-if="contractAddress" class="exchange-rate">
        <div class="dot"></div>
        <span>合约: {{ formatAddress(contractAddress) }}</span>
      </div> -->

      <!-- 确定按钮 -->
      <div
        @click="handleConfirm"
        :class="[
          'confirm-btn',
          { disabled: isLoadingBalance || needPayList.length === 0 || isConfirming }
        ]">
        <span v-if="isConfirming">{{ t('miningPopup.paying') }}...</span>
        <span v-else>{{ t('miningPopup.immediatelyPay') }}</span>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import { formatNumber } from '@/utils/format'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  orderInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const chainBalances = ref({})
const isLoadingBalance = ref(false)
const defaultCoinIcon = usdtIcon
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NATIVE_PAYMENT_NAMES = ['PYT', 'PYTHIA']

// 支付确认中状态
const isConfirming = ref(false)

// 支付列表
const needPayList = computed(() => props.orderInfo?.need_pay || [])

// 合约地址
const contractAddress = computed(() => props.orderInfo?.recharge_contract_address || '')

// 签名数据
const signedData = computed(() => props.orderInfo?.data || '')

const isNativeCoin = (coin) => {
  if (!coin) return false

  const normalizedName = (coin.name || '').toUpperCase()
  const normalizedAddress = (coin.address || '').toLowerCase()

  return coin.is_native === true ||
    coin.is_native === 1 ||
    normalizedAddress === ZERO_ADDRESS.toLowerCase() ||
    NATIVE_PAYMENT_NAMES.includes(normalizedName)
}

const isUserRejectedError = (error) => {
  return error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.info?.error?.code === 4001
}

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 格式化地址
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 获取链上余额
const getChainBalances = async () => {
  if (needPayList.value.length === 0) return

  isLoadingBalance.value = true
  chainBalances.value = {}

  try {
    const balancePromises = needPayList.value.map(async (coin) => {
      try {
        const balance = isNativeCoin(coin)
          ? await web3.getNativeBalance()
          : await web3.getTokenBalance(coin.address)
        const formattedBalance = ethers.formatUnits(balance, coin.decimals)
        return { name: coin.name, balance: formattedBalance }
      } catch (error) {
        console.error(`获取 ${coin.name} 余额失败:`, error)
        return { name: coin.name, balance: '0' }
      }
    })

    const results = await Promise.all(balancePromises)
    results.forEach((result) => {
      chainBalances.value[result.name] = result.balance
    })
  } catch (error) {
    console.error('获取链上余额失败:', error)
  } finally {
    isLoadingBalance.value = false
  }
}

// 立即支付
const handleConfirm = async () => {
  // 防止重复点击
  if (isConfirming.value) {
    return
  }
  
  if (needPayList.value.length === 0) {
    showToast(t('miningPopup.paymentInfoIncomplete'))
    return
  }

  const insufficientCoin = needPayList.value.find((coin) => {
    return parseFloat(chainBalances.value[coin.name] || 0) < parseFloat(coin.amount || 0)
  })

  if (insufficientCoin) {
    showToast(`${insufficientCoin.name}${t('exchange.balanceNotEnough')}`)
    return
  }

  try {
    isConfirming.value = true
    
    // 构建支付参数
    const paymentData = {
      contractAddress: contractAddress.value,
      data: signedData.value,
      token1: {
        address: needPayList.value[0].address,
        amount: needPayList.value[0].amount,
        decimals: needPayList.value[0].decimals,
        name: needPayList.value[0].name
      },
      token2: needPayList.value[1]
        ? {
            address: needPayList.value[1].address,
            amount: needPayList.value[1].amount,
            decimals: needPayList.value[1].decimals,
            name: needPayList.value[1].name,
            is_native: isNativeCoin(needPayList.value[1])
          }
        : null,
      value: props.orderInfo?.value
    }

    if (paymentData.token1) {
      paymentData.token1.is_native = isNativeCoin(needPayList.value[0])
    }

    // 联合铸币兼容 PYTHIA(GAS) + ERC20，同时不影响其他双 ERC20 流程
    const tx = await web3.payWithLpDualAsset(paymentData)

    // 关闭弹窗
    closePopup()

    // 通知父组件
    emit('confirm', { tx })
  } catch (error) {
    // 用户拒绝交易的错误已在 useWeb3 中处理,这里不再重复提示
    if (!isUserRejectedError(error)) {
      showToast(error.message || t('miningPopup.paymentFailed'))
    }
  } finally {
    isConfirming.value = false
  }
}

// 监听弹窗显示,获取余额
watch(
  () => props.show,
  (newVal) => {
    if (newVal && needPayList.value.length > 0) {
      getChainBalances()
    }
  }
)
</script>

<style lang="scss" scoped>
/* 弹窗容器 */
.liquidity-popup {
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

  > * {
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

  &.loading {
    color: rgba(255, 205, 5, 0.8);
  }
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
    background: #00ff6e;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
