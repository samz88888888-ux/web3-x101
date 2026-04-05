<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import mcnIcon from '@/assets/imgs/coin/pyt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin-old.png'
import sotaIcon from '@/assets/imgs/coin/x101-coin.png'
import adxIcon from '@/assets/imgs/coin/mcn-coin.png'
import dotIcon from '@/assets/imgs/power/dot.svg'
import filterIcon from '@/assets/imgs/user/fitter.svg'
import checkedIcon from '@/assets/imgs/power/checked.svg'

const { t } = useI18n()
const route = useRoute()

// 列表数据
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)

// 添加一个标志，用于判断是否需要清空列表（tab切换或类型切换）
const shouldClearList = ref(false)

// 添加加载锁，防止并发请求
const isLoadingData = ref(false)

// 分页参数
const params = ref({
  page: 1,
  page_size: 20
})

// 当前选中的币种 tab
const activeTab = ref('all')

// 类型选择器显示状态
const showTypePicker = ref(false)

// 当前选中的类型
const selectedType = ref({ name: t('walletEnum.all'), value: '' })

// 类型枚举映射
const typeEnum = {
  1: t('walletEnum.dataVerification'),
  2: t('walletEnum.withdrawal'),
  3: t('walletEnum.withdrawalReturn'),
  5: t('walletEnum.powerIncome'),
  6: t('walletEnum.minIncome'),
  7: t('walletEnum.leaderIncome'),
  8: t('walletEnum.nodeWithdrawalDAO'),
  9: t('walletEnum.daoProfit'),
  10: t('walletEnum.box'),
  11: t('walletEnum.boxProfit'),
  12: t('walletEnum.buyPower')
}

// 类型列表 (使用枚举)
const typeOptions = [
  { name: t('walletEnum.all'), value: '' },
  { name: t('walletEnum.dataVerification'), value: 1 },
  { name: t('walletEnum.withdrawal'), value: 2 },
  { name: t('walletEnum.withdrawalReturn'), value: 3 },
  { name: t('walletEnum.powerIncome'), value: 5 },
  { name: t('walletEnum.minIncome'), value: 6 },
  { name: t('walletEnum.leaderIncome'), value: 7 },
  { name: t('walletEnum.nodeWithdrawalDAO'), value: 8 },
  { name: t('walletEnum.daoProfit'), value: 9 },
  { name: t('walletEnum.box'), value: 10 },
  { name: t('walletEnum.boxProfit'), value: 11 },
  { name: t('walletEnum.buyPower'), value: 12 },
]

// 获取类型名称
const getTypeName = (type) => {
  return typeEnum[type] || t('walletEnum.other')
}

// 币种图标
const getCoinIcon = (amountType) => {
  if (amountType === 1) return x101Icon
  if (amountType === 2) return mcnIcon
  if (amountType === 3) return sotaIcon
  return usdtIcon
}

// 币种名称
const getCoinName = (amountType) => {
  if (amountType === 1) return 'X101'
  if (amountType === 2) return 'PYTHIA'
  if (amountType === 3) return 'SOTA'
  return 'PYTHIA'
}

