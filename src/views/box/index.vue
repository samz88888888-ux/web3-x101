<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast, showSuccessToast } from 'vant'
import { formatNumber } from '@/utils/format'
import Footer from '@/components/footer.vue'
import treasureBox from '@/assets/imgs/game/treasure-box.gif'
import treasureBoxStatic from '@/assets/imgs/game/treasure-box.png'
import x101Coin from '@/assets/imgs/coin/x101-coin.png'

const { t } = useI18n()
const router = useRouter()

// ===== 盲盒配置信息 =====
const boxConfig = ref(null)
const isPageLoading = ref(true)

// 是否开启盲盒
const isBoxEnabled = computed(() => {
  return boxConfig.value?.box_enable === '1'
})

// 盲盒价格（U）
const boxPrice = computed(() => {
  return boxConfig.value?.price || '0'
})

// 需要支付的 X101 数量
const needX101 = computed(() => {
  return boxConfig.value?.needSOTA || '0'
})

// X101 余额
const x101Balance = computed(() => {
  return boxConfig.value?.sota_balance || '0'
})

// X101 当前价格
const x101Price = computed(() => {
  return boxConfig.value?.sota_price || 0
})

// ===== 抽奖状态 =====
const isDrawing = ref(false)
const showResultPopup = ref(false)
const drawResult = ref(null)

// ===== 抽奖结果类型枚举 =====
const BOX_TYPE = {
  ADX: 'box_adx_result',      // 抽中ADX
  POWER: 'box_power_result',  // 抽中算力
  VIP: 'box_vip_result'       // 抽中VIP升级卡
}

// 根据抽奖结果类型获取显示信息
const prizeDisplayInfo = computed(() => {
  if (!drawResult.value) {
    return {
      type: 'default',
      name: t('box.mysteryPrize'),
      value: '???',
      unit: ''
    }
  }

  const { box_type, result_value } = drawResult.value

  switch (box_type) {
    case BOX_TYPE.ADX:
      return {
        type: 'adx',
        name: t('box.prizeADX'),
        value: result_value,
        unit: ''
      }
    case BOX_TYPE.POWER:
      return {
        type: 'power',
        name: t('box.prizePower'),
        value: result_value,
        unit: 'TOPS'
      }
    case BOX_TYPE.VIP:
      return {
        type: 'vip',
        name: t('box.prizeVIP'),
        value: result_value,
        unit: t('box.prizeVIPUnit')
      }
    default:
      return {
        type: 'default',
        name: t('box.mysteryPrize'),
        value: result_value || '???',
        unit: ''
      }
  }
})

// ===== Tab 切换 =====
const activeTab = ref('draw') // draw: 抽奖记录, order: 算力订单

// ===== 抽奖记录 =====
const drawList = ref([])
const drawLoading = ref(false)
const drawFinished = ref(false)
const drawRefreshing = ref(false)
const drawParams = ref({ page: 1, page_size: 20 })
const drawTotal = ref(0)
const isDrawLoadingData = ref(false) // 加载锁
const shouldClearDrawList = ref(false) // 清空标志

// ===== 算力订单 =====
const orderList = ref([])
const orderLoading = ref(false)
const orderFinished = ref(false)
const orderRefreshing = ref(false)
const orderParams = ref({ page: 1, page_size: 20 })
const orderTotal = ref(0)
const isOrderLoadingData = ref(false) // 加载锁
const shouldClearOrderList = ref(false) // 清空标志

// 根据 box_type 获取抽奖记录的显示信息
const getDrawRecordInfo = (item) => {
  const { box_type, result_value } = item

  switch (box_type) {
    case BOX_TYPE.ADX:
      return {
        type: 'adx',
        typeName: t('box.prizeADX'),
        value: result_value,
        unit: ''
      }
    case BOX_TYPE.POWER:
      return {
        type: 'power',
        typeName: t('box.prizePower'),
        value: result_value,
        unit: 'TOPS'
      }
    case BOX_TYPE.VIP:
      return {
        type: 'vip',
        typeName: t('box.prizeVIP'),
        value: result_value,
        unit: t('box.prizeVIPUnit')
      }
    default:
      return {
        type: 'default',
        typeName: t('box.prize'),
        value: result_value || '--',
        unit: ''
      }
  }
}

