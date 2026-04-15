<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import { useRouter } from 'vue-router'
import { useIndexStore } from '@/store'

import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import mcnIcon from '@/assets/imgs/coin/mcn-coin.png'
import adxIcon from '@/assets/imgs/coin/adx-coin.png'
import pytIcon from '@/assets/imgs/coin/pyt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin-old.png'
import dotIcon from '@/assets/imgs/power/dot.svg'
import checkedIcon from '@/assets/imgs/power/checked.svg'
import powerDataIcon from '@/assets/imgs/power/power-data.svg'
import data1 from '@/assets/imgs/power/data-1.svg'
import data2 from '@/assets/imgs/power/data-2.svg'
import data3 from '@/assets/imgs/power/data-3.svg' // 改用内联SVG
import PaymentPopup from './components/PaymentPopup.vue'
import Footer from '@/components/footer.vue'

const { t } = useI18n()
const router = useRouter()
const store = useIndexStore()
const powerConfig = ref({})
const powerDataTab = ref('current')
// 获取用户信息
const getUserInfo = async () => {
  try {
    await store.fetchUserInfo()
  } catch (error) {
    showToast('获取用户信息失败')
  }
}
const getPowerConfig = async () => {
  try {
    const res = await api.power.powerConfig()
    powerConfig.value = res
  } catch (error) {
    showToast('获取算力配置失败')
  }
}
const activePowerList = computed(() => {
  if (powerDataTab.value === 'old') {
    return store.userInfo?.old_power_list || {}
  }

  return store.userInfo?.power_list || {}
})

const x101Balance = computed(() => {
  return store.userInfo?.balance_list?.x101_balance || 0
})

const x101Price = computed(() => {
  return store.userInfo?.balance_list?.x101_price || 0
})

// 计算属性 - 从store获取数据
// 组件挂载时
onMounted(() => {
  getUserInfo()
  getPowerConfig()
})
// 认购数量
const subscribeAmount = ref('')

// 支付方式类型: 1-PYTHIA, 2-ADX, 3-MCN, 4-X101
const amountType = ref(1)

// 显示支付方式选择器
const showPaymentMethodPicker = ref(false)

// 支付方式选项
const paymentMethodColumns = [
  { text: 'PYTHIA', value: 1, icon: pytIcon },
  // { text: 'ADX', value: 2, icon: adxIcon },
  // { text: 'MCN', value: 3, icon: mcnIcon },
  // { text: 'X101', value: 4, icon: x101Icon }
]

// 选择支付方式
const onPaymentMethodConfirm = ({ selectedOptions }) => {
  amountType.value = selectedOptions[0].value
  showPaymentMethodPicker.value = false
}

// 当前选择的支付方式信息
const currentPaymentMethod = computed(() => {
  return paymentMethodColumns.find((item) => item.value === amountType.value) || paymentMethodColumns[0]
})

// 当前选择的币种单价（相对 USDT）
const currentPrice = computed(() => {
  if (amountType.value === 1) {
    // 兼容后端可能返回的不同字段名
    return powerConfig.value?.pythia_price || powerConfig.value?.pyt_price || 1
  }
  if (amountType.value === 2) return powerConfig.value?.adx_price || 1
  if (amountType.value === 3) return powerConfig.value?.mcn_price || 1
  if (amountType.value === 4) return powerConfig.value?.x101_price || 1
  return 1
})

// 当前选择的币种名称
const currentCoinName = computed(() => {
  return currentPaymentMethod.value.text
})

// 当前选择的币种图标
const currentCoinIcon = computed(() => {
  return currentPaymentMethod.value.icon
})

// 计算预计支付数量
const expectedAdx = computed(() => {
  const amount = parseFloat(subscribeAmount.value)
  if (!amount || amount <= 0) return 0

  // 当前页面输入的就是实际支付币种数量
  if (amountType.value === 1 || amountType.value === 2 || amountType.value === 3 || amountType.value === 4) {
    return amount
  }
  return 0
})

const expectedUsdtValue = computed(() => {
  const amount = parseFloat(subscribeAmount.value)
  const price = parseFloat(currentPrice.value || 0)

  if (!amount || amount <= 0 || !price || price <= 0) return 0

  return amount * price
})

