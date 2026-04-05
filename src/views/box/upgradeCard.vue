<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast, showSuccessToast } from 'vant'
import Footer from '@/components/footer.vue'

const { t } = useI18n()

// ===== VIP卡信息 =====
const vipInfo = ref(null)
const isPageLoading = ref(true)

// 当前等级
const currentLevel = computed(() => vipInfo.value?.nowLevelName || '--')
const currentLevelId = computed(() => vipInfo.value?.nowLevelId || 0)

// 下一等级
const nextLevel = computed(() => vipInfo.value?.nextLevelName || '--')
const nextLevelId = computed(() => vipInfo.value?.nextLevelId || 0)

// 可用卡数量
const availableCards = computed(() => vipInfo.value?.userCardCount || 0)

// 已用卡数量
const usedCards = computed(() => vipInfo.value?.expiredCardCount || 0)

// 升级需要的卡数量
const needCards = computed(() => vipInfo.value?.needVipCardNum || 0)

// 是否可以升级
const canUpgrade = computed(() => vipInfo.value?.canUpgrade || false)

// ===== 升级状态 =====
const isUpgrading = ref(false)
const showUpgradeConfirm = ref(false) // 自定义确认弹窗

// 操作类型枚举
const OPERATE_TYPE = {
  DRAW_GET: 1,      // 抽奖获得
  UPGRADE_USE: 2,   // 升级使用
  TRANSFER_OUT: 3,  // 转出
  TRANSFER_IN: 4    // 收到转入
}

// 根据操作类型获取日志显示信息
const getLogDisplayInfo = (item) => {
  const num = item.num || 0
  const displayNum = num > 0 ? `+${num}` : num // 大于0加+号，小于0服务端已返回-号

  switch (item.operate_type) {
    case OPERATE_TYPE.DRAW_GET:
      return {
        type: 'get',
        title: t('vipCard.drawGet'),
        icon: 'gift',
        detail: displayNum,
        detailColor: '#16FFC2',
        showBadge: true
      }

    case OPERATE_TYPE.UPGRADE_USE:
      const upgradeInfo = item.upgrade_info || {}
      return {
        type: 'use',
        title: t('vipCard.upgradeUse'),
        icon: 'arrow',
        detail: `${upgradeInfo.now_level_name || '--'} → ${upgradeInfo.next_level_name || '--'} ${displayNum}`,
        subtitle: displayNum,
        detailColor: '#FFB800',
        showBadge: true
      }

    case OPERATE_TYPE.TRANSFER_OUT:
      return {
        type: 'transfer-out',
        title: t('vipCard.transferOut'),
        icon: 'transfer-out',
        detail: displayNum,
        detailColor: '#FF6B6B',
        showBadge: true
      }

    case OPERATE_TYPE.TRANSFER_IN:
      return {
        type: 'transfer-in',
        title: t('vipCard.transferIn'),
        icon: 'transfer-in',
        detail: displayNum,
        detailColor: '#16FFC2',
        showBadge: true
      }

    default:
      return {
        type: 'default',
        title: t('vipCard.levelUpgrade'),
        icon: 'arrow',
        detail: displayNum,
        detailColor: '#fff',
        showBadge: false
      }
  }
}

// ===== 升级日志 =====
const logList = ref([])
const logLoading = ref(false)
const logFinished = ref(false)
const logRefreshing = ref(false)
const logParams = ref({ page: 1, page_size: 20 })
const logTotal = ref(0)
const isLogLoadingData = ref(false)

// ===== 获取VIP卡信息 =====
const getVipCardInfo = async () => {
  try {
    const res = await api.box.getVipCardInfo()
    if (res) {
      vipInfo.value = res
    }
  } catch (error) {
    console.error('获取VIP卡信息失败:', error)
    showToast(t('vipCard.getInfoFailed'))
  }
}

