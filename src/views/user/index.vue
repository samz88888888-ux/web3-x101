<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showNotify, showToast } from 'vant'
import { useIndexStore } from '@/store'
import { formatNumber } from '@/utils/format'
import userBg from '@/assets/imgs/user/user-bg.png'
import topTipSvg from '@/assets/imgs/user/top-tip.svg'
import tip1 from '@/assets/imgs/user/tip1.svg'
import tip2 from '@/assets/imgs/user/tip2.svg'
import tip3 from '@/assets/imgs/user/tip3.svg'
import copySvg from '@/assets/svg/copy.svg'
import chartSvg from '@/assets/imgs/user/chart.svg'
import Footer from '@/components/footer.vue'

const { t } = useI18n()
const store = useIndexStore()

// 从 store 获取用户信息
const userInfo = computed(() => store.userInfo)

// 邀请链接
const inviteLink = computed(() => {
  if (!userInfo.value?.code) return ''
  const urlObj = new URL(window.location.href)
  return `${urlObj.origin}/#/index?code=${userInfo.value.code}`
})

// 格式化钱包地址
const formatAddress = (addr) => {
  if (!addr) return '--'
  return `${addr.slice(0, 4)}****${addr.slice(-4)}`
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 是否显示等级
const showLevel = computed(() => {
  return userInfo.value?.level_id > 1
})

// 是否显示节点
const showNode = computed(() => {
  return userInfo.value?.node_id > 0
})

// 直推列表
const teamList = ref([])

// 初始化
const init = async () => {
  try {
    // 获取用户信息到 store
    await store.fetchUserInfo()
    console.log('用户信息:', userInfo.value)

    // 获取团队列表
    const res = await api.home.teamList()
    teamList.value = res || []
    console.log('团队列表:', teamList.value)
  } catch (error) {
    console.error('初始化失败:', error)
    showToast('获取数据失败')
  }
}

onMounted(() => {
  init()
})

// 复制邀请链接
const copyInviteLink = async () => {
  const text = inviteLink.value
  if (!text) {
    showToast(t('user.copyInviteLinkFailed'))
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    showToast({ type: 'success', message: t('user.copySuccess') })
  } catch (err) {
    // 备用复制方法
    fallbackCopyText(text)
  }
}

// 备用复制方法
const fallbackCopyText = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)

    if (success) {
      showNotify({ type: 'success', message: t('user.copySuccess') })
    } else {
      showToast(t('user.copyFailed'))
    }
  } catch (err) {
    document.body.removeChild(textarea)
    showToast(t('user.copyFailed'))
  }
}
</script>
<template>
  <div class="container">
    <div class="body w-100% flex flex-col items-start justify-center">
      <!-- 标题 -->
      <div class="flex items-center justify-center">
        <div class="flex items-center justify-center wh-36">
          <van-image width="100%" height="100%" :src="topTipSvg" fit="contain"></van-image>
        </div>
        <span class="ml-12 fsize-32 font-roboto font-700 text-[#fff] leading-none">{{
          t('user.teamInvite')
          }}</span>
        <span class="tip-color ml-18 fsize-24 font-roboto font-300 leading-none">/{{ t('user.inviteFriend') }}</span>
      </div>

      <!-- 邀请链接卡片 -->
      <div class="invite-card mt-30 flex flex-col items-start justify-center pt-40 pb-40 px-30 rounded-30">
        <!-- 邀请码部分 -->
        <div class="w-100% flex flex-col items-center justify-center mb-30">
          <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60 mb-14">{{
            t('user.myInviteCode')
            }}</span>
          <span class="fsize-40 font-roboto font-700 text-[#fff] letter-spacing-2">{{
            userInfo?.code || '--'
            }}</span>
        </div>

        <!-- 分隔线 -->
        <div class="w-100% h-1 bg-[#fff] opacity-10 mb-30"></div>

        <!-- 邀请链接部分 -->
        <div class="w-100% flex flex-col items-start justify-center">
          <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60 mb-14">{{
            t('user.inviteLink')
            }}</span>
          <div class="invite-link-box w-100% p-20 rounded-16 mb-20">
            <span class="fsize-24 font-roboto font-400 text-[#fff] break-all leading-relaxed">{{
              inviteLink || '--'
              }}</span>
          </div>

          <!-- 复制按钮 -->
          <div class="w-100% flex items-center justify-center">
            <div class="copy-button flex items-center justify-center gap-10 py-16 px-40 rounded-50 cursor-pointer"
              @click="copyInviteLink">
              <van-image width="20" height="20" :src="copySvg" fit="contain"></van-image>
              <span class="fsize-28 font-roboto font-600 text-[#fff]">{{
                t('user.copyLink')
                }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户基本信息 -->
      <div class="user-info mt-30 flex flex-col pt-35 px-35 pb-35 items-start justify-center w-100% gap-35">
        <!-- 等级信息 (level_id > 1 才显示) -->
        <div class="info-item w-100% flex gap-24 items-center justify-start">
          <div class="info-icon w-70 h-70 p-12 rounded-14 flex items-center justify-center">
            <van-image width="100%" height="100%" :src="tip1" fit="contain"></van-image>
          </div>
          <div class="flex flex-col items-start justify-center gap-6">
            <span class="fsize-32 font-miSans font-600 text-[#fff]">{{
              userInfo?.level_name || 'V0'
              }}</span>
            <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60">{{
              t('user.myLevel')
              }}</span>
          </div>
        </div>

        <!-- 节点信息 (node_id > 0 才显示) -->
        <div v-if="showNode" class="info-item w-100% flex gap-24 items-center justify-start">
          <div class="info-icon w-70 h-70 p-12 rounded-14 flex items-center justify-center">
            <van-image width="100%" height="100%" :src="tip1" fit="contain"></van-image>
          </div>
          <div class="flex flex-col items-start justify-center gap-6">
            <span class="fsize-32 font-miSans font-600 text-[#fff]">{{
              userInfo?.node_name || '--'
              }}</span>
            <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60">{{
              t('user.nodeIdentity')
              }}</span>
          </div>
        </div>

        <!-- 直推人数 -->
        <div class="info-item w-100% flex gap-24 items-center justify-start">
          <div class="info-icon w-70 h-70 p-12 rounded-14 flex items-center justify-center">
            <van-image width="100%" height="100%" :src="tip2" fit="contain"></van-image>
          </div>
          <div class="flex flex-col items-start justify-center gap-6">
            <span class="fsize-32 font-miSans font-600 text-[#fff]">{{
              userInfo?.zhi_num || 0
              }}</span>
            <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60">{{
              t('user.directNum')
              }}</span>
          </div>
        </div>

        <!-- 团队人数 -->
        <div class="info-item w-100% flex gap-24 items-center justify-start">
          <div class="info-icon w-70 h-70 p-12 rounded-14 flex items-center justify-center">
            <van-image width="100%" height="100%" :src="tip3" fit="contain"></van-image>
          </div>
          <div class="flex flex-col items-start justify-center gap-6">
            <span class="fsize-32 font-miSans font-600 text-[#fff]">{{
              userInfo?.team_num || 0
              }}</span>
            <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-60">{{
              t('user.teamNum')
              }}</span>
          </div>
        </div>
      </div>

      <!-- 团队数据 -->
      <div class="team-data-section mt-30">
        <!-- 标题 -->
        <div class="section-title flex items-center justify-start gap-10 mb-25">
          <van-image width="18" height="18" :src="chartSvg" fit="contain"></van-image>
          <span class="fsize-32 font-roboto font-700 text-[#fff]">{{ t('user.teamData') }}</span>
        </div>

        <!-- 业绩数据卡片组 -->
        <div class="data-cards-wrapper mb-20">
          <div class="category-label">
            <span class="fsize-24 font-pingfang font-600 text-[#fff] opacity-70">{{
              t('user.performanceStatistics')
              }}</span>
          </div>
          <div class="data-cards-grid">
            <!-- 个人业绩 -->
            <div class="data-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.personalPerformance') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.performance_list?.me_performance || 0, 2)
                }}</span>
            </div>

            <!-- 团队业绩 -->
            <div class="data-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
                    fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.teamPerformance') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.performance_list?.team_performance || 0, 2)
                }}</span>
            </div>

            <!-- 累计业绩 -->
            <!-- <div class="data-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"
                    fill="currentColor"
                    opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">累计业绩</span>
              <span class="card-value">{{
                formatNumber(userInfo?.performance_list?.total_performance || 0, 2)
              }}</span>
            </div> -->

            <!-- 大区业绩 -->
            <div class="data-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z"
                    fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.maxPerformance') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.performance_list?.max_performance || 0, 2)
                }}</span>
            </div>

            <!-- 小区业绩 -->
            <div class="data-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z"
                    fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.minPerformance') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.performance_list?.min_performance || 0, 2)
                }}</span>
            </div>
          </div>
        </div>

        <!-- 算力数据卡片组 -->
        <div class="data-cards-wrapper">
          <div class="category-label">
            <span class="fsize-24 font-pingfang font-600 text-[#fff] opacity-70">{{
              t('user.powerStatistics')
              }}</span>
          </div>
          <div class="data-cards-grid">
            <!-- 个人算力 -->
            <div class="data-card power-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 2V13H10V22L17 10H13L17 2H7Z" fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.personalPower') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.power_list?.user_power || 0, 2)
                }}</span>
            </div>

            <!-- 团队算力 -->
            <div class="data-card power-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H11V21ZM13 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3H13V21ZM14 9H16V11H18V13H16V15H14V13H12V11H14V9Z"
                    fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.teamPower') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.power_list?.team_power || 0, 2)
                }}</span>
            </div>

            <!-- 大区算力 -->
            <div class="data-card power-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 3H3C2 3 1 4 1 5V19C1 20.1 1.9 21 3 21H21C22 21 23 20 23 19V5C23 4 22 3 21 3ZM21 19H3V5H21V19ZM5 15H8V17H5V15ZM5 11H8V13H5V11ZM5 7H8V9H5V7ZM10 15H19V17H10V15ZM10 11H19V13H10V11ZM10 7H19V9H10V7Z"
                    fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.maxPower') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.power_list?.max_power || 0, 2)
                }}</span>
            </div>

            <!-- 小区算力 -->
            <div class="data-card power-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 3H3C2 3 1 4 1 5V19C1 20.1 1.9 21 3 21H21C22 21 23 20 23 19V5C23 4 22 3 21 3ZM21 19H3V5H21V19Z"
                    fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <span class="card-label">{{ t('user.minPower') }}</span>
              <span class="card-value">{{
                formatNumber(userInfo?.power_list?.min_power || 0, 2)
                }}</span>
            </div>

            <!-- 累计算力 -->
            <!-- <div class="data-card power-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7V17H6V22H18V17H22V7L12 2ZM10 20H8V17H10V20ZM14 20H12V17H14V20ZM16 20H18V17H16V20ZM20 15H4V8.47L12 4.34L20 8.47V15Z"
                    fill="currentColor"
                    opacity="0.8" />
                </svg>
              </div>
              <span class="card-label">累计算力</span>
              <span class="card-value">{{
                formatNumber(userInfo?.power_list?.total_power || 0, 2)
              }}</span>
            </div> -->
          </div>
        </div>
      </div>

      <!-- 直推列表标题 -->
      <div class="flex pt-45 gap-12 items-center justify-center">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{ t('user.directList') }} ({{
          teamList.length }})</span>
      </div>
      <div class="mt-24 w-100% h-2 bg-[#fff] opacity-10"></div>

      <!-- 直推列表表格 -->
      <div v-if="teamList.length > 0" class="table-container mt-20 w-100%">
        <!-- 表头 -->
        <div class="table-header">
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal opacity-60">{{
            t('user.address')
            }}</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal opacity-60">{{ t('user.performance')
            }} (U)</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal opacity-60">{{ t('user.power') }}
            (T)</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal opacity-60">{{
            t('user.registerTime')
            }}</span>
        </div>

        <!-- 数据行 -->
        <div v-for="(item, index) in teamList" :key="index" class="table-row">
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal">{{
            formatAddress(item.address)
            }}</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal">{{
            formatNumber(item.total_performance || 0, 3)
            }}</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal">{{
            formatNumber(item.total_power || 0, 3)
            }}</span>
          <span class="fsize-21 font-pingfang font-600 text-[#fff] leading-normal">{{
            item.created_at
            }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state mt-50">
        <span class="fsize-24 font-pingfang font-400 text-[#fff] opacity-40">{{
          t('user.noDirectMember')
          }}</span>
      </div>
    </div>
  </div>
  <Footer :theme="theme" />
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: url('@/assets/imgs/user/user-bg.png') no-repeat top center;
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
}

