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
const ROUTER_ADDRESS = '0x1F7CdA03D18834C8328cA259AbE57Bf33c46647c'

// X101对ADX的价格
const exchangePrice = ref('')

// 确认中状态
const isConfirming = ref(false)

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 获取路由兑换价格 1 X101 = ? ADX
const getExchangePrice = async () => {
  if (props.coinList.length < 2) return

  const x101Coin = props.coinList.find((c) => c.name === 'X101')
  const adxCoin = props.coinList.find((c) => c.name === 'ADX')

  if (!x101Coin || !adxCoin) return

  try {
    const path = [x101Coin.contract_address, adxCoin.contract_address]
    const price = await web3.getAmountsOut(
      ROUTER_ADDRESS,
      '1', // 1 X101
      path,
      x101Coin.decimals,
      adxCoin.decimals
    )
    // 截取6位,不用分隔符,完整传后端
    exchangePrice.value = parseFloat(price).toFixed(6)
    console.log('1 X101 = ', exchangePrice.value, 'ADX')
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
  
  const x101Coin = props.coinList.find((c) => c.name === 'X101')
  const adxCoin = props.coinList.find((c) => c.name === 'ADX')

  if (!x101Coin || !adxCoin) {
    showToast('币种信息错误')
    return
  }

  const amount1 = props.inputAmounts[x101Coin.name] // X101数量
  const amount2 = props.inputAmounts[adxCoin.name] // ADX数量

  if (!amount1 || !amount2) {
    showToast('请输入数量')
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
      amount1: amount1, // X101数量
      amount2: amount2, // ADX数量
      price: exchangePrice.value // X101=>ADX价格
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
    // 调用双币支付方法
    const tx = await web3.payWithDualToken({
      contractAddress: recharge_contract_address,
      data: data,
      token1: need_pay_x101,
      token2: need_pay_adx
    })
    // 关闭弹窗
    closePopup()

    // 通知父组件刷新
    emit('confirm', { tx })
  } catch (error) {
    console.error('支付失败:', error)
    throw error
  }
}
</script>

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
          <van-image
            v-for="(coin, index) in coinList"
            :key="coin.id"
            :class="[index > 0 ? '-ml-14' : '']"
            width="22"
            height="22"
            :src="coin.img"
            fit="contain"></van-image>
        </div>
        <span class="coin-type-text">
          {{ coinList.map((c) => c.name).join(' + ') }}
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
            <span class="balance">{{ t('miningPopup.balance') }}: {{ formatNumber(chainBalances[coin.name] || 0, 3) }}</span>
          </div>
        </div>
      </div>

      <!-- 汇率信息 -->
      <div v-if="exchangePrice" class="exchange-rate">
        <div class="dot"></div>
        <span>1 X101 ≈ {{ exchangePrice }} ADX</span>
      </div>

      <!-- 确定按钮 -->
      <div
        @click="handleConfirm"
        :class="[
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