// ===== 升级操作 =====
const handleUpgrade = () => {
  if (!canUpgrade.value) {
    showToast(t('vipCard.cannotUpgrade'))
    return
  }

  if (isUpgrading.value) return

  // 显示自定义确认弹窗
  showUpgradeConfirm.value = true
}

// 取消升级
const cancelUpgrade = () => {
  showUpgradeConfirm.value = false
}

// 确认升级
const confirmUpgrade = async () => {
  showUpgradeConfirm.value = false

  try {
    isUpgrading.value = true
    showLoadingToast({
      message: t('vipCard.upgrading'),
      forbidClick: true,
      duration: 0
    })

    await api.box.vipCardUpgrade()

    closeToast()
    showSuccessToast(t('vipCard.upgradeSuccess'))

    // 刷新VIP卡信息
    await getVipCardInfo()

    // 刷新升级日志
    refreshLogRecords()

  } catch (error) {
    closeToast()
    console.error('升级失败:', error)
    showToast(error.message || t('vipCard.upgradeFailed'))
  } finally {
    isUpgrading.value = false
  }
}

// ===== 升级日志加载 =====
const getLogList = async () => {
  if (isLogLoadingData.value) return

  isLogLoadingData.value = true

  try {
    const res = await api.box.getVipCardLog(logParams.value)

    if (res?.list) {
      if (logParams.value.page === 1) {
        logList.value = res.list
      } else {
        logList.value = [...logList.value, ...res.list]
      }

      logTotal.value = res.total || 0
      logParams.value.page++

      if (logList.value.length >= logTotal.value) {
        logFinished.value = true
      }
    } else {
      logFinished.value = true
    }
  } catch (error) {
    console.error('获取升级日志失败:', error)
    logFinished.value = true
  } finally {
    logLoading.value = false
    logRefreshing.value = false
    isLogLoadingData.value = false
  }
}

// van-list 触发的加载
const onLogLoad = () => {
  if (logRefreshing.value) return
  getLogList()
}

// 下拉刷新
const onLogRefresh = () => {
  logList.value = []
  logFinished.value = false
  logParams.value.page = 1
  logLoading.value = false
  logRefreshing.value = true
  getLogList()
}

// 手动刷新
const refreshLogRecords = () => {
  logList.value = []
  logFinished.value = false
  logParams.value.page = 1
  logLoading.value = false
  logRefreshing.value = false
  getLogList()
}

// ===== 格式化时间 =====
const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  return timeStr
}

