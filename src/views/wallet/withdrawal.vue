<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber, formatPerformance } from '@/utils/format'
import { useIndexStore } from '@/store'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin-old.png'
import sotaIcon from '@/assets/imgs/coin/x101-coin.png'
import adxIcon from '@/assets/imgs/coin/mcn-coin.png'
import filterIcon from '@/assets/imgs/user/fitter.svg'
import checkedIcon from '@/assets/imgs/power/checked.svg'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import exchangeIcon from '@/assets/imgs/wallet/exchange.svg'
import pytIcon from '@/assets/imgs/coin/pyt-coin.png'

const { t } = useI18n()
const store = useIndexStore()

// 获取用户信息
const getUserInfo = async () => {
  try {
    await store.fetchUserInfo()
  } catch (error) {
    showToast('获取用户信息失败')
  }
}

// X101 余额
const x101Balance = computed(() => {
  return store.userInfo?.balance_list?.x101_balance || 0
})

// PYTHIA 余额
const adxBalance = computed(() => {
  return store.userInfo?.balance_list?.adx_balance || 0
})

// 币种选择 1-X101, 2-PYTHIA
const selectedCoin = ref(1)

// 显示币种选择器
const showCoinPicker = ref(false)

// 币种选项
const coinColumns = [
  // { text: 'X101', value: 1, icon: x101Icon },
  { text: 'SOTA', value: 3, icon: sotaIcon },
  { text: 'PYTHIA', value: 2, icon: pytIcon }
]

// 当前选中的币种信息
const currentCoin = computed(() => {
  return coinColumns.find(item => item.value === selectedCoin.value) || coinColumns[0]
})

// SOTA 余额
const sotaBalance = computed(() => {
  return store.userInfo?.balance_list?.sota_balance || 0
})

// 当前余额
const currentBalance = computed(() => {
  if (selectedCoin.value === 1) return x101Balance.value
  if (selectedCoin.value === 2) return adxBalance.value
  if (selectedCoin.value === 3) return sotaBalance.value
  return 0
})

// 提现配置
const withdrawConfig = ref({})
// 提现数量
const withdrawAmount = ref('')
// 提现记录
const withdrawList = ref([])
// 分页加载状态
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)
// 添加加载锁，防止并发请求
const isLoadingData = ref(false)
// 提现记录分页参数
const params = ref({
  page: 1,
  page_size: 20
})

// 提现配置数据 - 根据选中的币种动态切换
const config = computed(() => {
  if (selectedCoin.value === 1) {
    return withdrawConfig.value?.x101_withdraw_config || {}
  } else if (selectedCoin.value === 2) {
    return withdrawConfig.value?.pythia_withdraw_config || {}
  } else if (selectedCoin.value === 3) {
    return withdrawConfig.value?.sota_withdraw_config || {}
  } else {
    return withdrawConfig.value?.adx_withdraw_config || {}
  }
})

// 是否可以提现
const canWithdraw = computed(() => config.value?.withdraw_enable === '1')

// 计算预计到账金额
const expectedAmount = computed(() => {
  if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) {
    return '0'
  }

  const amount = parseFloat(withdrawAmount.value)
  const rate = parseFloat(config.value?.withdraw_rate || 0)
  const fee = (amount * rate) / 100
  // 预计到账 = 提现金额 - 手续费
  const expected = amount - fee
  return expected.toFixed(4)
})

// 选择币种
const onCoinConfirm = ({ selectedOptions }) => {
  selectedCoin.value = selectedOptions[0].value
  showCoinPicker.value = false
  // 切换币种时清空输入金额
  withdrawAmount.value = ''
}

// 获取提现配置
const getWithdrawConfig = async () => {
  try {
    const res = await api.wallet.withdrawConfig()
    withdrawConfig.value = res
  } catch (error) {
    console.error('获取提现配置失败:', error)
    showToast(t('common.getWithdrawConfigFailed'))
  }
}