// ===== 获取盲盒配置 =====
const getBoxConfig = async () => {
  try {
    const res = await api.box.getBoxConfig()
    if (res) {
      boxConfig.value = res
    }
  } catch (error) {
    console.error('获取盲盒配置失败:', error)
    showToast(t('box.getConfigFailed'))
  }
}

// ===== 立即抽奖 =====
const handleDraw = async () => {
  // 检查是否开启
  if (!isBoxEnabled.value) {
    showToast(t('box.boxNotEnabled'))
    return
  }

  // 检查余额
  if (parseFloat(x101Balance.value) < parseFloat(needX101.value)) {
    showToast(t('box.balanceNotEnough'))
    return
  }

  // 防止重复点击
  if (isDrawing.value) return

  try {
    isDrawing.value = true

    // 显示开奖动画
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 调用抽奖接口
    const res = await api.box.boxOperate()

    // 保存结果
    drawResult.value = res

    // 更新余额
    if (res?.sota_balance !== undefined) {
      boxConfig.value.sota_balance = res.sota_balance
    } else {
      // 重新获取配置以更新余额
      await getBoxConfig()
    }

    // 显示结果弹窗
    showResultPopup.value = true

    // 刷新抽奖记录（无论当前是哪个 tab 都刷新）
    refreshDrawRecords()

    // 如果抽中的是算力，也刷新算力订单
    if (res?.box_type === BOX_TYPE.POWER) {
      refreshOrderRecords()
    }

  } catch (error) {
    console.error('抽奖失败:', error)
    showToast(error.message || t('box.drawFailed'))
  } finally {
    isDrawing.value = false
  }
}

// ===== 关闭结果弹窗 =====
const closeResultPopup = () => {
  showResultPopup.value = false
  // 不在这里清空 drawResult，等弹窗关闭动画结束后再清空
}

// 弹窗关闭动画结束后清空数据
const onResultPopupClosed = () => {
  drawResult.value = null
}

// ===== 抽奖记录实际加载函数 =====
const getDrawList = async () => {
  // 如果正在加载，跳过
  if (isDrawLoadingData.value) {
    return
  }

  isDrawLoadingData.value = true

  try {
    const res = await api.box.getBoxList(drawParams.value)

    if (res?.list) {
      // 如果是第一页，替换列表
      if (drawParams.value.page === 1) {
        drawList.value = res.list
      } else {
        drawList.value = [...drawList.value, ...res.list]
      }

      drawTotal.value = res.total || 0
      drawParams.value.page++

      if (drawList.value.length >= drawTotal.value) {
        drawFinished.value = true
      }
    } else {
      drawFinished.value = true
    }
  } catch (error) {
    console.error('获取抽奖记录失败:', error)
    drawFinished.value = true
  } finally {
    drawLoading.value = false
    drawRefreshing.value = false
    isDrawLoadingData.value = false
    shouldClearDrawList.value = false
  }
}

// van-list 触发的加载（上拉加载更多）
const onDrawLoad = () => {
  // 如果正在刷新或标记清空，跳过 van-list 自动触发的加载
  if (drawRefreshing.value || shouldClearDrawList.value) {
    return
  }
  getDrawList()
}

// 抽奖记录下拉刷新（van-pull-refresh 触发）
const onDrawRefresh = () => {
  drawList.value = []
  shouldClearDrawList.value = true
  drawFinished.value = false
  drawParams.value.page = 1
  drawLoading.value = false
  drawRefreshing.value = true
  // 直接调用加载函数，不经过 onDrawLoad
  getDrawList()
}

// 手动刷新抽奖记录（抽奖成功后调用）
const refreshDrawRecords = () => {
  drawList.value = []
  drawFinished.value = false
  drawParams.value.page = 1
  drawLoading.value = false
  drawRefreshing.value = false
  shouldClearDrawList.value = false
  getDrawList()
}

