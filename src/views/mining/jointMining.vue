<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import { useIndexStore } from '@/store/index'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin.png'
import filterIcon from '@/assets/imgs/user/fitter.svg'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import addIcon from '@/assets/imgs/mining/add.svg'
import hotIcon from '@/assets/imgs/mining/hot.svg'
import checkedIcon from '@/assets/imgs/mining/checked.svg'
import exchangeIcon from '@/assets/imgs/wallet/exchange.svg'
import JointMiningInputPopup from './components/JointMiningInputPopup.vue'
import JointMiningPaymentPopup from './components/JointMiningPaymentPopup.vue'

const { t } = useI18n()
const store = useIndexStore()
const jointMiningInfo = ref({})

// 弹窗控制
const showInputPopup = ref(false)
const showPaymentPopup = ref(false)
const selectedPackage = ref(null)
const orderInfo = ref(null)
const inputPopupRef = ref(null)
const payingOrderId = ref('')

// 订单列表相关
const orderTab = ref('mined')
const jointMiningOrderList = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)
const isLoadingOrderList = ref(false)
const params = ref({
  page: 1,
  page_size: 20
})

// 统计数据
const statistics = computed(() => jointMiningInfo.value?.statistics || {})

// 热门组合
const hotPackages = computed(() => jointMiningInfo.value?.hot_packages || [])

// 更多选择
const morePackages = computed(() => jointMiningInfo.value?.more_packages || [])

// 获取币种图标
const getCoinIcon = (coin) => {
  if (!coin) return usdtIcon
  // 如果有 img 字段直接使用
  if (coin.img) return coin.img
  // 否则根据名称判断
  if (coin.name === 'X101') return x101Icon
  if (coin.name === 'ADX') return usdtIcon
  return usdtIcon
}

// 获取组合的标签列表
const getPackageTags = (pkg) => {
  if (pkg.tag_list && pkg.tag_list.length > 0) {
    return pkg.tag_list.filter((tag) => tag?.state === 1)
  }
  return []
}

// 构建组合的详细数据展示(3行2列的数据)
const getPackageData = (pkg) => {
  return [
    [
      { value: formatNumber(pkg.total_user || 0, 0), label: t('jointMinting.totalInvestors') },
      {
        value: formatNumber(pkg.min_amount || 0, 0) + ' U',
        label: t('jointMinting.minimumInvestment')
      }
    ],
    [
      { value: pkg.power_rate_display || pkg.power_rate + 'x', label: t('jointMinting.powerRate') },
      { value: formatNumber(pkg.ac_user || 0, 0), label: t('jointMinting.activeUsers') }
    ],
    [
      {
        value: pkg.coin1?.name + ' ' + (pkg.rate1 || 50) + '%',
        label: t('jointMinting.coin1Ratio')
      },
      {
        value: pkg.coin2?.name + ' ' + (pkg.rate2 || 50) + '%',
        label: t('jointMinting.coin2Ratio')
      }
    ]
  ]
}

onMounted(() => {
  getJointMiningInfo()
})

const getJointMiningInfo = async () => {
  try {
    const res = await api.power.jointMiningInfo()
    jointMiningInfo.value = res
  } catch (error) {
    showToast(error.message || t('jointMinting.getJointMiningInfoFailed'))
  }
}

// 点击立即投资
const handleInvest = (pkg) => {
  selectedPackage.value = pkg
  showInputPopup.value = true
}

// 确认输入数量,调用接口获取订单
const handleInputConfirm = async (amount) => {
  if (!selectedPackage.value) return

  try {
    // 设置输入弹窗为加载状态
    if (inputPopupRef.value) {
      inputPopupRef.value.setLoading(true)
    }

    showLoadingToast({
      message: t('jointMinting.getOrderInfo'),
      forbidClick: true,
      duration: 0
    })

    const res = await api.power.jointMiningGetOrder({
      union_id: selectedPackage.value.id,
      num: amount
    })

    closeToast()

    // 保存订单信息
    orderInfo.value = res

    // 关闭输入弹窗,打开支付弹窗
    showInputPopup.value = false
    showPaymentPopup.value = true
  } catch (error) {
    closeToast()
    if (inputPopupRef.value) {
      inputPopupRef.value.setLoading(false)
    }
    showToast(error.message || t('jointMinting.getOrderInfoFailed'))
  }
}