// 加载数据
const getIncomeLog = async () => {
  // 如果正在加载，直接返回，防止并发请求
  if (isLoadingData.value) {
    console.log('已有请求在进行中，跳过本次请求')
    return
  }

  isLoadingData.value = true

  try {
    // 构建请求参数
    const requestParams = {
      page: params.value.page,
      page_size: params.value.page_size
    }

    // 添加币种筛选
    if (activeTab.value === 'X101') {
      requestParams.amount_type = '1'
    } else if (activeTab.value === 'PYTHIA') {
      requestParams.amount_type = '2'
    } else if (activeTab.value === 'SOTA') {
      requestParams.amount_type = '3'
    }
    // 全部时不传 amount_type

    // 添加类型筛选
    if (selectedType.value.value) {
      requestParams.type = selectedType.value.value.toString()
    }

    console.log('发送请求，页码:', params.value.page, '参数:', requestParams)

    const res = await api.wallet.getIncomeLog(requestParams)

    if (res?.list) {
      // 如果是下拉刷新、需要清空列表或第一页，清空列表
      if (refreshing.value || shouldClearList.value || params.value.page === 1) {
        console.log('清空并替换列表，数据条数:', res.list.length)
        list.value = res.list
        refreshing.value = false
        shouldClearList.value = false
      } else {
        // 否则追加数据
        console.log('追加数据，原有:', list.value.length, '新增:', res.list.length)
        list.value = [...list.value, ...res.list]
      }

      total.value = res.total || 0

      // 加载成功后,页码+1,准备下次加载
      params.value.page++

      // 判断是否已加载完所有数据
      if (list.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取资产记录失败:', error)
    showToast(error.message || '获取资产记录失败')
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

  // 如果正在切换标签，跳过自动加载
  if (shouldClearList.value) {
    return
  }

  getIncomeLog()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  params.value.page = 1
  list.value = []
  getIncomeLog()
}

// 切换币种选项卡
const handleTabChange = (tab) => {
  if (activeTab.value === tab) return

  activeTab.value = tab

  // 立即清空列表并设置标志
  list.value = []
  shouldClearList.value = true

  // 重置并刷新数据
  finished.value = false
  params.value.page = 1
  loading.value = false

  // 重新加载数据
  getIncomeLog()
}

// 打开类型选择器
const openTypePicker = () => {
  showTypePicker.value = true
}

// 选择类型
const onSelectType = (item, index) => {
  if (selectedType.value.value === item.value) return

  selectedType.value = item
  showTypePicker.value = false

  console.log('选择的类型:', item)

  // 立即清空列表并设置标志
  list.value = []
  shouldClearList.value = true

  // 重置并刷新数据
  finished.value = false
  params.value.page = 1
  loading.value = false

  // 重新加载数据
  getIncomeLog()
}

// 给 typeOptions 添加 className 来标识选中状态
const getTypeOptions = computed(() => {
  return typeOptions.map((item) => ({
    ...item,
    className: selectedType.value.value === item.value ? 'action-item-selected' : ''
  }))
})

// 初始化 - 从 URL 参数设置类型
onMounted(() => {
  const typeParam = route.query.type
  if (typeParam) {
    const type = parseInt(typeParam)
    const foundType = typeOptions.find((option) => option.value === type)
    if (foundType) {
      selectedType.value = foundType

      // 自动加载对应类型的数据
      list.value = []
      shouldClearList.value = true
      finished.value = false
      params.value.page = 1
      loading.value = false
      getIncomeLog()
    }
  }
})
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="power-container mt-37 w-100% flex-col pt-37 px-30 pb-195 items-start justify-center">
        <div class="flex items-center justify-between">
          <span class="block fsize-28 font-miSans font-630 text-[#fff] leading-none">
            {{ t('wallet.assetRecordTotal', { count: total }) }}
          </span>
          <div class="type-selector flex items-center justify-center gap-5 cursor-pointer" @click="openTypePicker">
            <span class="block fsize-22 font-miSans font-380 text-[#fff] lh-42 opacity-60">
              {{ selectedType.name }}
            </span>
            <van-image width="16" height="16" :src="filterIcon" fit="contain"></van-image>
          </div>
        </div>
        <div class="line"></div>
        <!-- 筛选块 -->
        <div class="mt-25 flex items-center justify-start gap-27">
          <div :class="[
            'filter-tab',
            { choosed: activeTab === 'all' },
            { 'no-choose': activeTab !== 'all' }
          ]" @click="handleTabChange('all')">
            <span class="fsize-26 font-pingfang font-600 leading-none uppercase">{{
              t('wallet.all')
            }}</span>
          </div>
          <div :class="[
            'filter-tab',
            { choosed: activeTab === 'SOTA' },
            { 'no-choose': activeTab !== 'SOTA' }
          ]" @click="handleTabChange('SOTA')">
            <span class="fsize-26 font-pingfang font-600 leading-none uppercase">SOTA</span>
          </div>
          <div :class="[
            'filter-tab',
            { choosed: activeTab === 'PYTHIA' },
            { 'no-choose': activeTab !== 'PYTHIA' }
          ]" @click="handleTabChange('PYTHIA')">
            <span class="fsize-26 font-pingfang font-600 leading-none uppercase">PYTHIA</span>
          </div>
          <div :class="[
            'filter-tab',
            { choosed: activeTab === 'X101' },
            { 'no-choose': activeTab !== 'X101' }
          ]" @click="handleTabChange('X101')">
            <span class="fsize-26 font-pingfang font-600 leading-none uppercase">X101</span>
          </div>

        </div>
        <div class="log-list flex flex-col items-start justify-center gap-24 pt-28">
          <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
            <van-list v-model:loading="loading" :finished="finished"
              :finished-text="list.length > 0 ? t('wallet.noMore') : ''" @load="onLoad" class="list-wrapper">
              <!-- 空状态 -->
              <div v-if="list.length === 0 && !loading" class="empty-state">
                <van-empty :description="t('wallet.noAssetRecord')" />
              </div>

              <!-- 列表项 -->
              <div v-for="(item, index) in list" :key="index"
                class="w-100% flex flex-col mt-20 items-start justify-center">
                <div class="flex w-100% items-center justify-between">
                  <div class="flex flex-col gap-16 items-start justify-center">
                    <div class="flex items-center justify-center gap-7">
                      <van-image width="20" height="20" :src="getCoinIcon(item.amount_type)" fit="contain"></van-image>
                      <span class="fsize-26 font-miSans font-380 text-[#fff] leading-none">
                        {{ getTypeName(item.type) }}
                      </span>
                    </div>
                    <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">
                      {{ item.created_at }}
                    </span>
                    <!-- 备注信息 -->
                    <!-- <span
                      v-if="item.remark"
                      class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-40">
                      {{ item.remark }}
                    </span> -->
                  </div>
                  <span :class="[
                    'fsize-26 font-miSans font-630 leading-none',
                    parseFloat(item.total) >= 0 ? 'text-[#16FFC2]' : 'text-[#FF3F85]'
                  ]">
                    {{ parseFloat(item.total) >= 0 ? '+' : '' }}{{ formatNumber(item.total, 3) }}
                    {{ getCoinName(item.amount_type) }}
                  </span>
                </div>
                <div class="line"></div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </div>

    <!-- 类型选择器 ActionSheet -->
    <van-action-sheet v-model:show="showTypePicker" :actions="getTypeOptions" :cancel-text="t('common.cancel')"
      close-on-click-action @select="onSelectType" class="type-action-sheet" />
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
  --Style: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
  --bgColor: linear-gradient(180deg, #352700 0%, #1d170b 12.2%, #030202 81.32%);
  --Radial: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);

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
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  }

  .line {
    margin-top: 24px;
    width: 100%;
    height: 1px;
    opacity: 0.1;
    background: #fff;
  }

  // /* 隐藏最后一个子元素的分割线 */
  // .log-list > div:last-child .line {
  //   display: none;
  // }

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

      .van-loading__spinner {
        color: #00ff6e;
      }
    }
  }
}