// ===== 算力订单实际加载函数 =====
const getOrderList = async () => {
  // 如果正在加载，跳过
  if (isOrderLoadingData.value) {
    return
  }

  isOrderLoadingData.value = true

  try {
    const res = await api.box.getBoxOrderList(orderParams.value)

    if (res?.list) {
      // 如果是第一页，替换列表
      if (orderParams.value.page === 1) {
        orderList.value = res.list
      } else {
        orderList.value = [...orderList.value, ...res.list]
      }

      orderTotal.value = res.total || 0
      orderParams.value.page++

      if (orderList.value.length >= orderTotal.value) {
        orderFinished.value = true
      }
    } else {
      orderFinished.value = true
    }
  } catch (error) {
    console.error('获取算力订单失败:', error)
    orderFinished.value = true
  } finally {
    orderLoading.value = false
    orderRefreshing.value = false
    isOrderLoadingData.value = false
    shouldClearOrderList.value = false
  }
}

// van-list 触发的加载（上拉加载更多）
const onOrderLoad = () => {
  // 如果正在刷新或标记清空，跳过 van-list 自动触发的加载
  if (orderRefreshing.value || shouldClearOrderList.value) {
    return
  }
  getOrderList()
}

// 算力订单下拉刷新（van-pull-refresh 触发）
const onOrderRefresh = () => {
  orderList.value = []
  shouldClearOrderList.value = true
  orderFinished.value = false
  orderParams.value.page = 1
  orderLoading.value = false
  orderRefreshing.value = true
  // 直接调用加载函数，不经过 onOrderLoad
  getOrderList()
}

// 手动刷新算力订单（抽奖成功后调用）
const refreshOrderRecords = () => {
  orderList.value = []
  orderFinished.value = false
  orderParams.value.page = 1
  orderLoading.value = false
  orderRefreshing.value = false
  shouldClearOrderList.value = false
  getOrderList()
}

// ===== Tab 切换处理 =====
const handleTabChange = (name) => {
  if (activeTab.value === name) return

  activeTab.value = name

  // 切换到算力订单且列表为空时加载数据
  if (name === 'order' && orderList.value.length === 0 && !isOrderLoadingData.value) {
    orderFinished.value = false
    orderParams.value.page = 1
    getOrderList()
  }
}

// ===== 格式化时间 =====
const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  return timeStr
}

// ===== 跳转升级卡页面 =====
const goToUpgradeCard = () => {
  router.push('/upgrade-card')
}