// 获取提现记录
const getWithdrawList = async () => {
  // 如果正在加载，直接返回，防止并发请求
  if (isLoadingData.value) {
    console.log('已有请求在进行中，跳过本次请求')
    return
  }

  isLoadingData.value = true

  try {
    const res = await api.wallet.withdrawList(params.value)

    if (res?.list) {
      // 如果是下拉刷新,直接替换列表
      if (refreshing.value) {
        withdrawList.value = res.list
        refreshing.value = false
      } else {
        // 否则追加数据
        withdrawList.value = [...withdrawList.value, ...res.list]
      }

      total.value = res.total || 0

      // 加载成功后,页码+1,准备下次加载
      params.value.page++

      // 判断是否已加载完所有数据
      if (withdrawList.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取提现记录失败:', error)
    finished.value = true
    loading.value = false
  } finally {
    isLoadingData.value = false
  }
}

// 上拉加载
const onLoad = () => {
  if (refreshing.value) {
    return
  }
  getWithdrawList()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  params.value.page = 1
  withdrawList.value = []
  getWithdrawList()
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: t('wallet.pendingReview'),
    1: t('wallet.pendingPass'),
    2: t('wallet.passed'),
    3: t('wallet.returned')
  }
  return statusMap[status] || t('wallet.unknown')
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    0: '#FFA500', // 待审核 - 橙色
    1: '#FFD700', // 待通过 - 金色
    2: '#16FFC2', // 已通过 - 绿色
    3: '#FF3F85' // 已退还 - 红色
  }
  return colorMap[status] || '#fff'
}

// 根据 coin_id 获取币种信息
const getCoinInfo = (coinId) => {
  const coin = coinColumns.find(item => item.value === parseInt(coinId))
  return coin || coinColumns[0]
}

// 全部按钮
const handleMax = () => {
  const maxAmount = parseFloat(config.value?.max_withdraw || 0)
  const balance = parseFloat(currentBalance.value || 0)

  // 取最大提现数量和余额中的较小值
  const max = Math.min(maxAmount > 0 ? maxAmount : balance, balance)
  withdrawAmount.value = max > 0 ? max.toFixed(4) : '0'
}

// 执行提现
const handleWithdraw = async () => {
  // 1. 验证是否可以提现
  if (!canWithdraw.value) {
    showToast(t('wallet.withdrawalNotAvailable'))
    return
  }

  // 2. 验证输入金额
  if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) {
    showToast(t('wallet.pleaseEnterWithdrawAmount'))
    return
  }

  const amount = parseFloat(withdrawAmount.value)
  const balance = parseFloat(currentBalance.value || 0)
  const minWithdraw = parseFloat(config.value?.min_withdraw || 0)
  const maxWithdraw = parseFloat(config.value?.max_withdraw || 0)

  // 3. 验证余额
  if (amount > balance) {
    showToast(t('wallet.balanceNotEnough'))
    return
  }

  // 4. 验证最小提现金额
  if (minWithdraw > 0 && amount < minWithdraw) {
    showToast(t('wallet.minimumWithdrawAmount', { amount: minWithdraw }))
    return
  }

  // 5. 验证最大提现金额
  if (maxWithdraw > 0 && amount > maxWithdraw) {
    showToast(t('wallet.maximumWithdrawAmount', { amount: maxWithdraw }))
    return
  }

  try {
    showLoadingToast({
      message: t('wallet.withdrawalApplying'),
      duration: 0,
      forbidClick: true
    })

    // 调用提现接口
    const res = await api.wallet.doWithdraw({
      amount: withdrawAmount.value,
      coin_id: selectedCoin.value.toString() // 1-x101, 2-ADX
    })

    closeToast()
    showToast(t('wallet.withdrawalSuccess'))

    // 清空输入
    withdrawAmount.value = ''

    // 刷新余额和提现记录
    await getUserInfo()
    // 刷新提现记录 - 重置状态
    finished.value = false
    params.value.page = 1
    withdrawList.value = []
    await getWithdrawList()
  } catch (error) {
    closeToast()
    showToast(error.message || t('wallet.withdrawalFailed'))
  }
}