// ===== 页面初始化 =====
onMounted(async () => {
  try {
    isPageLoading.value = true
    await getVipCardInfo()
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
        <van-loading type="spinner" size="40" color="#FFB800" />
        <p class="loading-text">{{ t('box.loading') }}</p>
      </div>
    </div>

    <div class="body" :class="{ 'is-loading': isPageLoading }">
      <!-- 页面标题 -->
      <div class="page-header flex items-center justify-between">
        <div class="flex gap-12 items-center">
          <div class="title-badge"></div>
          <span class="page-title">{{ t('vipCard.title') }}</span>
        </div>
      </div>

      <!-- VIP卡片展示区 -->
      <div class="vip-card-showcase">
        <!-- 主卡片 -->
        <div class="vip-main-card">
          <!-- 卡片光效 -->
          <div class="card-shine"></div>
          <div class="card-glow"></div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 顶部：VIP标识和等级 -->
            <div class="card-header">
              <div class="vip-badge">
                <svg class="crown-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"
                    fill="currentColor" />
                </svg>
                <span>VIP</span>
              </div>
              <div class="level-display">
                <span class="level-label">{{ t('vipCard.currentLevel') }}</span>
                <span class="level-value">{{ currentLevel }}</span>
              </div>
            </div>

            <!-- 中间：卡片数量统计 -->
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-value available">{{ availableCards }}</span>
                <span class="stat-label">{{ t('vipCard.availableCards') }}</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value used">{{ usedCards }}</span>
                <span class="stat-label">{{ t('vipCard.usedCards') }}</span>
              </div>
            </div>

            <!-- 底部：装饰纹路 -->
            <div class="card-pattern">
              <div class="pattern-line" v-for="i in 5" :key="i"></div>
            </div>
          </div>
        </div>

        <!-- 升级信息卡片 -->
        <div class="upgrade-info-card">
          <div class="upgrade-header">
            <span class="upgrade-title">{{ t('vipCard.upgradeToNext') }}</span>
            <div class="next-level-badge">
              <svg class="star-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor" />
              </svg>
              <span>{{ nextLevel }}</span>
            </div>
          </div>

          <!-- 升级所需卡片信息 -->
          <div class="upgrade-need-info">
            <div class="need-label">{{ t('vipCard.needCardsToUpgrade') }}</div>
            <div class="need-value-row">
              <span class="need-value">{{ needCards }}</span>
              <span class="need-unit">{{ t('vipCard.cardsUnit') }}</span>
            </div>
            <div class="need-tip" v-if="!canUpgrade && needCards > 0">
              <svg class="tip-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                  fill="currentColor" />
              </svg>
              <span>{{ t('vipCard.stillNeedCards', { count: needCards - availableCards }) }}</span>
            </div>
          </div>

          <!-- 升级按钮 -->
          <button class="upgrade-btn" :class="{ 'disabled': !canUpgrade, 'is-upgrading': isUpgrading }"
            :disabled="!canUpgrade || isUpgrading" @click="handleUpgrade">
            <span v-if="isUpgrading" class="btn-loading">
              <van-loading type="spinner" size="20" color="#fff" />
              {{ t('vipCard.upgrading') }}
            </span>
            <span v-else class="btn-text">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
              </svg>
              {{ canUpgrade ? t('vipCard.upgradeNow') : t('vipCard.cannotUpgradeYet') }}
            </span>
          </button>

          <!-- 转账按钮 -->
          <button class="transfer-btn" @click="$router.push('/vip-card-transfer')">
            <span class="btn-text">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z"
                  fill="currentColor" />
              </svg>
              {{ t('vipCard.transferCard') }}
            </span>
          </button>
        </div>
      </div>

      <!-- VIP卡记录区域 -->
      <div class="log-section">
        <div class="section-header">
          <div class="section-title">
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13 3C8.03 3 4 7.03 4 12H1L4.89 15.89L4.96 16.03L9 12H6C6 8.13 9.13 5 13 5C16.87 5 20 8.13 20 12C20 15.87 16.87 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C8.27 19.99 10.51 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3ZM12 8V13L16.28 15.54L17 14.33L13.5 12.25V8H12Z"
                fill="currentColor" />
            </svg>
            <span>{{ t('vipCard.cardRecords') }}</span>
          </div>
          <span class="log-count">{{ t('box.totalRecords', { count: logTotal }) }}</span>
        </div>

        <van-pull-refresh v-model="logRefreshing" @refresh="onLogRefresh" class="w-100%">
          <van-list v-model:loading="logLoading" :finished="logFinished"
            :finished-text="logList.length > 0 ? t('common.noMore') : ''" @load="onLogLoad" class="log-list">
            <!-- 空状态 -->
            <div v-if="logList.length === 0 && !logLoading" class="empty-state">
              <van-empty :description="t('vipCard.noLog')" />
            </div>

            <!-- 日志列表项 -->
            <div v-for="(item, index) in logList" :key="index" class="log-item" :class="getLogDisplayInfo(item).type">
              <div class="log-left">
                <div class="log-icon" :class="getLogDisplayInfo(item).type">
                  <!-- 抽奖获得图标 - 礼物 -->
                  <svg v-if="getLogDisplayInfo(item).icon === 'gift'" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.35C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V17H20V19ZM20 14H4V8H9.08L7 10.83L8.62 12L12 7.4L15.38 12L17 10.83L14.92 8H20V14Z"
                      fill="currentColor" />
                  </svg>

                  <!-- 升级使用图标 - 箭头 -->
                  <svg v-else-if="getLogDisplayInfo(item).icon === 'arrow'" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
                  </svg>

                  <!-- 转出图标 -->
                  <svg v-else-if="getLogDisplayInfo(item).icon === 'transfer-out'" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L5 6.99H8V14H10V6.99H13L9 3ZM16 17.01V10H14V17.01H11L15 21L19 17.01H16Z"
                      fill="currentColor" />
                  </svg>

                  <!-- 转入图标 -->
                  <svg v-else-if="getLogDisplayInfo(item).icon === 'transfer-in'" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3L19 6.99H16V14H14V6.99H11L15 3ZM8 17.01V10H10V17.01H13L9 21L5 17.01H8Z"
                      fill="currentColor" />
                  </svg>

                  <!-- 默认图标 -->
                  <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
                  </svg>
                </div>
                <div class="log-info">
                  <span class="log-title">{{ getLogDisplayInfo(item).title }}</span>
                  <span class="log-time">{{ formatTime(item.created_at) }}</span>
                </div>
              </div>
              <div class="log-right">
                <!-- 显示数量 -->
                <div v-if="getLogDisplayInfo(item).showBadge" class="log-badge" :class="getLogDisplayInfo(item).type">
                  <span class="badge-text">{{ getLogDisplayInfo(item).detail }}</span>
                  <span v-if="getLogDisplayInfo(item).subtitle" class="badge-subtitle"></span>
                </div>
                <!-- 显示升级信息 -->
                <span v-else class="log-detail" :style="{ color: getLogDisplayInfo(item).detailColor }">
                  {{ getLogDisplayInfo(item).detail }}
                </span>
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>
    <!-- 升级确认弹窗 -->
    <van-popup v-model:show="showUpgradeConfirm" :style="{ background: 'transparent' }"
      :overlay-style="{ background: 'rgba(0, 0, 0, 0.85)' }" class="confirm-popup-wrapper">
      <div class="confirm-popup">
        <!-- 光效背景 -->
        <div class="confirm-glow"></div>

        <!-- 图标 -->
        <!-- <div class="confirm-icon-wrapper">
          <svg class="confirm-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"
              fill="currentColor" />
          </svg>
        </div> -->

        <!-- 标题 -->
        <div class="confirm-title">{{ t('vipCard.upgradeConfirmTitle') }}</div>

        <!-- 内容 -->
        <div class="confirm-content">
          <div class="confirm-row">
            <span class="confirm-label">{{ t('vipCard.consumeCards') }}</span>
            <span class="confirm-value consume">-{{ needCards }} {{ t('vipCard.cardsUnit') }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">{{ t('vipCard.upgradeTarget') }}</span>
            <span class="confirm-value level">{{ currentLevel }} → {{ nextLevel }}</span>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="confirm-buttons">
          <button class="cancel-btn" @click="cancelUpgrade">
            {{ t('common.cancel') }}
          </button>
          <button class="confirm-btn" @click="confirmUpgrade">
            {{ t('vipCard.confirmUpgrade') }}
          </button>
        </div>
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
    background: linear-gradient(180deg, #FFB800 0%, #FF6B00 100%);
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
    letter-spacing: 1px;
  }
}

// VIP卡片展示区
.vip-card-showcase {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// VIP主卡片
.vip-main-card {
  position: relative;
  width: 100%;
  min-height: 220px;
  border-radius: 24px;
  background: linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(255, 184, 0, 0.2);

  // 卡片光效
  .card-shine {
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    background: linear-gradient(45deg,
        transparent 40%,
        rgba(255, 184, 0, 0.1) 45%,
        rgba(255, 184, 0, 0.2) 50%,
        rgba(255, 184, 0, 0.1) 55%,
        transparent 60%);
    animation: shine 4s linear infinite;
    pointer-events: none;
  }

  .card-glow {
    position: absolute;
    top: -50%;
    right: -30%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 184, 0, 0.15) 0%, transparent 60%);
    filter: blur(40px);
    pointer-events: none;
  }

  .card-content {
    position: relative;
    z-index: 1;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  // 卡片顶部
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .vip-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 30px;
      background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
      box-shadow: 0 4px 15px rgba(255, 184, 0, 0.4);

      .crown-icon {
        width: 24px;
        height: 24px;
        color: #fff;
      }

      span {
        font-size: 28px;
        font-weight: 800;
        color: #fff;
        font-family: 'Roboto', sans-serif;
        letter-spacing: 2px;
      }
    }

    .level-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;

      .level-label {
        font-size: 20px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'PingFang SC', sans-serif;
      }

      .level-value {
        font-size: 32px;
        font-weight: 700;
        color: #FFB800;
        font-family: 'Roboto', sans-serif;
        text-shadow: 0 0 20px rgba(255, 184, 0, 0.5);
      }
    }
  }

  // 卡片统计
  .card-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .stat-value {
        font-size: 48px;
        font-weight: 700;
        font-family: 'Roboto', sans-serif;
        line-height: 1;

        &.available {
          color: #16FFC2;
          text-shadow: 0 0 20px rgba(22, 255, 194, 0.5);
        }

        &.used {
          color: rgba(255, 255, 255, 0.4);
        }
      }

      .stat-label {
        font-size: 22px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .stat-divider {
      width: 1px;
      height: 60px;
      background: linear-gradient(180deg, transparent 0%, rgba(255, 184, 0, 0.3) 50%, transparent 100%);
    }
  }

  // 卡片装饰纹路
  .card-pattern {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    display: flex;
    gap: 10px;
    opacity: 0.3;
    overflow: hidden;

    .pattern-line {
      flex: 1;
      height: 100%;
      background: linear-gradient(180deg, transparent 0%, rgba(255, 184, 0, 0.3) 100%);
      transform: skewX(-20deg);
    }
  }
}