// ===== 预加载图片避免闪烁 =====
const preloadImages = () => {
  const images = [treasureBox, treasureBoxStatic]
  images.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

// ===== 页面初始化 =====
onMounted(async () => {
  // 预加载盲盒图片
  preloadImages()

  try {
    isPageLoading.value = true
    await getBoxConfig()
  } finally {
    isPageLoading.value = false
  }
})
</script>

<template>
  <div class="container">
    <!-- 页面加载遮罩 -->
    <div v-if="isPageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <van-loading type="spinner" size="40" color="#F903A4" />
        <p class="loading-text">{{ t('box.loading') }}</p>
      </div>
    </div>

    <div class="body" :class="{ 'is-loading': isPageLoading }">
      <!-- 页面标题 -->
      <div class="page-header flex items-center justify-between">
        <div class="flex gap-12 items-center">
          <div class="title-badge"></div>
          <span class="page-title">{{ t('box.title') }}</span>
        </div>
      </div>

      <!-- 盲盒信息卡片 - 重新设计为紧凑布局 -->
      <div class="box-info-card">
        <!-- 左侧：价格信息 -->
        <div class="price-section">
          <div class="price-label-row">
            <svg class="price-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.31 11.14C10.54 10.69 9.97 10.2 9.97 9.47C9.97 8.63 10.76 8.04 12.07 8.04C13.45 8.04 13.97 8.7 14.01 9.68H15.72C15.67 8.34 14.85 7.11 13.23 6.71V5H10.9V6.69C9.39 7.01 8.18 7.99 8.18 9.5C8.18 11.29 9.67 12.19 11.84 12.71C13.79 13.17 14.18 13.86 14.18 14.58C14.18 15.11 13.79 15.97 12.07 15.97C10.47 15.97 9.87 15.26 9.78 14.33H8.08C8.18 16.03 9.4 16.99 10.9 17.3V19H13.24V17.33C14.76 17.04 15.96 16.17 15.97 14.56C15.96 12.36 14.07 11.6 12.31 11.14Z"
                fill="currentColor" />
            </svg>
            <span>{{ t('box.boxPrice') }}</span>
          </div>
          <div class="price-value-row">
            <span class="price-value">{{ boxPrice }}</span>
            <span class="price-unit">USDT</span>
          </div>
          <div class="price-convert">
            <span>≈ {{ formatNumber(needX101, 3) }} SOTA</span>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 右侧：余额信息 -->
        <div class="balance-section">
          <div class="balance-row">
            <van-image width="24" height="24" :src="x101Coin" fit="contain"></van-image>
            <span class="balance-label">{{ t('box.myBalance') }}</span>
          </div>
          <div class="balance-value-row">
            <span class="balance-value">{{ formatNumber(x101Balance, 4) }}</span>
            <span class="balance-unit">SOTA</span>
          </div>
          <div class="x101-price">
            <span>$</span>{{ formatNumber(x101Price, 4) }}
          </div>
        </div>
      </div>

      <!-- 盲盒展示区域 -->
      <div class="box-display-area">
        <div class="box-glow"></div>
        <div class="box-container" :class="{ 'is-drawing': isDrawing }">
          <!-- 使用原生img避免van-image切换时的白色闪烁 -->
          <img :src="isDrawing ? treasureBox : treasureBoxStatic" alt="treasure box" class="treasure-box-img"
            width="440" height="440" />
        </div>

        <!-- 装饰粒子 -->
        <div class="particles">
          <div class="particle" v-for="i in 8" :key="i" :style="{ '--delay': `${i * 0.2}s` }"></div>
        </div>
      </div>

      <!-- 抽奖按钮 - 独立层级确保可点击 -->
      <div class="draw-btn-wrapper">
        <button class="draw-btn" :class="{ 'is-drawing': isDrawing, 'disabled': !isBoxEnabled }"
          :disabled="isDrawing || !isBoxEnabled" @click="handleDraw">
          <span v-if="isDrawing" class="drawing-text">
            <van-loading type="spinner" size="20" color="#fff" />
            {{ t('box.drawing') }}
          </span>
          <span v-else class="btn-text">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor" />
            </svg>
            {{ t('box.drawNow') }}
          </span>
        </button>
      </div>

      <!-- 升级卡入口 - 重构设计 -->
      <div class="upgrade-card-entry" @click="goToUpgradeCard">
        <div class="entry-icon-wrapper">
          <svg class="entry-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"
              fill="currentColor" />
          </svg>
        </div>
        <div class="entry-content">
          <span class="entry-title">{{ t('box.myUpgradeCard') }}</span>
          <span class="entry-desc">{{ t('box.upgradeCardDesc') }}</span>
        </div>
        <div class="entry-arrow">
          <van-icon name="arrow" size="18" color="rgba(255,255,255,0.5)" />
        </div>
      </div>

      <!-- 记录 Tab 切换区域 -->
      <div class="records-section">
        <div class="tabs-header">
          <div class="tab-item" :class="{ active: activeTab === 'draw' }" @click="handleTabChange('draw')">
            <span>{{ t('box.drawRecord') }}</span>
            <div class="tab-indicator" v-if="activeTab === 'draw'"></div>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'order' }" @click="handleTabChange('order')">
            <span>{{ t('box.powerOrder') }}</span>
            <div class="tab-indicator" v-if="activeTab === 'order'"></div>
          </div>
        </div>

        <!-- 抽奖记录列表 -->
        <div v-show="activeTab === 'draw'" class="tab-content">
          <div class="record-header">
            <span class="record-count">{{ t('box.totalRecords', { count: drawTotal }) }}</span>
          </div>

          <van-pull-refresh v-model="drawRefreshing" @refresh="onDrawRefresh" class="w-100%">
            <van-list v-model:loading="drawLoading" :finished="drawFinished"
              :finished-text="drawList.length > 0 ? t('common.noMore') : ''" @load="onDrawLoad" class="record-list">
              <!-- 空状态 -->
              <div v-if="drawList.length === 0 && !drawLoading" class="empty-state">
                <van-empty :description="t('box.noDrawRecord')" />
              </div>

              <!-- 列表项 - 根据API返回数据渲染 -->
              <div v-for="(item, index) in drawList" :key="index" class="record-item draw-item">
                <div class="record-left">
                  <div class="record-type-badge" :class="getDrawRecordInfo(item).type">
                    {{ getDrawRecordInfo(item).typeName }}
                  </div>
                  <div class="record-info">
                    <span class="record-time">{{ formatTime(item.created_at) }}</span>
                    <span class="record-sub">-{{ formatNumber(item.sub_x101, 3) }} SOTA</span>
                  </div>
                </div>
                <div class="record-right">
                  <span class="record-amount positive">
                    +{{ formatNumber(getDrawRecordInfo(item).value, 3) }}
                  </span>
                  <span class="record-unit">{{ getDrawRecordInfo(item).unit }}</span>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>

        <!-- 算力订单列表 -->
        <div v-show="activeTab === 'order'" class="tab-content">
          <div class="record-header">
            <span class="record-count">{{ t('box.totalRecords', { count: orderTotal }) }}</span>
          </div>

          <van-pull-refresh v-model="orderRefreshing" @refresh="onOrderRefresh" class="w-100%">
            <van-list v-model:loading="orderLoading" :finished="orderFinished"
              :finished-text="orderList.length > 0 ? t('common.noMore') : ''" @load="onOrderLoad" class="record-list">
              <!-- 空状态 -->
              <div v-if="orderList.length === 0 && !orderLoading" class="empty-state">
                <van-empty :description="t('box.noOrderRecord')" />
              </div>

              <!-- 列表项 - 根据API返回数据渲染 -->
              <div v-for="(item, index) in orderList" :key="index" class="record-item order-item">
                <div class="record-left">
                  <div class="order-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div class="record-info">
                    <span class="record-name">{{ t('box.basePower') }}: {{ formatNumber(item.base_power, 3) }}</span>
                    <span class="record-time">{{ formatTime(item.created_at) }}</span>
                    <span class="record-days">{{ t('box.compoundDays') }}: {{ item.computing_day }}{{ t('box.day')
                      }}</span>
                  </div>
                </div>
                <div class="record-right">
                  <span class="record-power">+{{ formatNumber(item.total_power, 3) }}</span>
                  <span class="record-unit">TOPS</span>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </div>

    <!-- 抽奖结果弹窗 -->
    <van-popup v-model:show="showResultPopup" :style="{ background: 'transparent' }"
      :overlay-style="{ background: 'rgba(0, 0, 0, 0.85)' }" class="result-popup-wrapper" @closed="onResultPopupClosed">
      <div class="result-popup">
        <!-- 光效背景 -->
        <div class="result-glow"></div>

        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closeResultPopup">
          <van-icon name="cross" size="22" color="rgba(255,255,255,0.6)" />
        </div>

        <!-- 恭喜文字 -->
        <div class="result-header">
          <div class="congrats-text">{{ t('box.congratulations') }}</div>
          <div class="result-subtitle">{{ t('box.youGot') }}</div>
        </div>

        <!-- 奖品展示 -->
        <div class="prize-display">


          <div class="prize-info">
            <span class="prize-name">{{ prizeDisplayInfo.name }}</span>
            <div class="prize-value-row">
              <span class="prize-value">{{ prizeDisplayInfo.type === 'vip' ? prizeDisplayInfo.value :
                formatNumber(prizeDisplayInfo.value, 3) }}</span>
              <span class="prize-unit">{{ prizeDisplayInfo.unit }}</span>
            </div>
          </div>
        </div>

        <!-- 确认按钮 -->
        <button class="confirm-btn" @click="closeResultPopup">
          {{ t('box.gotIt') }}
        </button>
      </div>
    </van-popup>
  </div>

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

  --Linear: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);

  // 页面加载遮罩
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

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      .loading-text {
        font-size: 28px;
        font-weight: 600;
        color: #fff;
        font-family: 'PingFang SC', sans-serif;
      }
    }
  }

  .body {
    width: 100%;
    padding: 40px 30px 200px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    &.is-loading {
      opacity: 0.3;
      pointer-events: none;
    }
  }
}