// 检查按钮是否可用
const isButtonDisabled = computed(() => {
  const config = powerConfig.value?.asset_packet_config

  // 如果 open_enable 不为 '1',禁用按钮
  if (config?.open_enable !== '1') {
    return true
  }
  const amount = parseFloat(subscribeAmount.value)
  const minAmount = parseFloat(config?.min_amount || 0)

  // 如果输入为空或小于最小数量
  if (!amount || amount < minAmount) {
    return true
  }

  return false
})

// 处理输入，允许小数
const handleInput = (e) => {
  let value = e.target.value

  // 只保留数字和小数点
  value = value.replace(/[^\d.]/g, '')
  // 只保留第一个小数点
  value = value.replace(/\.{2,}/g, '.')
  value = value.replace('.', '#DOT#').replace(/\./g, '').replace('#DOT#', '.')

  if (!value) {
    subscribeAmount.value = ''
    e.target.value = ''
    return
  }

  if (value.startsWith('.')) {
    value = `0${value}`
  }

  const [integerPart, decimalPart] = value.split('.')
  const normalizedInteger = integerPart ? integerPart.replace(/^0+(?=\d)/, '') : '0'
  value = decimalPart !== undefined ? `${normalizedInteger}.${decimalPart}` : normalizedInteger

  subscribeAmount.value = value
  e.target.value = value
}

// 支付弹窗显示状态
const showPaymentPopup = ref(false)

// 订单信息
const orderInfo = ref(null)

// 打开支付弹窗
const openPaymentPopup = async () => {
  const config = powerConfig.value?.asset_packet_config
  const amount = parseFloat(subscribeAmount.value)
  const minAmount = parseFloat(config?.min_amount || 0)

  // 验证数量
  if (!amount || amount < minAmount) {
    showToast(`${t('power.minimumQuantity')} ${minAmount}`)
    return
  }

  try {
    if (amountType.value === 4) {
      orderInfo.value = {
        amount_type: 4,
        payment_mode: 'system_balance',
        need_pay: {
          name: 'X101',
          amount: subscribeAmount.value,
          img: x101Icon,
          decimals: 18,
          address: ''
        }
      }

      showPaymentPopup.value = true
      return
    }

    // 显示加载提示
    showLoadingToast({
      message: t('power.loading'),
      forbidClick: true,
      duration: 0
    })

    // 请求订单接口
    const res = await api.power.powerGetOrder({ num: subscribeAmount.value, amount_type: amountType.value })

    closeToast()

    // 保存订单信息
    orderInfo.value = res

    // 显示支付弹窗
    showPaymentPopup.value = true
  } catch (error) {
    closeToast()
    showToast(error.message || t('power.getOrderInfoFailed'))
  }
}