onMounted(() => {
  getUserInfo()
  getWithdrawConfig()
  // 移除手动调用，让 van-list 自动触发 onLoad
  // getWithdrawList()
})
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="flex gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
          t('wallet.withdrawal')
        }}</span>
      </div>
      <div class="power-container mt-23 w-100% flex-col pt-40 px-30 pb-48 items-start justify-center">
        <div class="flex items-center justify-between">
          <span class="block fsize-28 font-miSans font-630 text-[#fff] leading-none">From</span>
        </div>
        <div
          class="out-coin mt-20 flex items-center justify-start gap-12 w-196 h-68 py-8 px-14 rounded-20 cursor-pointer"
          @click="showCoinPicker = true">
          <van-image width="20" height="20" :src="currentCoin.icon" fit="contain"></van-image>
          <span class="fsize-26 font-roboto font-500 text-[#fff] leading-normal">{{ currentCoin.text }}</span>
          <van-icon name="arrow-down" size="14" color="#fff" />
        </div>
        <div class="flex mt-34 items-center justify-start gap-18 w-100%">
          <div class="exchange-line w-2 h-220 rounded-110 bg-[#fff] opacity-30"></div>
          <div class="flex flex-col items-start justify-center w-100%">
            <span class="fsize-26 font-roboto font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.quantity')
            }}</span>
            <div class="out-coin mt-24 flex items-center justify-between px-30 py-20 rounded-18 w-100%">
              <input v-model="withdrawAmount" type="number" :placeholder="t('wallet.pleaseEnterQuantity')"
                class="input-field flex-1 bg-transparent border-none outline-none fsize-26 font-roboto font-500 text-[#fff]" />
              <span class="fsize-28 font-roboto font-500 text-[#3FFF6C] leading-normal cursor-pointer"
                @click="handleMax">{{ t('wallet.all') }}</span>
            </div>
            <div class="mt-40 flex items-center justify-start gap-12">
              <van-image width="14" height="14" :src="dotIcon" fit="contain"></van-image>
              <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal">{{ t('wallet.balance') }}：{{
                formatNumber(currentBalance, 4) }}</span>
            </div>
            <div v-if="config?.min_withdraw || config?.max_withdraw"
              class="mt-16 flex items-center justify-start gap-12">
              <van-image width="14" height="14" :src="dotIcon" fit="contain"></van-image>
              <span class="fsize-22 font-roboto font-400 text-[#fff] leading-normal opacity-50">
                <span>{{ t('wallet.minimum') }}: {{ config.min_withdraw }}</span>
                <span v-if="
                  config?.min_withdraw &&
                  config?.max_withdraw &&
                  parseFloat(config.min_withdraw) > 0 &&
                  parseFloat(config.max_withdraw) > 0
                " class="mx-8">|</span>
                <span v-if="config?.max_withdraw && parseFloat(config.max_withdraw) > 0">{{ t('wallet.maximum') }}: {{
                  config.max_withdraw }}</span>
              </span>
            </div>
          </div>
        </div>
        <!-- to -->
        <div class="out-coin mt-38 flex items-center justify-between px-26 py-26 w-100% rounded-30">
          <div class="flex flex-col items-start justify-center flex-1">
            <span class="block fsize-26 font-roboto font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.expectedAmount') }}</span>
            <div class="flex items-baseline justify-start gap-12 mt-8">
              <span class="fsize-36 font-roboto font-700 text-[#fff] leading-normal">{{
                formatNumber(expectedAmount, 3)
              }}</span>
              <span class="fsize-24 font-roboto font-700 text-[#fff] leading-normal">{{ currentCoin.text }}</span>
            </div>
            <div v-if="config?.withdraw_rate && parseFloat(config.withdraw_rate) > 0"
              class="mt-12 flex items-center gap-8">
              <van-image width="10" height="10" :src="dotIcon" fit="contain"></van-image>
              <span class="fsize-20 font-roboto font-400 text-[#fff] leading-normal opacity-50">手续费: {{
                parseFloat(config.withdraw_rate).toFixed(2) }}%</span>
            </div>
          </div>
          <div class="exchange-btn flex items-center justify-center w-250 h-88 rounded-55 cursor-pointer"
            :class="{ disabled: !canWithdraw }" @click="handleWithdraw">
            <!-- <van-image width="17" height="17" :src="exchangeIcon" fit="contain"></van-image> -->
            <span class="fsize-28 font-roboto font-500 text-[#000] leading-normal ml-8">提现</span>
          </div>
        </div>
      </div>
      <div class="flex mt-50 gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">
          {{ t('wallet.withdrawalRecordTotal', { count: total }) }}
        </span>
      </div>
      <div class="power-container mt-20 w-100% flex-col pt-34 px-30 pb-55 items-start justify-center">
        <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
          <van-list v-model:loading="loading" :finished="finished"
            :finished-text="withdrawList.length > 0 ? t('wallet.noMore') : ''" @load="onLoad" class="list-wrapper">
            <!-- 空状态 -->
            <div v-if="withdrawList.length === 0 && !loading" class="empty-state">
              <van-empty :description="t('wallet.noWithdrawalRecord')" />
            </div>

            <!-- 列表项 -->
            <div v-for="(item, index) in withdrawList" :key="item.no" class="withdraw-item">
              <div class="flex items-center justify-start gap-20 w-100%">
                <van-image width="32" height="32" :src="getCoinInfo(item.coin_id).icon" fit="contain"></van-image>
                <div class="flex flex-col items-start justify-center flex-1 gap-12">
                  <!-- 第一行：提现数量 + 状态 -->
                  <div class="flex items-center justify-between w-100%">
                    <div class="flex items-baseline gap-8">
                      <span class="fsize-32 font-roboto font-700 text-[#fff] leading-none">{{
                        formatNumber(item.num, 4)
                      }}</span>
                      <span class="fsize-24 font-roboto font-500 text-[#fff] leading-none opacity-70">{{
                        getCoinInfo(item.coin_id).text }}</span>
                    </div>
                    <span class="fsize-24 font-pingfang font-500 leading-none"
                      :style="{ color: getStatusColor(item.status) }">
                      {{ getStatusText(item.status) }}
                    </span>
                  </div>

                  <!-- 第二行：手续费和实际到账 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-22 font-roboto font-400 text-[#fff] leading-none opacity-50">{{ t('wallet.fee')
                    }}: {{ formatNumber(item.fee_amount, 4) }}</span>
                    <span class="fsize-22 font-roboto font-500 text-[#16FFC2] leading-none">{{ t('wallet.toAccount') }}:
                      {{ formatNumber(item.ac_amount, 4) }}</span>
                  </div>

                  <!-- 第三行：时间信息 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-20 font-roboto font-400 text-[#fff] leading-none opacity-40">
                      {{ item.created_at }}
                    </span>
                    <span v-if="item.status === 2 && item.finsh_time"
                      class="fsize-20 font-roboto font-400 text-[#16FFC2] leading-none opacity-60">
                      {{ t('wallet.toAccountTime') }}: {{ item.finsh_time }}
                    </span>
                  </div>

                  <!-- 订单号 -->
                  <!-- <div class="flex items-center gap-8">
                    <van-image width="10" height="10" :src="dotIcon" fit="contain"></van-image>
                    <span class="fsize-18 font-roboto font-400 text-[#fff] leading-none opacity-30">
                      {{ item.no }}
                    </span>
                  </div> -->
                </div>
              </div>

              <!-- 分割线（不是最后一项时显示） -->
              <div v-if="index < withdrawList.length - 1" class="line"></div>
            </div>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>

    <!-- 币种选择器 -->
    <van-popup v-model:show="showCoinPicker" position="bottom" round>
      <van-picker :columns="coinColumns" @confirm="onCoinConfirm" @cancel="showCoinPicker = false" title="选择提现币种">
        <template #option="option">
          <div class="flex items-center gap-12">
            <van-image width="24" height="24" :src="option.icon" fit="contain"></van-image>
            <span>{{ option.text }}</span>
          </div>
        </template>
      </van-picker>
    </van-popup>
  </div>
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #fdfdfd;
  background: url('@/assets/imgs/power/power-log-bg.png') no-repeat top center;

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
  --Style: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);
  --bgColor: linear-gradient(180deg, #352700 0%, #1d170b 12.2%, #030202 81.32%);
  --Radial: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 36.85%, #f658ff 100%);

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
  background: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
}

.out-coin {
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &.cursor-pointer:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
}

.exchange-btn {
  border-radius: 55px;
  background: #00ff6e;
  box-shadow: 0 0 8px 0 rgba(255, 255, 255, 0.25) inset;
  transition: all 0.3s ease;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &:active:not(.disabled) {
    transform: scale(0.98);
  }
}

.input-field {
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
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

/* 提现记录列表 */
.withdraw-item {
  width: 100%;
  padding: 24px 0;

  &:first-child {
    padding-top: 0;
  }
}

.line {
  margin-top: 24px;
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
.list-wrapper {
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
      color: #3fff6c;
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

/* 币种选择器样式 */
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
</style>