// 页面标题
.page-header {
  .title-badge {
    width: 8px;
    height: 32px;
    border-radius: 4px;
    background: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
    letter-spacing: 1px;
  }
}

// 盲盒信息卡片 - 紧凑横向布局
.box-info-card {
  position: relative;
  width: 100%;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(249, 3, 164, 0.12) 0%, rgba(138, 4, 255, 0.08) 100%);
  border: 1px solid rgba(249, 3, 164, 0.2);
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow: hidden;

  // 光效装饰
  &::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(249, 3, 164, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  // 左侧价格区域
  .price-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 1;

    .price-label-row {
      display: flex;
      align-items: center;
      gap: 6px;

      .price-icon {
        width: 16px;
        height: 16px;
        color: #F903A4;
      }

      span {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .price-value-row {
      display: flex;
      align-items: baseline;
      gap: 6px;

      .price-value {
        font-size: 42px;
        font-weight: 700;
        color: #fff;
        font-family: 'Roboto', sans-serif;
        line-height: 1;
      }

      .price-unit {
        font-size: 18px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Roboto', sans-serif;
      }
    }

    .price-convert {
      span {
        font-size: 20px;
        font-weight: 400;
        color: #F903A4;
        font-family: 'Roboto', sans-serif;
      }
    }
  }

  // 分隔线
  .divider {
    width: 1px;
    background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%);
    margin: 0 20px;
  }

  // 右侧余额区域
  .balance-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    position: relative;
    z-index: 1;

    .balance-row {
      display: flex;
      align-items: center;
      gap: 6px;

      .balance-label {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .balance-value-row {
      display: flex;
      align-items: baseline;
      gap: 6px;

      .balance-value {
        font-size: 32px;
        font-weight: 700;
        color: #16FFC2;
        font-family: 'Roboto', sans-serif;
        line-height: 1;
      }

      .balance-unit {
        font-size: 16px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Roboto', sans-serif;
      }
    }

    .x101-price {
      font-size: 20px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
      font-family: 'Roboto', sans-serif;

      span {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}

// 盲盒展示区域
.box-display-area {
  position: relative;
  width: 100%;
  height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -70px 0 -20px;
  overflow: visible;
  z-index: 1;

  .box-glow {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 3, 164, 0.35) 0%, transparent 70%);
    filter: blur(40px);
    animation: glow-pulse 3s ease-in-out infinite;
    z-index: 0;
  }

  .box-container {
    position: relative;
    z-index: 1;
    animation: float 3s ease-in-out infinite;
    pointer-events: none; // 防止盲盒阻挡点击

    &.is-drawing {
      animation: shake 0.5s ease-in-out infinite;
    }

    .treasure-box-img {
      width: 440px;
      height: 440px;
      object-fit: contain;
      filter: drop-shadow(0 8px 25px rgba(249, 3, 164, 0.45));
      // 防止图片切换时的闪烁
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
    }
  }

  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;

    .particle {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F903A4, #8A04FF);
      opacity: 0.5;
      animation: particle-float 4s ease-in-out infinite;
      animation-delay: var(--delay);

      &:nth-child(1) {
        left: 12%;
        top: 25%;
      }

      &:nth-child(2) {
        left: 82%;
        top: 28%;
      }

      &:nth-child(3) {
        left: 18%;
        top: 65%;
      }

      &:nth-child(4) {
        left: 78%;
        top: 68%;
      }

      &:nth-child(5) {
        left: 8%;
        top: 48%;
      }

      &:nth-child(6) {
        left: 88%;
        top: 52%;
      }

      &:nth-child(7) {
        left: 35%;
        top: 15%;
      }

      &:nth-child(8) {
        left: 65%;
        top: 80%;
      }
    }
  }
}

@keyframes glow-pulse {

  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.08);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0) rotate(0);
  }

  25% {
    transform: translateX(-5px) rotate(-2deg);
  }

  75% {
    transform: translateX(5px) rotate(2deg);
  }
}