/* 筛选选项卡基础样式 */
.filter-tab {
  position: relative;
  width: 185px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  span {
    position: relative;
    z-index: 1;
    color: #fff;
    transition: color 0.3s ease;
  }

  /* 悬停效果 */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 110, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 未选中状态 */
.no-choose {
  background: rgba(255, 255, 255, 0.06);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 选中状态 - 带渐变边框 */
.choosed {
  background: #122626;
  animation: glow 0.3s ease-in-out;

  /* 使用伪元素实现渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 15px;
    padding: 1px;
    /* 边框宽度 */
    background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }

  /* 发光效果 */
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 15px;
    background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
    opacity: 0.3;
    blur: 8px;
    z-index: -1;
    animation: pulse 2s ease-in-out infinite;
  }

  span {
    color: #00ff6e;
    font-weight: 600;
  }

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 255, 110, 0.4);
  }
}

/* 发光动画 */
@keyframes glow {
  0% {
    box-shadow: 0 0 0 rgba(0, 255, 110, 0);
  }

  50% {
    box-shadow: 0 0 20px rgba(0, 255, 110, 0.6);
  }

  100% {
    box-shadow: 0 0 10px rgba(0, 255, 110, 0.3);
  }
}

/* 脉冲动画 */
@keyframes pulse {

  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.5;
  }
}

/* 类型选择器样式 */
:deep(.van-action-sheet) {
  background: linear-gradient(180deg, #1a0b2e 0%, #0f0518 100%) !important;
  border-radius: 30px 30px 0 0 !important;
  padding: 20px 0 !important;
}

:deep(.van-action-sheet__header) {
  color: #fff !important;
  font-size: 32px !important;
  font-weight: 600 !important;
  padding: 20px 0 !important;
}

:deep(.van-action-sheet__item) {
  background: transparent !important;
  color: #fff !important;
  font-size: 28px !important;
  padding: 24px 40px !important;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  }

  &:active {
    background: rgba(0, 255, 110, 0.1) !important;
    color: #00ff6e !important;
  }
}

/* 禁用 Vant 默认的选中高亮效果(防止闪烁) */
:deep(.van-action-sheet__item--active) {
  background: transparent !important;
  color: #fff !important;
}

/* 自定义选中状态样式 */
:deep(.action-item-selected) {
  color: #00ff6e !important;
  // background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 36.85%, #f658ff 30%) !important;
  font-weight: 500 !important;

  /* 添加选中标记点 - 使用伪元素 */
  &::before {
    content: '';
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
    z-index: 1;
  }
}

:deep(.van-action-sheet__gap) {
  background: transparent !important;
  height: 8px !important;
}

:deep(.van-action-sheet__cancel) {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #fff !important;
  font-size: 28px !important;
  border-radius: 20px !important;
  transition: all 0.3s ease;

  &:active {
    background: rgba(255, 255, 255, 0.1) !important;
  }
}

:deep(.van-overlay) {
  background-color: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(4px);
}
</style>