// 支付成功
const handlePaymentSuccess = async () => {
  showToast(t('jointMinting.paymentSuccess'))
  onRefresh()
}

const isPendingOrderTab = computed(() => orderTab.value === 'pending')

const getWaitOrderStatusText = (status) => {
  const statusMap = {
    1: '支付中',
    2: '支付完成'
  }
  return statusMap[status] || '-'
}

const getPendingOrderId = (item) => item?.order_id || item?.id || ''

const isPendingPaying = (item) => {
  return Boolean(payingOrderId.value) && payingOrderId.value === getPendingOrderId(item)
}

const handlePendingPay = async (item) => {
  const orderId = getPendingOrderId(item)

  if (Number(item?.status) !== 1 || isPendingPaying(item)) {
    return
  }

  if (!orderId) {
    showToast('订单ID不存在')
    return
  }

  payingOrderId.value = orderId

  try {
    showLoadingToast({
      message: '获取支付信息中...',
      forbidClick: true,
      duration: 0
    })

    const res = await api.power.jointMiningGetPayData({
      id: orderId
    })

    closeToast()
    orderInfo.value = res
    console.log('联合挖矿待支付订单支付数据:', res)
    showPaymentPopup.value = true
  } catch (error) {
    closeToast()
    showToast(error.message || '获取支付信息失败')
  } finally {
    payingOrderId.value = ''
  }
}

const resetOrderList = () => {
  finished.value = false
  loading.value = false
  refreshing.value = false
  total.value = 0
  params.value.page = 1
  jointMiningOrderList.value = []
}