// 确认支付
const handlePayment = async (data) => {
  // 支付成功后的处理
  // 1. 清空输入
  subscribeAmount.value = ''

  // 3. 可以跳转到认购记录页面或显示成功提示
  const isX101SystemPayment = data?.orderInfo?.amount_type === 4 || data?.orderInfo?.payment_mode === 'system_balance'
  showToast(isX101SystemPayment ? t('power.paymentBalanceSuccess') : t('power.paymentSuccess'))
  // 可选: 跳转到认购记录页面
  // setTimeout(() => {
  //   router.push('/power-log')
  // }, 1500)
}
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="power-container mt-630 w-100% flex-col pt-40 px-30 pb-50 items-start justify-center">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-13">
            <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
            <span class="fsize-32 font-pingfang font-600 text-[#fff] leading-none">{{
              t('power.powerPurchase')
            }}</span>
          </div>
          <div class="arrow-container flex gap-5 items-center justify-center py-12 px-14 cursor-pointer"
            @click="router.push('/power-log')">
            <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-none">{{
              t('power.powerPurchaseRecord')
            }}</span>
            <van-icon name="arrow" size="14" color="#fff" />
          </div>
        </div>
        <!-- <span class="block pt-52 fsize-32 font-roboto font-700 text-[#fff] leading-none"
          >认购类型</span
        >
        <div class="coin-list mt-24 flex items-center justify-between px-30 py-24">
          <div class="flex items-center justify-center gap-10">
            <div class="wh-40 flex items-center justify-center flex-shrink-0">
              <van-image width="100%" height="100%" :src="usdtIcon" fit="contain"></van-image>
            </div>
            <span class="fsize-26 font-pingfang font-600 text-[#fff] leading-none">USDT</span>
          </div>
          <van-icon name="arrow-down" size="15" color="#fff" />
        </div> -->

        <!-- 支付方式选择 -->
        <span class="block pt-52 fsize-32 font-roboto font-700 text-[#fff] leading-none">{{
          t('power.paymentMethodTitle')
        }}</span>
        <div class="coin-list mt-24 flex items-center justify-between px-30 py-24 cursor-pointer"
          @click="showPaymentMethodPicker = true">
          <div class="flex items-center justify-center gap-10">
            <div class="wh-40 flex items-center justify-center flex-shrink-0">
              <van-image width="100%" height="100%" :src="currentCoinIcon" fit="contain"></van-image>
            </div>
            <span class="fsize-26 font-pingfang font-600 text-[#fff] leading-none">
              {{ currentCoinName }}
            </span>
          </div>
          <van-icon name="arrow-down" size="15" color="#fff" />
        </div>

        <span class="block pt-52 fsize-32 font-roboto font-700 text-[#fff] leading-none">{{
          t('power.subscribeAmount')
        }}</span>
        <div class="coin-list subscribe-input-box h-88 mt-24 flex items-center justify-between px-30 gap-20">
          <input v-model="subscribeAmount" type="text" :placeholder="t('power.pleaseEnterSubscribeAmount')"
            @input="handleInput" class="input-field w-100% h-100% bg-transparent border-none outline-none" />
          <div v-if="expectedUsdtValue > 0" class="usdt-estimate-chip flex-shrink-0 px-16 py-10">
            <span class="fsize-22 font-roboto font-600 leading-none whitespace-nowrap">
              ≈{{ formatNumber(expectedUsdtValue, 4) }} U
            </span>
          </div>
        </div>
        <div v-if="powerConfig?.asset_packet_config" class="mt-16 flex items-center justify-start gap-8">
          <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
          <span class="fsize-22 text-[rgba(255,255,255,0.7)] font-pingfang font-400 leading-none">{{
            t('power.minimumQuantity') }}:{{ powerConfig?.asset_packet_config?.min_amount }}</span>
        </div>
        <div class="mt-24 flex items-center justify-start gap-8">
          <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
          <span class="fsize-24 text-[#fff] font-pingfang font-400 leading-none">
            {{ t('power.exchangeRate') }}:1 {{ currentCoinName }}≈{{ formatNumber(currentPrice, 4) }} USDT
          </span>
        </div>
        <div class="expected flex items-center justify-start mt-40 px-33 py-22 gap-16">
          <van-image width="20" height="20" :src="checkedIcon" fit="contain"></van-image>
          <div class="flex flex-col items-start justify-start gap-5">
            <!-- 根据选择的支付方式显示对应币种 -->
            <span class="fsize-30 text-[#fff] font-roboto font-700 lh-40">{{ formatNumber(expectedAdx, 3) }} {{
              currentCoinName
            }}</span>
            <span class="fsize-22 text-[#fff] font-roboto font-400 lh-40">{{
              t('power.expectedPayment') + currentCoinName
            }}</span>
          </div>
        </div>
        <div class="flex w-100% h-90 mt-38 items-center justify-center">
          <van-button round color="#00FF6E" :disabled="isButtonDisabled"
            class="close-btn-text w-100% h-100% fsize-34 font-roboto font-600 leading-none uppercase"
            @click="openPaymentPopup">{{ t('power.immediatelySubscribe') }}</van-button>
        </div>
      </div>
      <!-- 算力数据 -->
      <div class="power-container mt-30 w-100% flex-col px-42 pt-39 pb-51 items-start justify-center">
        <div class="flex w-100% items-center justify-between gap-20">
          <div class="flex items-center gap-8">
            <van-image width="17" height="17" :src="powerDataIcon" fit="contain"></van-image>
            <span class="fsize-32 font-pingfang font-600 text-[#fff] leading-none">{{
              t('power.powerData')
            }}</span>
          </div>
          <div class="power-data-switch flex items-center">
            <button type="button" class="power-data-tab" :class="{ active: powerDataTab === 'current' }"
              @click="powerDataTab = 'current'">
              {{ t('power.currentPowerTab') }}
            </button>
            <button type="button" class="power-data-tab" :class="{ active: powerDataTab === 'old' }"
              @click="powerDataTab = 'old'">
              {{ t('power.oldPowerTab') }}
            </button>
          </div>
        </div>
        <div class="mt-46 flex flex-col gap-50 items-start justify-center">
          <div class="flex items-center gap-32 h-82">
            <div class="data-bg wh-82 p-14">
              <van-image width="100%" height="100%" :src="data1" fit="contain"></van-image>
            </div>
            <div class="flex flex-col items-start justify-center">
              <span class="fsize-28 font-miSans font-520 text-[#fff] lh-45">{{
                formatNumber(activePowerList.user_power || 0, 3)
              }}</span>
              <span class="tip-color fsize-22 font-pingfang font-380 text-[rgba(255, 255, 255, 0.70)] lh-32">{{
                t('power.personalPower') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-32 h-82">
            <div class="data-bg wh-82 p-14">
              <van-image width="100%" height="100%" :src="data2" fit="contain"></van-image>
            </div>
            <div class="flex flex-col items-start justify-center">
              <span class="fsize-28 font-miSans font-520 text-[#fff] lh-45">{{
                formatNumber(activePowerList.min_power || 0, 3)
              }}</span>
              <span class="tip-color fsize-22 font-pingfang font-380 text-[rgba(255, 255, 255, 0.70)] lh-32">{{
                t('power.minPower') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-32 h-82">
            <div class="data-bg wh-82 p-14">
              <van-image width="100%" height="100%" :src="data3" fit="contain"></van-image>
            </div>
            <div class="flex flex-col items-start justify-center">
              <span class="fsize-28 font-miSans font-520 text-[#fff] lh-45">{{
                formatNumber(activePowerList.max_power || 0, 3)
              }}</span>
              <span class="tip-color fsize-22 font-pingfang font-380 text-[rgba(255, 255, 255, 0.70)] lh-32">{{
                t('power.maxPower') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-32 h-82">
            <div class="data-bg wh-82 p-14 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- 团队算力图标：多人网络 -->
                <circle cx="25" cy="12" r="5" stroke="url(#paint0_linear_team)" stroke-width="2" fill="none" />
                <circle cx="10" cy="28" r="4" stroke="url(#paint1_linear_team)" stroke-width="2" fill="none" />
                <circle cx="40" cy="28" r="4" stroke="url(#paint2_linear_team)" stroke-width="2" fill="none" />
                <circle cx="17" cy="42" r="4" stroke="url(#paint3_linear_team)" stroke-width="2" fill="none" />
                <circle cx="33" cy="42" r="4" stroke="url(#paint4_linear_team)" stroke-width="2" fill="none" />
                <line x1="25" y1="17" x2="12" y2="26" stroke="url(#paint5_linear_team)" stroke-width="1.5" />
                <line x1="25" y1="17" x2="38" y2="26" stroke="url(#paint6_linear_team)" stroke-width="1.5" />
                <line x1="10" y1="32" x2="17" y2="38" stroke="url(#paint7_linear_team)" stroke-width="1.5" />
                <line x1="40" y1="32" x2="33" y2="38" stroke="url(#paint8_linear_team)" stroke-width="1.5" />
                <line x1="14" y1="28" x2="36" y2="28" stroke="url(#paint9_linear_team)" stroke-width="1.5" />
                <defs>
                  <linearGradient id="paint0_linear_team" x1="25" y1="7" x2="25" y2="17" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_team" x1="10" y1="24" x2="10" y2="32"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint2_linear_team" x1="40" y1="24" x2="40" y2="32"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint3_linear_team" x1="17" y1="38" x2="17" y2="46"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint4_linear_team" x1="33" y1="38" x2="33" y2="46"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint5_linear_team" x1="25" y1="17" x2="12" y2="26"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint6_linear_team" x1="25" y1="17" x2="38" y2="26"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint7_linear_team" x1="10" y1="32" x2="17" y2="38"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint8_linear_team" x1="40" y1="32" x2="33" y2="38"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                  <linearGradient id="paint9_linear_team" x1="14" y1="28" x2="36" y2="28"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF3F85" />
                    <stop offset="1" stop-color="#8A04FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="flex flex-col items-start justify-center">
              <span class="fsize-28 font-miSans font-520 text-[#fff] lh-45">{{
                formatNumber(activePowerList.team_power || 0, 3)
              }}</span>
              <span class="tip-color fsize-22 font-pingfang font-380 text-[rgba(255, 255, 255, 0.70)] lh-32">{{
                t('power.teamPower') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付弹窗 -->
    <PaymentPopup v-model:show="showPaymentPopup" :order-info="orderInfo" :system-balance="x101Balance"
      @confirm="handlePayment" />

    <!-- 支付方式选择器 -->
    <van-popup v-model:show="showPaymentMethodPicker" position="bottom" round>
      <van-picker :columns="paymentMethodColumns" @confirm="onPaymentMethodConfirm"
        @cancel="showPaymentMethodPicker = false" :title="t('power.selectPaymentMethod')" />
    </van-popup>
  </div>
  <Footer :theme="theme" />
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #02151d;
  background: url('@/assets/imgs/power/power-bg.png') no-repeat top center;
  background-size: 100% auto;
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
  --Style: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
  --bgColor: linear-gradient(180deg, #352700 0%, #1d170b 12.2%, #030202 81.32%);

  .body {
    width: 100%;
    padding: 10px 30px 300px;
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
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  }

  .box {
    background: var(--Style, linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%));
  }

  .arrow-container {
    border-radius: 13px;
    border: 1px solid #fff;
  }

  .coin-list {
    border-radius: 20px;
    background: rgba(255, 154, 252, 0.1);
  }

  .subscribe-input-box {
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .input-field {
    flex: 1;
    min-width: 0;
    color: #fff;
    font-family: Roboto;
    font-size: 28px;
    font-weight: 500;
    line-height: 50px;

    &::placeholder {
      color: #bec0ca;
      text-align: left;
      font-family: Roboto;
      font-size: 28px;
      font-style: normal;
      font-weight: 500;
      line-height: 50px;
    }
  }

  .usdt-estimate-chip {
    border-radius: 999px;
    background: rgba(63, 255, 108, 0.12);
    border: 1px solid rgba(63, 255, 108, 0.2);
    color: rgba(63, 255, 108, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .expected {
    border-radius: 20px;
    background: rgba(255, 154, 252, 0.1);
  }

  .button-container {
    border-radius: 55px;
    background: #f903a4;
    border: none;

    :deep(.van-button__content) {
      color: #fff;
    }
  }

  .tip-color {
    color: rgba(255, 255, 255, 0.7);
  }

  .data-bg {
    border-radius: 18px;
    background: rgba(254, 227, 255, 0.08);
  }

  .power-data-switch {
    padding: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .power-data-tab {
    min-width: 118px;
    height: 54px;
    padding: 0 24px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: rgba(255, 255, 255, 0.68);
    font-family: PingFang SC;
    font-size: 22px;
    font-weight: 500;
    line-height: 1;
    transition: all 0.2s ease;

    &.active {
      background: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
      color: #02151d;
      box-shadow: 0 8px 20px rgba(63, 255, 108, 0.22);
    }
  }
}

/* 支付方式选择器样式 */
:deep(.van-picker) {
  background: linear-gradient(180deg, #0d2820 0%, #051810 100%);

  .van-picker__toolbar {
    background: transparent;

    .van-picker__title {
      color: #fff;
      font-size: 32px;
      font-weight: 600;
    }

    .van-picker__cancel,
    .van-picker__confirm {
      color: #3fff6c;
      font-size: 28px;
    }
  }

  .van-picker-column__item {
    color: rgba(255, 255, 255, 0.5);
    font-size: 28px;

    &--selected {
      color: #3fff6c;
      font-weight: 600;
    }
  }

  /* 隐藏选中项上下的两条指示线 */
  .van-picker__frame {
    display: none;
  }

  .van-picker__mask {
    background-image:
      linear-gradient(180deg, rgba(13, 40, 32, 0.9), rgba(13, 40, 32, 0.4)),
      linear-gradient(0deg, rgba(13, 40, 32, 0.9), rgba(13, 40, 32, 0.4));
  }
}

:deep(.van-popup) {
  background: transparent;
}

.close-btn-text {
  color: #000 !important;
  /* 按钮文字颜色改为白色 */
}
</style>