.body {
  width: 100%;
  padding: 34px 30px 245px;
  position: relative;
}

/* 团队数据区域 */
.team-data-section {
  width: 100%;
}

.section-title {
  padding: 0 20px;
  margin-bottom: 25px;
}

/* 分类标签 */
.category-label {
  padding: 0 20px 15px;
}

/* 数据卡片容器 */
.data-cards-wrapper {
  width: 100%;
  margin-bottom: 20px;
}

/* 数据卡片网格 */
.data-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 0 20px;
}

/* 单个数据卡片 */
.data-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0, 255, 110, 0.12) 0%, rgba(0, 149, 67, 0.08) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 120px;
  transition: all 0.3s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }

  &:active {
    transform: scale(0.98);
    background: linear-gradient(135deg, rgba(0, 255, 110, 0.15) 0%, rgba(0, 149, 67, 0.1) 100%);
  }
}

/* 算力卡片 */
.power-card {
  background: linear-gradient(135deg, rgba(0, 255, 110, 0.12) 0%, rgba(0, 200, 90, 0.08) 100%);

  &:active {
    background: linear-gradient(135deg, rgba(0, 255, 110, 0.15) 0%, rgba(0, 200, 90, 0.1) 100%);
  }
}

/* 卡片图标 */
.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  margin-bottom: 12px;
}