@keyframes shine {
  0% {
    transform: translateX(-50%) translateY(-50%) rotate(45deg);
  }

  100% {
    transform: translateX(50%) translateY(50%) rotate(45deg);
  }
}

// 升级信息卡片
.upgrade-info-card {
  position: relative;
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 184, 0, 0.15);

  .upgrade-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .upgrade-title {
      font-size: 26px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      font-family: 'PingFang SC', sans-serif;
    }

    .next-level-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 107, 0, 0.2));
      border: 1px solid rgba(255, 184, 0, 0.3);

      .star-icon {
        width: 18px;
        height: 18px;
        color: #FFB800;
      }

      span {
        font-size: 24px;
        font-weight: 600;
        color: #FFB800;
        font-family: 'Roboto', sans-serif;
      }
    }
  }

  // 升级所需卡片信息
  .upgrade-need-info {
    margin-bottom: 24px;
    padding: 20px;
    border-radius: 16px;
    background: rgba(255, 184, 0, 0.08);
    border: 1px solid rgba(255, 184, 0, 0.15);
    text-align: center;

    .need-label {
      font-size: 22px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.6);
      font-family: 'PingFang SC', sans-serif;
      margin-bottom: 12px;
    }

    .need-value-row {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;

      .need-value {
        font-size: 52px;
        font-weight: 700;
        color: #FFB800;
        font-family: 'Roboto', sans-serif;
        line-height: 1;
        text-shadow: 0 0 20px rgba(255, 184, 0, 0.4);
      }

      .need-unit {
        font-size: 24px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .need-tip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .tip-icon {
        width: 18px;
        height: 18px;
        color: #FF6B6B;
      }

      span {
        font-size: 22px;
        font-weight: 400;
        color: #FF6B6B;
        font-family: 'PingFang SC', sans-serif;
      }
    }
  }

  // 升级按钮
  .upgrade-btn {
    width: 100%;
    height: 80px;
    border: none;
    border-radius: 40px;
    background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
    box-shadow: 0 6px 24px rgba(255, 184, 0, 0.4);
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
      animation: btn-shine 3s infinite;
    }

    .btn-text,
    .btn-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 30px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
      position: relative;
      z-index: 1;
    }

    .btn-icon {
      width: 26px;
      height: 26px;
      color: #fff;
    }

    &:active:not(.disabled) {
      transform: scale(0.98);
      box-shadow: 0 4px 16px rgba(255, 184, 0, 0.3);
    }

    &.disabled {
      background: linear-gradient(135deg, #555 0%, #333 100%);
      box-shadow: none;
      cursor: not-allowed;

      &::before {
        animation: none;
      }

      .btn-text {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    &.is-upgrading {
      pointer-events: none;
    }
  }

  // 转账按钮
  .transfer-btn {
    width: 100%;
    height: 80px;
    margin-top: 20px;
    border: 2px solid #3FFF6C;
    border-radius: 40px;
    background: transparent;
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
      top: 0;
      left: 0;
      width: 0;
      height: 100%;
      background: linear-gradient(135deg, #3FFF6C 0%, #00FF6E 100%);
      transition: width 0.3s ease;
      z-index: 0;
    }

    .btn-text {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 28px;
      font-weight: 600;
      color: #3FFF6C;
      font-family: 'PingFang SC', sans-serif;
      position: relative;
      z-index: 1;
      transition: color 0.3s ease;
    }

    .btn-icon {
      width: 24px;
      height: 24px;
      color: #3FFF6C;
      transition: color 0.3s ease;
    }

    &:hover {
      &::before {
        width: 100%;
      }

      .btn-text,
      .btn-icon {
        color: #000;
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@keyframes progress-glow {

  0%,
  100% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }
}

@keyframes btn-shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

// 升级日志区域
.log-section {
  position: relative;
  width: 100%;
  padding: 24px;
  border-radius: 24px;
  background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 45%, #f658ff 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;

      .title-icon {
        width: 24px;
        height: 24px;
        color: #FFB800;
      }

      span {
        font-size: 28px;
        font-weight: 600;
        color: #fff;
        font-family: 'PingFang SC', sans-serif;
      }
    }

    .log-count {
      font-size: 22px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'PingFang SC', sans-serif;
    }
  }

  .log-list {
    min-height: 150px;

    :deep(.van-list__finished-text) {
      color: rgba(255, 255, 255, 0.4);
      font-size: 22px;
      padding: 20px 0;
    }

    :deep(.van-list__loading) {
      padding: 20px 0;

      .van-loading__spinner {
        color: #FFB800;
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

  .log-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    &:last-child {
      border-bottom: none;
    }

    .log-left {
      display: flex;
      align-items: center;
      gap: 14px;

      .log-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 107, 0, 0.2));
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
          width: 24px;
          height: 24px;
          color: #FFB800;
        }

        // 抽奖获得类型 - 绿色
        &.get {
          background: linear-gradient(135deg, rgba(22, 255, 194, 0.2), rgba(0, 184, 255, 0.2));

          svg {
            color: #16FFC2;
          }
        }

        // 升级使用类型 - 金色
        &.use {
          background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 107, 0, 0.2));

          svg {
            color: #FFB800;
          }
        }

        // 转出类型 - 红色
        &.transfer-out {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 63, 63, 0.2));

          svg {
            color: #FF6B6B;
          }
        }

        // 转入类型 - 绿色
        &.transfer-in {
          background: linear-gradient(135deg, rgba(22, 255, 194, 0.2), rgba(63, 255, 108, 0.2));

          svg {
            color: #16FFC2;
          }
        }
      }

      .log-info {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .log-title {
          font-size: 26px;
          font-weight: 500;
          color: #fff;
          font-family: 'PingFang SC', sans-serif;
        }

        .log-time {
          font-size: 20px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Roboto', sans-serif;
        }
      }
    }

    .log-right {
      display: flex;
      align-items: center;

      .log-detail {
        font-size: 24px;
        font-weight: 600;
        font-family: 'Roboto', sans-serif;
      }

      .log-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 12px;
        transition: all 0.3s ease;

        .badge-text {
          font-size: 24px;
          font-weight: 700;
          font-family: 'Roboto', sans-serif;
        }

        .badge-subtitle {
          font-size: 18px;
          font-weight: 400;
          font-family: 'PingFang SC', sans-serif;
          opacity: 0.8;
        }

        // 获得类型徽章 - 绿色
        &.get {
          background: rgba(22, 255, 194, 0.15);
          border: 1px solid rgba(22, 255, 194, 0.3);

          .badge-text,
          .badge-subtitle {
            color: #16FFC2;
          }
        }

        // 转入类型徽章 - 绿色
        &.transfer-in {
          background: rgba(22, 255, 194, 0.15);
          border: 1px solid rgba(22, 255, 194, 0.3);

          .badge-text,
          .badge-subtitle {
            color: #16FFC2;
          }
        }

        // 转出类型徽章 - 红色
        &.transfer-out {
          background: rgba(255, 107, 107, 0.15);
          border: 1px solid rgba(255, 107, 107, 0.3);

          .badge-text,
          .badge-subtitle {
            color: #FF6B6B;
          }
        }

        // 升级类型徽章 - 金色
        &.use {
          background: rgba(255, 184, 0, 0.15);
          border: 1px solid rgba(255, 184, 0, 0.3);

          .badge-text,
          .badge-subtitle {
            color: #FFB800;
          }
        }
      }
    }
  }
}