const getJointMiningOrderList = async () => {
  if (isLoadingOrderList.value) {
    return
  }

  isLoadingOrderList.value = true

  try {
    const request = isPendingOrderTab.value
      ? api.power.jointMiningWaitOrderList
      : api.power.jointMiningOrderList
    const res = await request(params.value)

    if (res?.list) {
      // 如果是下拉刷新,清空列表
      if (refreshing.value) {
        jointMiningOrderList.value = res.list
        refreshing.value = false
      } else {
        // 否则追加数据
        jointMiningOrderList.value = [...jointMiningOrderList.value, ...res.list]
      }

      total.value = res.total || 0
      refreshing.value = false

      // 加载成功后,页码+1,准备下次加载
      params.value.page++

      // 判断是否已加载完所有数据
      if (jointMiningOrderList.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      if (refreshing.value) {
        jointMiningOrderList.value = []
        refreshing.value = false
      }
      total.value = 0
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    if (refreshing.value) {
      refreshing.value = false
    }
    showToast(error.message || (isPendingOrderTab.value ? '获取待支付订单失败' : t('jointMinting.getJointMiningOrderListFailed')))
    finished.value = true
    loading.value = false
  } finally {
    isLoadingOrderList.value = false
  }
}

const handleOrderTabChange = (tab) => {
  if (orderTab.value === tab) return

  orderTab.value = tab
  resetOrderList()
  getJointMiningOrderList()
}

// 上拉加载
const onLoad = () => {
  if (refreshing.value) {
    return
  }
  getJointMiningOrderList()
}

// 下拉刷新
const onRefresh = () => {
  resetOrderList()
  refreshing.value = true
  getJointMiningOrderList()
}
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="flex gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
          t('jointMinting.jointMining')
        }}</span>
      </div>

      <!-- 统计数据 -->
      <div class="power-container flex mt-30 w-100% px-40 py-33 items-start justify-between gap-20">
        <div class="flex flex-col flex-1 items-center justify-center">
          <span class="fsize-30 font-roboto font-700 text-[#fff] lh-40">
            {{ statistics.max_power_rate || '0' }}
          </span>
          <span class="fsize-22 font-roboto font-400 text-[#fff] lh-40 opacity-60 text-center">
            {{ t('jointMinting.highestPowerRate') }}
          </span>
        </div>
        <div class="flex flex-col flex-1 items-center justify-center">
          <span class="fsize-30 font-roboto font-700 text-[#fff] lh-40">
            {{ statistics.total_packages || 0 }}
          </span>
          <span class="fsize-22 font-roboto font-400 text-[#fff] lh-40 opacity-60 text-center">
            {{ t('jointMinting.packageCategory') }}
          </span>
        </div>
        <div class="flex flex-col flex-1 items-center justify-center">
          <span class="fsize-30 font-roboto font-700 text-[#fff] lh-40">
            {{ formatNumber(statistics.total_users || 0, 0) }}
          </span>
          <span class="fsize-22 font-roboto font-400 text-[#fff] lh-40 opacity-60 text-center">
            {{ t('jointMinting.participatingUsers') }}
          </span>
        </div>
      </div>

      <!-- 热门组合 -->
      <div v-if="hotPackages.length > 0">
        <div class="flex gap-12 items-center justify-start pt-30">
          <van-image width="13" height="16" :src="hotIcon" fit="contain"></van-image>
          <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
            t('jointMinting.hotPackages')
          }}</span>
        </div>

        <div v-for="pkg in hotPackages" :key="pkg.id"
          class="power-container mt-30 w-100% flex-col pt-40 px-25 pb-40 items-start justify-center">
          <div class="flex items-center justify-between w-100%">
            <!-- 图标Logo -->
            <div class="flex items-center justify-start gap-16">
              <div class="h-60 flex items-center justify-center">
                <van-image width="30" height="30" :src="getCoinIcon(pkg.coin1)" fit="contain"></van-image>
                <van-image v-if="pkg.coin2" class="-ml-18" width="30" height="30" :src="getCoinIcon(pkg.coin2)"
                  fit="contain"></van-image>
              </div>
              <div class="flex flex-col items-start justify-center">
                <span class="fsize-30 font-roboto font-700 text-[#fff] leading-normal">
                  {{ pkg.name }}
                </span>
                <span class="fsize-22 font-roboto font-400 text-[#fff] leading-normal opacity-60">
                  {{ t('jointMinting.powerRate') }}: {{ pkg.power_rate_display || pkg.power_rate }}x
                </span>
              </div>
            </div>

            <!-- 标签 -->
            <div v-if="getPackageTags(pkg).length > 0" class="flex flex-wrap gap-8 justify-end">
              <div v-for="(tag, index) in getPackageTags(pkg)" :key="tag.id || tag.name || tag.title || index"
                class="tag flex items-center justify-center px-16 py-8">
                <span class="fsize-20 font-pingfang font-500 leading-normal">{{ tag.name || tag.title || tag }}</span>
              </div>
            </div>
          </div>

          <!-- 列表展示 - 使用接口数据 -->
          <div v-for="(row, rowIndex) in getPackageData(pkg)" :key="rowIndex" :class="[
            'flex items-center justify-between gap-21',
            rowIndex === 0 ? 'mt-30' : 'mt-21'
          ]">
            <div v-for="(item, itemIndex) in row" :key="itemIndex"
              class="out-coin flex flex-1 py-22 px-20 gap-12 rounded-20 items-center justify-start">
              <van-image width="16" height="16" :src="checkedIcon" fit="contain"></van-image>
              <div class="flex flex-col items-start justify-center">
                <span class="fsize-26 font-roboto font-700 text-[#fff] lh-36">
                  {{ item.value }}
                </span>
                <span class="fsize-20 font-roboto font-400 text-[#fff] lh-32 opacity-60">
                  {{ item.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- 描述 -->
          <span v-if="pkg.desc" class="block mt-22 ml-5 fsize-22 font-pingfang font-400 text-[#fff] lh-32 opacity-60">
            {{ pkg.desc }}
          </span>

          <!-- 投资按钮 -->
          <div class="flex w-100% h-80 mt-30 items-center justify-center">
            <van-button round :color="pkg.state === 1 ? '#00FF6E' : '#666'" :disabled="pkg.state !== 1"
              class="w-100% close-btn-text h-100% fsize-30 font-roboto font-600 leading-none"
              @click="handleInvest(pkg)">
              {{
                pkg.state === 1
                  ? t('jointMinting.immediatelyInvest')
                  : t('jointMinting.cannotInvest')
              }}
            </van-button>
          </div>
        </div>
      </div>

      <!-- 更多选择 -->
      <div v-if="morePackages.length > 0">
        <div class="flex gap-12 mt-30 items-center justify-start">
          <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
          <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
            t('jointMinting.moreSelection')
          }}</span>
        </div>

        <div v-for="pkg in morePackages" :key="pkg.id"
          class="power-container mt-20 w-100% flex-col pt-40 px-25 pb-40 items-start justify-center">
          <div class="flex items-center justify-between w-100%">
            <!-- 图标Logo -->
            <div class="flex items-center justify-start gap-16">
              <div class="h-60 flex items-center justify-center">
                <van-image width="30" height="30" :src="getCoinIcon(pkg.coin1)" fit="contain"></van-image>
                <van-image v-if="pkg.coin2" class="-ml-18" width="30" height="30" :src="getCoinIcon(pkg.coin2)"
                  fit="contain"></van-image>
              </div>
              <div class="flex flex-col items-start justify-center">
                <span class="fsize-30 font-roboto font-700 text-[#fff] leading-normal">
                  {{ pkg.name }}
                </span>
                <span class="fsize-22 font-roboto font-400 text-[#fff] leading-normal opacity-60">
                  {{ t('jointMinting.powerRate') }}: {{ pkg.power_rate_display || pkg.power_rate }}x
                </span>
              </div>
            </div>

            <!-- 标签 -->
            <div v-if="getPackageTags(pkg).length > 0" class="flex flex-wrap gap-8 justify-end">
              <div v-for="(tag, index) in getPackageTags(pkg)" :key="tag.id || tag.name || tag.title || index"
                class="tag flex items-center justify-center px-16 py-8">
                <span class="fsize-20 font-pingfang font-500 leading-normal">{{ tag.name || tag.title || tag }}</span>
              </div>
            </div>
          </div>

          <!-- 列表展示 - 使用接口数据 -->
          <div v-for="(row, rowIndex) in getPackageData(pkg)" :key="rowIndex" :class="[
            'flex items-center justify-between gap-21',
            rowIndex === 0 ? 'mt-30' : 'mt-21'
          ]">
            <div v-for="(item, itemIndex) in row" :key="itemIndex"
              class="out-coin flex flex-1 py-22 px-20 gap-12 rounded-20 items-center justify-start min-h-100">
              <van-image width="16" height="16" :src="checkedIcon" fit="contain"></van-image>
              <div class="flex flex-col items-start justify-center">
                <span class="fsize-26 font-roboto font-700 text-[#fff] lh-36">
                  {{ item.value }}
                </span>
                <span class="fsize-20 font-roboto font-400 text-[#fff] lh-32 opacity-60">
                  {{ item.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- 描述 -->
          <span v-if="pkg.desc" class="block mt-22 ml-5 fsize-22 font-pingfang font-400 text-[#fff] lh-32 opacity-60">
            {{ pkg.desc }}
          </span>

          <!-- 投资按钮 -->
          <div class="flex w-100% h-80 mt-30 items-center justify-center">
            <van-button round :color="pkg.state === 1 ? '#00FF6E' : '#666'" :disabled="pkg.state !== 1"
              class="w-100% close-btn-text h-100% fsize-30 font-roboto font-600 leading-none"
              @click="handleInvest(pkg)">
              {{
                pkg.state === 1
                  ? t('jointMinting.immediatelyInvest')
                  : t('jointMinting.cannotInvest')
              }}
            </van-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="hotPackages.length === 0 && morePackages.length === 0" class="empty-state mt-100">
        <van-empty :description="t('jointMinting.noJointMiningPackage')" />
      </div>

      <!-- 挖矿订单 -->
      <div class="flex mt-30 flex-col items-start justify-start">
        <div class="power-container flex flex-col items-center justify-start w-100% pt-37 pb-55 px-30">
          <div class="flex items-center justify-between w-100% mb-24">
            <div class="flex gap-12 items-center justify-start">
              <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
              <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
                isPendingOrderTab ? t('jointMinting.pendingOrder') : t('jointMinting.jointMiningOrder')
              }}</span>
            </div>
            <span class="fsize-22 font-miSans font-400 text-[#fff] leading-none opacity-60">{{
              t('jointMinting.jointMiningOrderTotal', { count: total })
            }}</span>
          </div>
          <div class="order-tabs w-100% mb-24">
            <button type="button" class="order-tab" :class="{ active: orderTab === 'mined' }"
              @click="handleOrderTabChange('mined')">
              {{ t('jointMinting.jointMiningOrder') }}
            </button>
            <button type="button" class="order-tab" :class="{ active: orderTab === 'pending' }"
              @click="handleOrderTabChange('pending')">
              {{ t('jointMinting.pendingOrder') }}
            </button>
          </div>
          <div class="log-line"></div>

          <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
            <van-list v-model:loading="loading" :finished="finished"
              :finished-text="jointMiningOrderList.length > 0 ? t('common.noMore') : ''" @load="onLoad"
              class="log-list">
              <!-- 空状态 -->
              <div v-if="jointMiningOrderList.length === 0 && !loading" class="empty-state">
                <van-empty :description="isPendingOrderTab ? '暂无待支付订单' : t('jointMinting.noOrder')" />
              </div>

              <!-- 列表项 -->
              <div v-for="(item, index) in jointMiningOrderList" :key="item.id || index"
                class="flex flex-col items-start justify-center gap-25 w-100%">
                <div class="log-line"></div>
                <div v-if="!isPendingOrderTab" class="flex flex-col w-100% gap-16 pb-20 items-start justify-center">
                  <!-- 联合挖矿名称 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.packageName')
                    }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                      {{ item.union?.name || '-' }}
                    </span>
                  </div>
                  <!-- 支付代币 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.payToken')
                    }}</span>
                    <div class="flex items-center gap-8">
                      <van-image v-if="item.union?.currency1?.img" width="20" height="20"
                        :src="item.union.currency1.img" fit="contain"></van-image>
                      <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                        {{ formatNumber(item.pay_coin1 || 0, 3) }}
                        {{ item.union?.currency1?.name || '' }}
                      </span>
                      <span class="fsize-20 font-pingfang font-400 text-[#fff] leading-normal opacity-60">
                        +
                      </span>
                      <van-image v-if="item.union?.currency2?.img" width="20" height="20"
                        :src="item.union.currency2.img" fit="contain"></van-image>
                      <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                        {{ formatNumber(item.pay_coin2 || 0, 3) }}
                        {{ item.union?.currency2?.name || '' }}
                      </span>
                    </div>
                  </div>
                  <!-- 投资数量 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.investmentQuantity')
                    }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">
                      {{ formatNumber(item.base_amount || 0, 3) }} U
                    </span>
                  </div>
                  <!-- 总算力 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.totalPower')
                    }}</span>
                    <span class="fsize-24 font-pingfang font-500 text-[#16FFC2] leading-normal">
                      +{{ formatNumber(item.total_power || 0, 3) }}
                    </span>
                  </div>
                  <!-- 日期 -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.date')
                    }}</span>
                    <span class="fsize-24 font-pingfang font-400 text-[#fff] leading-normal opacity-80">
                      {{ item.created_at }}
                    </span>
                  </div>
                </div>
                <div v-else class="flex flex-col w-100% gap-16 pb-20 items-start justify-center">
                  <!-- <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">订单ID</span>
                    <span class="fsize-24 font-roboto font-500 text-[#fff] leading-normal">
                      {{ item.id || '-' }}
                    </span>
                  </div> -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.totalPayAmount')
                    }}</span>
                    <span class="fsize-24 font-roboto font-500 text-[#fff] leading-normal">
                      {{ formatNumber(item.total_amount || 0, 3) }} PYTHIA
                    </span>
                  </div>
                  <!-- <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">状态</span>
                    <span class="fsize-24 font-pingfang font-500 leading-normal"
                      :class="item.status === 2 ? 'text-[#16FFC2]' : 'text-[#FFA94D]'">
                      {{ getWaitOrderStatusText(item.status) }}
                    </span>
                  </div> -->
                  <div class="flex items-center justify-between w-100%">
                    <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal">{{
                      t('jointMinting.createTime')
                    }}</span>
                    <span class="fsize-24 font-pingfang font-400 text-[#fff] leading-normal opacity-80">
                      {{ item.created_at }}
                    </span>
                  </div>
                  <div class="flex w-100% mt-8 items-center justify-end">
                    <button type="button" class="pending-pay-btn"
                      :class="{ disabled: Number(item.status) !== 1 || isPendingPaying(item) }"
                      @click="handlePendingPay(item)">
                      {{ isPendingPaying(item) ? t('jointMinting.getting') : Number(item.status) === 1 ?
                        t('jointMinting.goToPay') : t('jointMinting.paymentSuccess') }}
                    </button>
                  </div>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </div>

    <!-- 输入数量弹窗 -->
    <JointMiningInputPopup ref="inputPopupRef" v-model:show="showInputPopup" :package-info="selectedPackage"
      @confirm="handleInputConfirm" />

    <!-- 支付弹窗 -->
    <JointMiningPaymentPopup v-model:show="showPaymentPopup" :order-info="orderInfo" @confirm="handlePaymentSuccess" />
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

