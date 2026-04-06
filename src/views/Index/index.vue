<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { useIndexStore } from '@/store'
import { handleMenuClick } from '@/utils/format'
import banner1 from '@/assets/imgs/banner/banner-1.png'
import notice from '@/assets/svg/notice.svg'
import menuOne from '@/assets/imgs/home/menu-1.png'
import menuTwo from '@/assets/imgs/home/menu-2.png'
import menuThree from '@/assets/imgs/home/menu-3.png'
import menuFour from '@/assets/imgs/home/menu-4.png'
import menuFive from '@/assets/imgs/home/menu-5.png'
import power1 from '@/assets/imgs/home/power-1.png'
import power2 from '@/assets/imgs/home/power-2.png'
import kline from '@/assets/imgs/home/k-line.png'
import protocol from '@/assets/imgs/home/protocol.png'
import proof1 from '@/assets/imgs/home/proof-1.svg'
import proof2 from '@/assets/imgs/home/proof-2.svg'
import proof3 from '@/assets/imgs/home/proof-3.svg'
import proof4 from '@/assets/imgs/home/proof-4.svg'
import proofBg from '@/assets/imgs/home/proof-banner.png'
import ecologyImg from '@/assets/imgs/home/ecology.png'
import ecologySlide from '@/assets/imgs/home/ecology-slide.png'
import chooseImg from '@/assets/imgs/home/choose.png'
import model1 from '@/assets/imgs/home/model-1.png'
import model2 from '@/assets/imgs/home/model-2.png'
import model3 from '@/assets/imgs/home/model-3.png'
import model4 from '@/assets/imgs/home/model-4.png'
import logo from '@/assets/imgs/logo.png'
import KLineChart from '@/components/home/KLineChart.vue'
import Footer from '@/components/footer.vue'
import { formatNumber } from '@/utils/format'
const router = useRouter()
const store = useIndexStore()
const { t } = useI18n()

// Banner 数据（从 API 获取）
const bannerList = ref([])
const noticeList = ref([])

// 公告弹窗相关
const showNoticePopup = ref(false)
const currentNotice = ref(null)

// LocalStorage 键名
const NOTICE_STORAGE_KEY = 'x101_notice_closed'

// 检查是否需要显示公告弹窗
const checkNoticePopup = () => {
  // 找到ispop为1且有标题的公告(优先取第一条有标题的)
  const popNotice = noticeList.value.find((item) => item.ispop === 1 && item.title)

  // 设置当前公告(用于公告栏显示)
  if (popNotice) {
    currentNotice.value = popNotice
  } else {
    // 如果没有有标题的公告,就取最后一条ispop=1的公告
    const lastPopNotice = noticeList.value.filter((item) => item.ispop === 1).pop()
    if (lastPopNotice) {
      currentNotice.value = lastPopNotice
    }
    return
  }

  // 从localStorage获取关闭记录
  const closedInfo = localStorage.getItem(NOTICE_STORAGE_KEY)

  if (closedInfo) {
    try {
      const { noticeId, closedTime } = JSON.parse(closedInfo)
      const now = Date.now()
      const threeHours = 3 * 60 * 60 * 1000 // 3小时的毫秒数

      // 如果是同一条公告且在3小时内关闭过,不显示
      if (noticeId === popNotice.id && now - closedTime < threeHours) {
        return
      }
    } catch (e) {
      console.error('解析公告关闭记录失败:', e)
    }
  }

  // 显示弹窗
  showNoticePopup.value = true
}