// 确认弹窗
.confirm-popup-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-popup {
  position: relative;
  width: 560px;
  padding: 40px 32px 32px;
  border-radius: 28px;
  background: linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F0518 100%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 28px;
    padding: 2px;
    background: linear-gradient(135deg, #FFB800 0%, #FF6B00 50%, #FFB800 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .confirm-glow {
    position: absolute;
    top: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 184, 0, 0.25) 0%, transparent 60%);
    filter: blur(40px);
    pointer-events: none;
  }

  .confirm-icon-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;

    .confirm-icon {
      width: 64px;
      height: 64px;
      color: #FFB800;
      filter: drop-shadow(0 0 20px rgba(255, 184, 0, 0.5));
    }
  }

  .confirm-title {
    text-align: center;
    font-size: 34px;
    font-weight: 700;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
    margin-bottom: 28px;
    position: relative;
    z-index: 1;
  }

  .confirm-content {
    padding: 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 28px;
    position: relative;
    z-index: 1;

    .confirm-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;

      &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .confirm-label {
        font-size: 24px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'PingFang SC', sans-serif;
      }

      .confirm-value {
        font-size: 26px;
        font-weight: 600;
        font-family: 'Roboto', sans-serif;

        &.consume {
          color: #FF6B6B;
        }

        &.level {
          color: #FFB800;
        }
      }
    }
  }

  .confirm-buttons {
    display: flex;
    gap: 16px;
    position: relative;
    z-index: 1;

    .cancel-btn {
      flex: 1;
      height: 72px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 36px;
      background: transparent;
      font-size: 28px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      font-family: 'PingFang SC', sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;

      &:active {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .confirm-btn {
      flex: 1;
      height: 72px;
      border: none;
      border-radius: 36px;
      background: linear-gradient(135deg, #FFB800 0%, #FF6B00 100%);
      box-shadow: 0 4px 16px rgba(255, 184, 0, 0.4);
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
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
</style>