@keyframes particle-float {

  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }

  50% {
    transform: translateY(-15px) scale(1.15);
    opacity: 0.9;
  }
}

// 抽奖按钮
.draw-btn-wrapper {
  margin-top: 30px;
  padding: 0 20px;
  position: relative;
  z-index: 10; // 确保按钮在最上层

  .draw-btn {
    width: 100%;
    height: 88px;
    border: none;
    border-radius: 44px;
    background: linear-gradient(135deg, #FF3F85 0%, #8A04FF 100%);
    box-shadow: 0 8px 32px rgba(249, 3, 164, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 70%);
      animation: shine 3s infinite;
    }

    .btn-text,
    .drawing-text {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      color: #fff;
    }

    &:active:not(.disabled) {
      transform: scale(0.98);
      box-shadow: 0 4px 16px rgba(249, 3, 164, 0.4);
    }

    &.is-drawing {
      background: linear-gradient(135deg, #8A04FF 0%, #FF3F85 100%);
      pointer-events: none;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;

      &::before {
        animation: none;
      }
    }
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

// 升级卡入口 - 重构样式
.upgrade-card-entry {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 107, 0, 0.1) 100%);
  border: 1px solid rgba(255, 184, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  // 光效装饰
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(255, 184, 0, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.98);
    background: linear-gradient(135deg, rgba(255, 184, 0, 0.15) 0%, rgba(255, 107, 0, 0.15) 100%);
  }

  .entry-icon-wrapper {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);

    .entry-icon {
      width: 28px;
      height: 28px;
      color: #fff;
    }
  }

  .entry-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .entry-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
    }

    .entry-desc {
      font-size: 22px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .entry-arrow {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    // background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

// 记录区域
.records-section {
  position: relative;
  width: 100%;
  padding: 24px;
  border-radius: 24px;
  background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 45%, #f658ff 100%);
  margin-top: 10px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: var(--Linear);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .tabs-header {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .tab-item {
      position: relative;
      padding-bottom: 8px;
      cursor: pointer;

      span {
        font-size: 28px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'PingFang SC', sans-serif;
        transition: color 0.3s ease;
      }

      &.active span {
        color: #fff;
        font-weight: 600;
      }

      .tab-indicator {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 3px;
        border-radius: 2px;
        background: linear-gradient(90deg, #F903A4, #8A04FF);
      }
    }
  }

  .tab-content {
    min-height: 200px;

    .record-header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 16px;

      .record-count {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .record-list {
      min-height: 150px;

      :deep(.van-list__finished-text) {
        color: rgba(255, 255, 255, 0.4);
        font-size: 22px;
        padding: 20px 0;
      }

      :deep(.van-list__loading) {
        padding: 20px 0;

        .van-loading__spinner {
          color: #F903A4;
        }
      }
    }

    .empty-state {
      padding: 60px 0;
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(.van-empty__description) {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .record-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      &:last-child {
        border-bottom: none;
      }

      .record-left {
        display: flex;
        align-items: center;
        gap: 14px;

        .record-type-badge {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: 500;
          color: #fff;
          background: linear-gradient(135deg, #F903A4 0%, #8A04FF 100%);
          white-space: nowrap;

          // ADX类型
          &.adx {
            background: linear-gradient(135deg, #8A04FF 0%, #F903A4 100%);
          }

          // 算力类型
          &.power {
            background: linear-gradient(135deg, #16FFC2 0%, #00B8FF 100%);
            color: #000;
          }

          // VIP升级卡类型
          &.vip {
            background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
          }

          &.default {
            background: linear-gradient(135deg, #F903A4 0%, #8A04FF 100%);
          }
        }

        .order-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(22, 255, 194, 0.2), rgba(0, 184, 255, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          svg {
            width: 24px;
            height: 24px;
            color: #16FFC2;
          }
        }

        .record-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .record-name {
            font-size: 24px;
            font-weight: 500;
            color: #fff;
            font-family: 'PingFang SC', sans-serif;
          }

          .record-time {
            font-size: 20px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.4);
            font-family: 'Roboto', sans-serif;
          }

          .record-sub {
            font-size: 18px;
            font-weight: 400;
            color: #FF6B6B;
            font-family: 'Roboto', sans-serif;
          }

          .record-days {
            font-size: 18px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.4);
            font-family: 'PingFang SC', sans-serif;
          }
        }
      }

      .record-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;

        .record-amount {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          font-family: 'Roboto', sans-serif;

          &.positive {
            color: #16FFC2;
          }
        }

        .record-power {
          font-size: 28px;
          font-weight: 700;
          color: #16FFC2;
          font-family: 'Roboto', sans-serif;
        }

        .record-unit {
          font-size: 18px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Roboto', sans-serif;
        }
      }

      // 抽奖记录特殊样式
      &.draw-item {
        .record-left {
          align-items: flex-start;
        }
      }

      // 算力订单特殊样式
      &.order-item {
        .record-left {
          align-items: flex-start;
        }
      }
    }
  }
}

// 下拉刷新样式
:deep(.van-pull-refresh) {
  min-height: 150px;

  .van-pull-refresh__head {
    color: rgba(255, 255, 255, 0.6);
  }
}

// 结果弹窗
.result-popup-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-popup {
  position: relative;
  width: 560px;
  padding: 50px 40px 40px;
  border-radius: 32px;
  background: linear-gradient(180deg, #1A0B2E 0%, #0F0518 100%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 32px;
    padding: 2px;
    background: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .result-glow {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 3, 164, 0.3) 0%, transparent 60%);
    filter: blur(60px);
    pointer-events: none;
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.9);
    }
  }

  .result-header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
    z-index: 1;

    .congrats-text {
      font-size: 42px;
      font-weight: 700;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
      margin-bottom: 8px;
      animation: congrats-bounce 0.6s ease;
    }

    .result-subtitle {
      font-size: 26px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.6);
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .prize-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-bottom: 40px;
    position: relative;
    z-index: 1;

    .prize-icon-wrapper {
      position: relative;
      width: 120px;
      height: 120px;

      .prize-icon-glow {
        position: absolute;
        inset: -20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(249, 3, 164, 0.4) 0%, transparent 70%);
        animation: icon-pulse 2s ease-in-out infinite;
      }

      // 不同奖品类型的光晕颜色
      &.power .prize-icon-glow {
        background: radial-gradient(circle, rgba(22, 255, 194, 0.4) 0%, transparent 70%);
      }

      &.vip .prize-icon-glow {
        background: radial-gradient(circle, rgba(255, 184, 0, 0.4) 0%, transparent 70%);
      }

      &.adx .prize-icon-glow {
        background: radial-gradient(circle, rgba(138, 4, 255, 0.4) 0%, transparent 70%);
      }

      .prize-icon {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #F903A4 0%, #8A04FF 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: icon-bounce 0.8s ease;

        // 不同奖品类型的图标背景颜色
        &.power {
          background: linear-gradient(135deg, #16FFC2 0%, #00B8FF 100%);
        }

        &.vip {
          background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
        }

        &.adx {
          background: linear-gradient(135deg, #8A04FF 0%, #F903A4 100%);
        }

        svg {
          width: 60px;
          height: 60px;
          color: #fff;
        }
      }
    }

    .prize-info {
      text-align: center;

      .prize-name {
        display: block;
        font-size: 32px;
        font-weight: 600;
        color: #fff;
        font-family: 'PingFang SC', sans-serif;
        margin-bottom: 12px;
      }

      .prize-value-row {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 8px;

        .prize-value {
          font-size: 48px;
          font-weight: 700;
          color: #16FFC2;
          font-family: 'Roboto', sans-serif;
          animation: value-count 0.8s ease-out;
        }

        .prize-unit {
          font-size: 28px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Roboto', sans-serif;
        }
      }
    }
  }

  .confirm-btn {
    width: 100%;
    height: 80px;
    border: none;
    border-radius: 40px;
    background: linear-gradient(135deg, #F903A4 0%, #8A04FF 100%);
    box-shadow: 0 6px 24px rgba(249, 3, 164, 0.4);
    font-size: 30px;
    font-weight: 600;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    &:active {
      transform: scale(0.98);
    }
  }
}

@keyframes congrats-bounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes icon-pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes icon-bounce {
  0% {
    transform: scale(0) rotate(-180deg);
  }

  60% {
    transform: scale(1.2) rotate(10deg);
  }

  100% {
    transform: scale(1) rotate(0);
  }
}

@keyframes value-count {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