// 关闭公告弹窗
const closeNoticePopup = () => {
  showNoticePopup.value = false

  // 保存关闭记录到localStorage
  if (currentNotice.value) {
    const closedInfo = {
      noticeId: currentNotice.value.id,
      closedTime: Date.now()
    }
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(closedInfo))
  }
}
// 获取banner列表
const getBannerList = async () => {
  try {
    const res = await api.home.bannerList()
    if (res && Array.isArray(res)) {
      // 转换API返回的数据格式为组件需要的格式
      bannerList.value = res.map((item, index) => ({
        id: index + 1,
        image: item.banner,
        link: item.link || ''
      }))
    }
  } catch (error) {
    console.error('获取banner列表失败:', error)
    // 如果API失败,使用默认banner
    bannerList.value = [{ id: 1, image: banner1, link: '' }]
  }
}
const getNoticeList = async () => {
  try {
    const res = await api.home.noticeList()
    if (res && Array.isArray(res)) {
      noticeList.value = res
      // 获取公告后检查是否需要弹窗
      checkNoticePopup()
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
    noticeList.value = []
  }
}

const menuList = ref([
  {
    id: 1,
    image: menuTwo,
    title: t('home.powerPurchase'),
    turn: true,
    link: '/power'
  },
  {
    id: 2,
    image: menuThree,
    title: t('home.liquidityMinting'),
    turn: true,
    link: '/lp-mining'
  },
  // {
  //   id: 3,
  //   image: menuOne,
  //   title: '算力挖矿',
  //   turn: true,
  //   link: '/power-mining',
  //   tip: '算力挖矿敬请期待~'
  // },
  {
    id: 4,
    image: menuFour,
    title: t('home.jointMinting'),
    turn: true,
    link: '/joint-mining'
  },
  {
    id: 5,
    image: menuFive,
    title: t('box.title'),
    turn: true,
    link: '/blind-box'
  }
])
const proofList = ref([
  {
    id: 1,
    image: proof1,
    title: t('home.proof1Title'),
    content: t('home.proof1Content')
  },
  {
    id: 2,
    image: proof2,
    title: t('home.proof2Title'),
    content: t('home.proof2Content')
  },
  {
    id: 3,
    image: proof3,
    title: t('home.proof3Title'),
    content: t('home.proof3Content')
  },
  {
    id: 4,
    image: proof4,
    title: t('home.proof4Title'),
    content: t('home.proof4Content')
  }
])

// 处理菜单点击
const handleMenuItemClick = (item) => {
  handleMenuClick(item, router)
}
const klineList = ref([])
const homeInfo = ref({})

// 获取首页信息
const getHomeInfo = async () => {
  try {
    const res = await api.home.getHomeInfo()
    homeInfo.value = res
  } catch (error) {
    console.error('获取首页信息失败:', error)
  }
}

// 获取K线数据
const getKlineList = async () => {
  try {
    const res = await api.home.getKlineList()
    if (res && Array.isArray(res)) {
      // 处理时间戳格式，转换为简短格式
      klineList.value = res.map((item) => {
        // 将时间戳转换为 MM-DD HH:mm 格式
        const date = new Date(item.timestamp)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const time = `${month}-${day} ${hours}:${minutes}`

        return {
          time: time,
          value: parseFloat(item.now_price)
        }
      })
    }
  } catch (error) { }
}

// 当前价格（格式化显示）
const currentPrice = computed(() => {
  const price = homeInfo.value?.x101_info?.now_price
  if (!price) return '$0.00'

  // 格式化价格，保留2位小数，添加千位分隔符
  return `$${parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
})

// 价格涨跌幅（带符号）
const priceChange = computed(() => {
  const change = homeInfo.value?.x101_info?.price_change_24h
  if (!change) return '+0.00%'

  const changeNum = parseFloat(change)
  const sign = changeNum >= 0 ? '+' : ''
  return `${sign}${changeNum.toFixed(2)}%`
})

// 价格变化方向（用于显示上涨或下跌图标）
const isPriceUp = computed(() => {
  const change = homeInfo.value?.x101_info?.price_change_24h
  return parseFloat(change || 0) >= 0
})

// K线图数据（使用真实数据）
const klineData = computed(() => {
  // 如果有真实数据，使用真实数据
  if (klineList.value && klineList.value.length > 0) {
    return klineList.value
  }

  // 否则返回空数组
  return []
})
// 页面加载时获取配置信息
onMounted(() => {
  getBannerList()
  getNoticeList()
  getKlineList()
  getHomeInfo()
})
</script>
<template>
  <div class="container">
    <div class="body">
      <!-- Banner 轮播模块 -->
      <div class="banner-wrapper">
        <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="#FFF">
          <van-swipe-item v-for="item in bannerList" :key="item.id">
            <div class="banner-item">
              <van-image width="100%" height="100%" :src="item.image" fit="cover" class="rounded-24" />
            </div>
          </van-swipe-item>

          <!-- 自定义指示器 -->
          <template #indicator="{ active, total }">
            <div class="custom-indicator">
              <div v-for="index in total" :key="index" class="indicator-dot" :class="{ active: active === index - 1 }">
              </div>
            </div>
          </template>
        </van-swipe>
      </div>
      <!-- 公告栏 -->
      <div class="pt-26 px-3">
        <div
          class="p-14 flex items-center w-100% rounded-14 bg-[rgba(255,255,255,0.1)] gap-9 overflow-hidden cursor-pointer"
          @click="showNoticePopup = true">
          <van-image width="17" height="17" :src="notice" fit="contain" class="flex-shrink-0"></van-image>
          <div class="notice-scroll-wrapper flex-1 overflow-hidden">
            <div class="notice-scroll-content">
              <span class="fsize-24 text-[#FFF] font-pingfang font-400 opacity-60 whitespace-nowrap">
                {{ currentNotice?.title || t('home.noNotice') }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- 菜单栏 -->
      <div class="pt-40 px-1 flex items-center justify-between">
        <div class="flex flex-col items-center justify-center gap-21" v-for="item in menuList" :key="item.id"
          @click="handleMenuItemClick(item)">
          <van-image width="45" height="45" :src="item.image" fit="contain"></van-image>
          <span class="fsize-24 text-[#fff] font-pingfang font-400 leading-relaxed">{{
            item.title
          }}</span>
        </div>
      </div>
      <!-- 算力 -->
      <div class="pt-47 flex items-center justify-between gap-20">
        <div class="power-bg power-bg-1 px-29 pt-37 pb-33 flex flex-col gap-11 justify-start rounded-24">
          <span class="fsize-22 text-[#fff] font-pingfang font-500">{{ t('home.myPower') }}</span>
          <div class="flex gap-7 items-baseline justify-start">
            <span class="fsize-31 text-[#3FFF6C] font-pingfang font-600">{{
              formatNumber(store.userInfo?.power_list?.user_power || 0, 3)
            }}</span>
            <span class="fsize-20 text-[#3FFF6C] font-pingfang font-600">TOPS</span>
          </div>
        </div>
        <div class="power-bg power-bg-2 px-29 pt-37 pb-33 flex flex-col gap-11 justify-start rounded-24">
          <span class="fsize-22 text-[#fff] font-pingfang font-500">{{ t('home.allPower') }}</span>
          <div class="flex gap-7 items-baseline justify-start">
            <span class="fsize-31 text-[#3FFF6C] font-pingfang font-600">{{
              formatNumber(homeInfo?.all_user_power || 0, 3)
            }}</span>
            <span class="fsize-20 text-[#3FFF6C] font-pingfang font-600">TOPS</span>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="stats-container mt-40 w-100%">
        <div class="stats-inner w-100% flex flex-col items-start justify-start pt-30 px-30 pb-30">
          <!-- 标题 -->
          <div class="flex items-center gap-10 mb-30">
            <div class="stats-icon-dot"></div>
            <span class="fsize-28 text-[#3FFF6C] font-pingfang font-600">{{
              t('home.dataStatistics')
            }}</span>
          </div>

          <!-- 数据网格 -->
          <div class="stats-grid w-100%">
            <!-- 流通量 -->
            <div class="stat-item">
              <div class="stat-label">
                <span class="fsize-22 text-[rgba(255,255,255,0.6)] font-pingfang font-400">{{
                  t('home.circulationNum')
                }}</span>
              </div>
              <div class="stat-value">
                <span class="fsize-26 text-[#fff] font-roboto font-600">{{
                  formatNumber(homeInfo?.circulationNum || 0, 2)
                }}</span>
              </div>
            </div>

            <!-- 流通市值 -->
            <div class="stat-item">
              <div class="stat-label">
                <span class="fsize-22 text-[rgba(255,255,255,0.6)] font-pingfang font-400">{{
                  t('home.circulationValue')
                }}</span>
              </div>
              <div class="stat-value">
                <span class="fsize-26 text-[#3FFF6C] font-roboto font-600">{{
                  formatNumber(homeInfo?.circulationValue || 0, 2)
                }}</span>
              </div>
            </div>

            <!-- 销毁量 -->
            <div class="stat-item">
              <div class="stat-label">
                <span class="fsize-22 text-[rgba(255,255,255,0.6)] font-pingfang font-400">{{
                  t('home.destroyNum')
                }}</span>
              </div>
              <div class="stat-value">
                <span class="fsize-26 text-[#fff] font-roboto font-600">{{
                  formatNumber(homeInfo?.destroyNum || 0, 2)
                }}</span>
              </div>
            </div>

            <!-- 销毁价值 -->
            <div class="stat-item">
              <div class="stat-label">
                <span class="fsize-22 text-[rgba(255,255,255,0.6)] font-pingfang font-400">{{
                  t('home.destroyValue')
                }}</span>
              </div>
              <div class="stat-value">
                <span class="fsize-26 text-[#3FFF6C] font-roboto font-600">{{
                  formatNumber(homeInfo?.destroyValue || 0, 2)
                }}</span>
              </div>
            </div>
            <!-- 总发行量 -->
            <div class="stat-item stat-item-full">
              <div class="flex items-center justify-between w-100%">
                <div class="stat-label">
                  <span class="fsize-24 text-[rgba(255,255,255,0.7)] font-pingfang font-500">{{
                    t('home.totalSupply')
                  }}</span>
                </div>
                <div class="stat-value">
                  <span class="fsize-30 text-[#3FFF6C] font-roboto font-700">{{
                    formatNumber(homeInfo?.totalSupply || 0, 2)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KLINE -->
      <div class="kline-container mt-40 w-100%">
        <div class="kline-inner w-100% h-100% flex flex-col items-start justify-start pt-24 px-35 pb-20">
          <div class="flex items-center justify-center">
            <div class="wh-48 flex items-center justify-center gap-8">
              <van-image width="100%" height="100%" :src="logo" fit="contain"></van-image>
            </div>
            <span class="fsize-30 text-[#fff] font-pingfang font-400 leading-relaxed opacity-60">{{
              t('home.x101Price')
            }}</span>
          </div>
          <span class="block pt-13 fsize-53 text-[#fff] font-roboto font-900 leading-none">{{
            currentPrice
          }}</span>
          <div class="kline-percent mt-21 flex items-center justify-center px-18 py-13 gap-7">
            <div class="wh-22 flex items-center justify-center flex-shrink-0">
              <!-- 上涨图标 -->
              <svg v-if="isPriceUp" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 22 22"
                fill="none">
                <path
                  d="M9.10367 3.47119V5.35611H15.3274L3.44678 17.2367L4.76698 18.5556L16.6463 6.67706V12.9001H18.5333V3.47119H9.10367Z"
                  fill="#16FFC2" />
              </svg>
              <!-- 下跌图标 -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 22 22" fill="none">
                <path
                  d="M12.8963 18.5288V16.6439H6.67264L18.5532 4.76334L17.233 3.44434L5.35371 15.3229V9.09991H3.46671V18.5288H12.8963Z"
                  fill="#FF3F85" />
              </svg>
            </div>
            <span class="fsize-22 font-roboto font-600 leading-none"
              :class="isPriceUp ? 'text-[#16FFC2]' : 'text-[#FF3F85]'">{{ priceChange }}</span>
          </div>
          <div class="kline-chart">
            <KLineChart :data="klineData" line-color="#3FFFA5" :line-width="2" gradient-start-color="#03E0F9"
              :gradient-start-opacity="0.55" gradient-end-color="#8DFF58" :gradient-end-opacity="0" :y-axis-ticks="5"
              :show-axis="true" :show-tooltip="true" width="100%" height="100%" />
          </div>
        </div>
      </div>

      <div class="pt-111 px-6">
        <span class="fsize-55 text-[#fff] font-pingfang font-900 leading-normal">{{
          t('home.x101Future')
        }}</span>
      </div>
      <div class="pt-20 flex flex-col items-start justify-center gap-20 relative z-10">
        <div class="protocol-card w-475 h-59 flex items-center justify-center">
          <div class="fsize-32 flex items-center justify-center text-[#3FFF6C] font-pingfang font-600 leading-normal">
            {{ t('home.x101Protocol') }}
          </div>
        </div>
        <span class="fsize-28 text-[#fff] font-pingfang font-400 leading-normal">{{
          t('home.x101ProtocolContent')
        }}</span>
      </div>
      <div class="protocol-img-wrapper flex items-center justify-center h-766 -mt-170 relative z-100">
        <van-image width="100%" height="100%" :src="protocol" fit="cover"></van-image>
      </div>
      <div class="plat-count flex items-center justify-between h-177 px-53 py-35">
        <div class="flex flex-col items-center justify-center gap-13">
          <div class="flex items-center justify-center">
            <span class="fsize-40 text-[#fff] font-roboto font-900 leading-none">{{
              homeInfo?.all_user_count
            }}</span>
            <!-- <span class="fsize-50 text-[#3FFF6C] font-roboto font-900 leading-none">+</span> -->
          </div>
          <span class="fsize-26 text-[#fff] font-pingfang font-400 leading-relaxed opacity-60">{{ t('home.userCount') }}
          </span>
        </div>
        <div class="flex flex-col items-center justify-center gap-13">
          <div class="flex items-center justify-center">
            <span class="fsize-40 text-[#fff] font-roboto font-900 leading-none">{{
              formatNumber(homeInfo?.all_user_power, 3)
            }}</span>
            <!-- <span class="fsize-50 text-[#3FFF6C] font-roboto font-900 leading-none">+</span> -->
          </div>
          <span class="fsize-26 text-[#fff] font-pingfang font-400 leading-relaxed opacity-60">{{
            t('home.totalPower')
          }}</span>
        </div>
        <div class="flex flex-col items-center justify-center gap-13">
          <div class="flex items-center justify-center">
            <span class="fsize-40 text-[#fff] font-roboto font-900 leading-none">{{
              homeInfo?.all_assets
            }}</span>
            <!-- <span class="fsize-50 text-[#3FFF6C] font-roboto font-900 leading-none">+</span> -->
          </div>
          <span class="fsize-26 text-[#fff] font-pingfang font-400 leading-relaxed opacity-60">{{
            t('home.totalAssets')
          }}</span>
        </div>
      </div>
      <!-- 证明 -->
      <div class="proof-card flex flex-col gap-50 items-start justify-center mt-42 px-42 py-39">
        <div class="flex gap-32 items-center justify-start h-82" v-for="item in proofList" :key="item.id">
          <div class="icon-wrapper flex items-center justify-center p-14 w-82 h-100% rounded-18">
            <van-image width="100%" height="100%" :src="item.image" fit="contain"></van-image>
          </div>
          <div class="flex flex-col justify-center items-start">
            <span class="fsize-28 text-[#fff] font-miSans font-520 leading-relaxed">{{
              item.title
            }}</span>
            <span class="fsize-22 text-[#fff] font-miSans font-380 lh-32">{{ item.content }}</span>
          </div>
        </div>
      </div>
      <!-- 实体能量 -->
      <div class="mt-95 fsize-50 text-[#fff] font-robot font-600">
        {{ t('home.entityEnergyProtocol') }}
      </div>
      <div class="mt-18 fsize-50 text-[#fff] font-robot font-300 opacity-60 uppercase">
        Physical energy conservation protocol
      </div>
      <div class="prooft-bg flex items-center justify-center w-100% h-525 -mt-61">
        <van-image width="100%" height="100%" :src="proofBg" fit="contain"></van-image>
      </div>
      <div class="pt-45 flex gap-22 items-center">
        <div class="flex flex-col gap-19 items-start pt-10 wMax-416">
          <span class="fsize-36 text-[#fff] mr-50 font-robot font-400 lh-48">{{
            t('home.entityEnergyProtocolContent')
          }}</span>
          <span class="proof-text fsize-22 font-robot font-500 lh-32">{{
            t('home.entityEnergyProtocolContent2')
          }}</span>
        </div>
        <div class="w-267 h-248 flex items-center justify-center">
          <van-image width="100%" height="100%" :src="ecologyImg" fit="contain"></van-image>
        </div>
      </div>
      <div class="ecology-slide pt-9 flex items-center w-100% h-481 gap-15">
        <div class="flex items-center justify-center w-304 h-100%">
          <van-image width="100%" height="100%" :src="ecologySlide" fit="contain"></van-image>
        </div>
        <div class="flex flex-col items-start justify-center gap-14">
          <span class="fsize-36 text-[#fff] font-robot font-500 lh-48">{{
            t('home.entityEnergyProtocolContent6')
          }}</span>
          <div class="proof-text flex flex-col items-start justify-center fsize-22 font-robot font-500 lh-38">
            <span>{{ t('home.entityEnergyProtocolContent3') }}</span>
            <span>{{ t('home.entityEnergyProtocolContent4') }}</span>
            <span>{{ t('home.entityEnergyProtocolContent5') }}</span>
          </div>
        </div>
      </div>
      <div class="support mt-106 px-70 py-7 wMax-264 text-center">
        <span class="fsize-28 text-[#000] font-miSans font-630 lh-40">{{
          t('home.technicalSupport')
        }}</span>
      </div>
      <span class="block mt-32 fsize-47 font-miSans font-630 text-[#fff] lh-60">{{
        t('home.whyChooseUs')
      }}</span>
      <span class="block mt-22 fsize-34 font-miSans font-330 text-[#fff] lh-42 opacity-50">Why choose US?</span>
      <div class="core-wrapper mt-35">
        <div class="core-inner flex flex-col items-center justify-center pt-18 px-31 pb-36">
          <div class="flex items-center justify-center wh-422">
            <van-image width="100%" height="100%" :src="chooseImg" fit="contain"></van-image>
          </div>
          <div class="flex flex-col items-start justify-center gap-12">
            <span class="fsize-42 font-miSans font-630 text-[#fff] lh-68">{{
              t('home.threeCoreDrivers')
            }}</span>
            <span class="fsize-30 font-miSans font-520 text-[#3FFF6C] lh-44">{{
              t('home.aiPowerXDeflationaryMechanismXFlowFinancial')
            }}</span>
            <span class="fsize-28 font-miSans font-500 text-[#fff] lh-44">{{
              t('home.ecologicalStructureAndRolePosition')
            }}</span>
            <span class="fsize-28 font-miSans font-500 text-[#fff] lh-44">{{ t('home.adxIsTheFlowEntry') }}
            </span>
          </div>
        </div>
      </div>
      <span class="block mt-101 fsize-47 font-miSans font-630 text-[#fff] lh-60">{{
        t('home.tokenEconomicModel')
      }}</span>
      <span class="block mt-23 fsize-28 font-miSans font-400 text-[#fff] lh-41 opacity-70">{{
        t('home.allIntoTheBottomPoolContent')
      }}</span>
      <!-- model列表 -->
      <!-- 改为2行2列的网格布局 -->
      <div class="grid grid-cols-2 gap-x-20 gap-y-23 mt-55">
        <!-- 第一个：生态循环 -->
        <div class="flex flex-col items-start">
          <div class="flex items-center justify-center w-335 h-356">
            <van-image width="100%" height="100%" :src="model1" fit="contain"></van-image>
          </div>
          <div class="mt-27 min-h-20">
            <span class="block fsize-28 text-[#fff] font-roboto font-700 lh-39">{{
              t('home.ecologicalCycle')
            }}</span>
            <span class="block mt-5 fsize-24 text-[#fff] font-roboto font-400 lh-30 opacity-70">{{
              t('home.transactionAnalysis')
            }}</span>
          </div>
        </div>

        <!-- 第二个：社交激励系统 -->
        <div class="flex flex-col items-start">
          <div class="flex items-center justify-center w-335 h-356">
            <van-image width="100%" height="100%" :src="model2" fit="contain"></van-image>
          </div>
          <div class="mt-27 min-h-20">
            <span class="block fsize-28 text-[#fff] font-roboto font-700 lh-39">{{
              t('home.socialIncentiveSystem')
            }}</span>
            <span class="block mt-5 fsize-24 text-[#fff] font-roboto font-400 lh-30 opacity-70">{{
              t('home.nodeIncentivePlan')
            }}</span>
          </div>
        </div>

        <!-- 第三个：DAO治理 -->
        <div class="flex flex-col items-start">
          <div class="flex items-center justify-center w-335 h-356">
            <van-image width="100%" height="100%" :src="model3" fit="contain"></van-image>
          </div>
          <div class="mt-27 min-h-20">
            <span class="block fsize-28 text-[#fff] font-roboto font-700 lh-39">{{
              t('home.daoGovernance')
            }}</span>
            <span class="block mt-5 fsize-24 text-[#fff] font-roboto font-400 lh-30 opacity-70">{{
              t('home.threeLayerGovernanceModel')
            }}</span>
          </div>
        </div>

        <!-- 第四个：全球战略布局 -->
        <div class="flex flex-col items-start">
          <div class="flex items-center justify-center w-335 h-356">
            <van-image width="100%" height="100%" :src="model4" fit="contain"></van-image>
          </div>
          <div class="mt-27 min-h-20">
            <span class="block fsize-28 text-[#fff] font-roboto font-700 lh-39">{{
              t('home.globalStrategicLayout')
            }}</span>
            <span class="block mt-5 fsize-24 text-[#fff] font-roboto font-400 lh-30 opacity-70">{{
              t('home.southeastAsia')
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 公告弹窗 -->
    <van-dialog v-model:show="showNoticePopup" :title="currentNotice?.title" :show-confirm-button="false"
      class="notice-dialog" close-on-click-overlay>
      <div class="notice-popup-content">
        <div class="notice-text" v-html="currentNotice?.content?.replace(/\r\n/g, '<br>')"></div>
        <div class="notice-footer">
          <van-button round block type="primary" color="#3FFF6C" @click="closeNoticePopup" class="close-btn-text">
            {{ t('home.iKnow') }}
          </van-button>
        </div>
      </div>
    </van-dialog>
  </div>
  <Footer :theme="theme" />
</template>
<style lang="scss" scoped>
.van-hairline--surround {
  padding: 6px 10px;
  border-radius: 6px;
}

.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #fdfdfd;
  background: url('@/assets/imgs/home/index-bg.png') no-repeat top center;
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
  --Radial: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);

  .body {
    width: 100%;
    padding: 30px 30px 300px;
    position: relative;
  }
}

// Banner 轮播样式
.banner-wrapper {
  width: 100%;
  position: relative;
}

.banner-swipe {
  width: 100%;
  height: 276px;
  border-radius: 24px;
  overflow: hidden;

  :deep(.van-swipe__track) {
    height: 100%;
  }
}

.banner-item {
  width: 100%;
  height: 276px;

  :deep(.van-image) {
    border-radius: 24px;
  }
}

// 自定义指示器样式
.custom-indicator {
  position: absolute;
  bottom: 24px;
  left: 15%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator-dot {
  width: 32px;
  height: 4px;
  flex-shrink: 0;
  border-radius: 16px;
  background: #7a7777;
  transition: all 0.3s ease;

  &.active {
    background: #fff;
  }
}

.top {
  background: var(--2, linear-gradient(180deg, #02070b 0%, #00674f 57.21%, #9ac819 100%));
}

.power-bg {
  width: 100%;
  height: 155px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  border-radius: 24px;
  overflow: hidden;

  /* 阴影效果 */
  filter: drop-shadow(4px -6px 30px rgba(237, 41, 255, 0.3));

  /* 右上角圆角边框 - 使用渐变背景 */
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    right: -1px;
    width: 60px;
    height: 60px;
    background: #3fff6c;
    border-radius: 0 24px 0 0;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
    padding-left: 0;
    padding-bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  /* 左下角圆角边框 - 使用渐变背景 */
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: -1px;
    width: 60px;
    height: 60px;
    background: #3fff6c;
    border-radius: 0 0 0 24px;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
    padding-right: 0;
    padding-top: 0;
    pointer-events: none;
    z-index: 1;
  }
}

/* 第一个背景 - power-1 */
.power-bg-1 {
  background-image: url('@/assets/imgs/home/power-1.png');
  // background-color: lightgray;
}

/* 第二个背景 - power-2 */
.power-bg-2 {
  background-image: url('@/assets/imgs/home/power-2.png');
  // background-color: lightgray;
}

/* 数据统计容器样式 */
.stats-container {
  border-radius: 30px;
  padding: 2px;
  background: var(--Linear);
}

.stats-inner {
  border-radius: 28px;
  background: #122626;
}

.stats-icon-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3fff6c;
  box-shadow: 0 0 10px rgba(63, 255, 108, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(63, 255, 108, 0.05);
  border: 1px solid rgba(63, 255, 108, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(63, 255, 108, 0.08);
    border-color: rgba(63, 255, 108, 0.2);
    transform: translateY(-2px);
  }
}

.stat-label {
  display: flex;
  align-items: center;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

/* Pool余额独占一行的特殊样式 */
.stat-item-full {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(63, 255, 108, 0.12) 0%, rgba(63, 255, 108, 0.05) 100%);
  border: 1.5px solid rgba(63, 255, 108, 0.25);
  padding: 25px 24px;

  &:hover {
    background: linear-gradient(135deg, rgba(63, 255, 108, 0.18) 0%, rgba(63, 255, 108, 0.08) 100%);
    border-color: rgba(63, 255, 108, 0.35);
    box-shadow: 0 4px 20px rgba(63, 255, 108, 0.15);
  }
}

/* 协议卡片样式 */
.protocol-card {
  border-radius: 15px;
  background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 36.85%, #f658ff 100%);
}

/* 协议图片容器 - 突破父容器padding */
.protocol-img-wrapper {
  width: calc(100% + 60px);
  /* 100% + 左右各30px */
  margin-left: -30px;
  margin-right: -30px;
}

.plat-count {
  width: calc(100% + 60px);
  /* 100% + 左右各30px */
  margin-left: -30px;
  margin-right: -30px;
  background: var(--Radial, radial-gradient(106.52% 106.52% at 50% 50%, #14121c 45%, #f658ff 100%));
}

/* 证明卡片样式 */
.proof-card {
  border-radius: 30px;
  position: relative;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 20px 0 rgba(76, 140, 73, 0.1);

  /* 使用伪元素实现渐变边框 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 30px;
    padding: 2px;
    /* 边框宽度 */
    background: var(--Linear);
    /* 使用变量作为边框渐变 */
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }

  /* 确保内容在边框之上 */
  &>* {
    position: relative;
    z-index: 2;
  }
}

/* 图标容器背景 */
.icon-wrapper {
  background: rgba(254, 227, 255, 0.08);
}

.prooft-bg {
  width: calc(100% + 30px);
  /* 100% + 左右各30px */
  margin-right: -30px;
}

.proof-text {
  color: rgba(255, 255, 255, 0.6);
}

.ecology-slide {
  width: calc(100% + 30px);
  /* 100% + 左右各30px */
  margin-left: -31px;
}

.support {
  border-radius: 888px;
  background: #00ff6e;
}

.core-wrapper {
  border-radius: 30px;
  padding: 2px;
  /* 边框宽度 */
  background: rgba(0, 0, 0, 0.1);
}

.core-inner {
  border-radius: 28px;
  /* 略小于外层 */
  background: rgba(0, 0, 0, 0.1);
}

.kline-container {
  border-radius: 30px;
  padding: 2px;
  /* 边框宽度 */
  background: var(--Linear);
  /* 使用变量作为边框渐变 */
}

.kline-inner {
  border-radius: 28px;
  /* 略小于外层 */
  background: #122626;
}

/* 公告滚动样式 */
.notice-scroll-wrapper {
  position: relative;
  height: 34px;
  line-height: 34px;
}

.notice-scroll-content {
  display: inline-block;
  white-space: nowrap;
  animation: scroll-notice 15s linear infinite;
  padding-left: 100%;
}

@keyframes scroll-notice {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-100%);
  }
}

/* 当文字内容较短时,暂停动画 */
.notice-scroll-wrapper:hover .notice-scroll-content {
  animation-play-state: paused;
}

.kline-percent {
  border-radius: 13px;
  // background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 36.85%, #f658ff 100%);
  background: radial-gradient(106.52% 106.52% at 50% 50%,
      rgba(0, 32, 19, 0.95) 42.79%,
      rgba(0, 255, 128, 0.7) 100%);
  box-shadow: 0 0 7.216px 0 rgba(0, 89, 255, 0.25) inset;
}

.kline-chart {
  margin-top: 25px;
  width: 100%;
  height: 300px;
  position: relative;
}

/* 公告弹窗样式 */
:deep(.notice-dialog) {
  width: 90%;
  max-width: 90%;
  border-radius: 20px;
  background: linear-gradient(180deg, #1a0b2e 0%, #0f0518 100%);
  overflow: hidden;

  .van-dialog__header {
    padding: 30px 20px 20px;
    font-size: 32px;
    font-weight: 600;
    color: #fff;
    text-align: left;
    line-height: 1.4;
  }

  .van-dialog__content {
    padding: 0;
    max-height: 60vh;
    overflow: visible;
  }
}

.notice-popup-content {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
}

.notice-text {
  flex: 1;
  padding: 20px 30px;
  font-size: 26px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 400;
  color: #eadeff;
  line-height: 1.8;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(63, 255, 108, 0.5);
    /* 绿色滚动条 */
    border-radius: 2px;

    &:hover {
      background: rgba(63, 255, 108, 0.7);
      /* 悬停时更亮的绿色 */
    }
  }
}

.notice-footer {
  padding: 20px 30px 30px;
  background: transparent;
}

.close-btn-text {
  height: 80px;
  font-size: 28px;
  font-weight: 600;
  border-radius: 8888px;
  color: #000 !important;
  /* 按钮文字颜色改为白色 */
}
</style>