.exchange-btn {
  border-radius: 55px;
  background: var(--Style, linear-gradient(180deg, #00ff6e 0%, #009543 100%));
  box-shadow: 0 0 8px 0 rgba(0, 255, 110, 0.25) inset;
}

.tag {
  width: 94px;
  height: 47px;
  border-radius: 12px;
  background: rgba(0, 255, 110, 0.15);
  border: 1px solid rgba(0, 255, 110, 0.3);
  color: #00ff6e;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 110, 0.2);
  }
}

.hot {
  background: rgba(255, 205, 5, 0.15);
  border: 1px solid rgba(255, 205, 5, 0.3);
  color: #ffcd05;

  &:hover {
    background: rgba(255, 205, 5, 0.2);
  }
}

/* 空状态 */
.empty-state {
  padding: 100px 0;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.van-empty__description) {
    color: rgba(255, 255, 255, 0.5);
  }
}

/* 订单列表样式 */
.log-line {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.log-list {
  width: 100%;
  min-height: 200px;

  /* 自定义 van-list 的样式 */
  :deep(.van-list__finished-text) {
    color: rgba(255, 255, 255, 0.5);
    font-size: 24px;
    padding: 30px 0;
  }

  :deep(.van-list__loading) {
    .van-loading__spinner {
      color: #00ff6e;
    }

    .van-loading__text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 24px;
    }
  }
}

.order-tabs {
  display: flex;
  align-items: center;
  gap: 14px;
}

.order-tab {
  min-width: 160px;
  height: 58px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.68);
  font-size: 22px;
  font-family: 'PingFang SC', sans-serif;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
    color: #02151d;
    font-weight: 600;
  }
}

.pending-pay-btn {
  min-width: 144px;
  height: 58px;
  padding: 0 24px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
  color: #02151d;
  font-size: 24px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  transition: all 0.3s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.55);
  }

  &:active {
    transform: scale(0.98);
  }
}

/* 自定义下拉刷新样式 */
:deep(.van-pull-refresh__head) {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;

  .van-loading__spinner {
    color: #00ff6e;
  }
}

.close-btn-text {
  color: #000 !important;
  /* 按钮文字颜色改为白色 */
}
</style>