.power-card .card-icon {
  background: rgba(0, 255, 110, 0.15);
}

/* 卡片标签 */
.card-label {
  font-size: 22px;
  font-family:
    PingFang SC,
    sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.2;
  margin-bottom: 8px;
}

/* 卡片数值 */
.card-value {
  font-size: 28px;
  font-family: 'MiSans', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.tip-color {
  color: rgba(255, 255, 255, 0.6);
}

/* 邀请卡片 */
.invite-card {
  position: relative;
  width: 100%;
  border-radius: 30px;
  background: #122626;
  box-shadow: 0 8px 20px 0 rgba(76, 140, 73, 0.1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px;
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
}

/* 邀请链接盒子 */
.invite-link-box {
  background: rgba(0, 255, 110, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 复制按钮 */
.copy-button {
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
  box-shadow: 0 4px 12px 0 rgba(0, 255, 110, 0.3);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2px 8px 0 rgba(0, 255, 110, 0.4);
  }
}

.top-bg {
  position: relative;
  width: 100%;
  background: url('@/assets/imgs/user/top-bg.png') no-repeat top center;
  background-size: 100% auto;
}

.copy-bg {
  width: 70px;
  height: 60px;
  border-radius: 15px;
  background: var(--Style, linear-gradient(180deg, #00ff6e 0%, #009543 100%));
}

/* 信息图标 */
.info-icon {
  background: rgba(0, 255, 110, 0.08);
}

/* 信息项 */
.info-item {
  transition: transform 0.2s ease;
}

/* 数据行 */
.data-row {
  padding: 8px 0;
}

/* 数据分隔线 */
.data-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
}

.tip-bg {
  background: rgba(0, 255, 110, 0.08);
}

.user-info {
  position: relative;
  border-radius: 30px;
  /* 径向渐变背景 */
  background: #122626;
  /* 阴影 */
  box-shadow: 0 8px 20px 0 rgba(76, 140, 73, 0.1);

  /* 使用伪元素实现渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px;
    padding: 2px;
    /* 边框宽度 2px */
    background: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }
}

.gray-color {
  color: rgba(255, 255, 255, 0.7);
}

.data-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
}

.line {
  width: 1px;
  height: 61px;
  opacity: 0.1;
  background: #fff;
}

.box {
  background: var(--Style, linear-gradient(180deg, #00ff6e 0%, #009543 100%));
}

.table-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 3fr;
  /* 根据内容调整列宽 */
  gap: 20px;
  align-items: center;
  width: 100%;

  span {
    text-align: center;
    /* 每列文本居中 */

    &:first-child {
      text-align: left;
      /* 第一列（地址）左对齐 */
    }

    &:last-child {
      text-align: right;
      /* 最后一列（注册时间）右对齐 */
    }
  }
}

.table-row {
  margin-top: 20px;
}

.empty-state {
  width: 100%;
  padding: 60px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
