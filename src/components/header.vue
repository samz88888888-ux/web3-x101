<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import lang from './lang.vue'
import { useI18n } from 'vue-i18n'
import { useIndexStore } from '@/store'
import { showToast } from 'vant'
import tg from '@/assets/icon/public/tg.png'
import twitter from '@/assets/icon/public/twitter.png'
import github from '@/assets/icon/public/github.png'
import logo from '@/assets/imgs/logo.png'
import en from '@/assets/icon/en.png'
import zh from '@/assets/icon/zh.png'
import lanuage from '@/assets/svg/lanuage.svg'
import levelIcon from '@/assets/svg/level.svg'
import ztwh from '@/assets/icon/tw.png'
import headerDot from '@/assets/svg/header-dot.svg'
import { formatEthereumAddress } from '@/utils'
const emit = defineEmits(['connectWallet'])
defineProps({
  theme: {
    type: String,
    default: 'dark' //'dark' // light
  },
  showTips: {
    type: Boolean,
    default: false
  }
})
const { t } = useI18n()
const store = useIndexStore()
let langRef = ref(null)
let show = ref(false)
const openOrCloseEnd = ref(false)
const router = useRouter()
const route = useRoute()

// 是否显示节点标签
const showNodeLabel = computed(() => {
  return store.userInfo?.node_id > 0
})

// 节点名称
const nodeName = computed(() => {
  return store.userInfo?.node_name || '普通节点'
})

let handleLanguge = () => {
  langRef.value.open()
}
let connectWallet = () => {
  emit('connectWallet')
}
let navListBase = ref([
  {
    label: '首页',
    path: '/index',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  },
  {
    label: '入金挖矿',
    path: '/otc',
    turnon: false,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`
  },
  {
    label: '我的钱包',
    path: '/wallet',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`
  },
  {
    label: '我的社区',
    path: '/community',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
  },
  {
    label: '充值释放',
    path: '/dorecharge',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`
  },
  {
    label: '游戏节点',
    path: '/node',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="2"></circle><circle cx="5" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><line x1="12" y1="7" x2="12" y2="10"></line><line x1="12" y1="14" x2="12" y2="17"></line><line x1="7" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="17" y2="12"></line></svg>`
  },
  {
    label: '游戏中心',
    path: '/game-center',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`
  },
  {
    label: '密室逃脱',
    path: '/game',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`
  },
  {
    label: '释放',
    path: '/release',
    turnon: true,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
    showCondition: () => store.userInfo?.liberate && Object.keys(store.userInfo.liberate).length > 0
  }
])

// 根据条件过滤菜单列表
const navList = computed(() => {
  return navListBase.value.filter((item) => {
    if (item.showCondition) {
      return item.showCondition()
    }
    return true
  })
})

const changeMeun = () => {
  show.value = !show.value
}

const handleClick = (item) => {
  if (!item.turnon) {
    showToast('敬请期待~')
    return
  }
  if (route.path !== item.path) {
    router.push({ path: item.path })
  }
  changeMeun()
}
const toHome = () => {
  router.push({ path: '/index' })
  show.value = false
}
// 关闭结束
const handleClosed = () => {
  openOrCloseEnd.value = false
}
// 打开结束
const handleOpened = () => {
  openOrCloseEnd.value = true
}

// 判断是否是内页（不是主要页面）
const isInnerPage = computed(() => {
  const mainPages = ['/index', '/power', '/wallet', '/invite', '/exchange', '/mine']
  return !mainPages.includes(route.path)
})

// 返回上一页逻辑
const goBack = () => {
  // 检查是否有历史记录
  if (window.history.length > 1) {
    router.back()
  } else {
    // 没有历史记录，跳转到首页
    router.push('/index')
  }
}
</script>
<template>
  <nav>
    <div class="flex justify-between items-center w-100%">
      <div class="left flex items-center gap-26">
        <!-- 内页显示返回按钮，主页显示logo -->
        <div v-if="isInnerPage"
          class="back-btn flex items-center justify-center wh-64 rounded-20 backdrop-blur-4 cursor-pointer"
          @click="goBack">
          <van-icon name="arrow-left" size="22" color="#fff" />
        </div>
        <van-image v-else width="37" height="37" :src="logo" @click="router.push('/index')" />
      </div>
      <div class="flex justify-center items-center">
        <!-- 身份等级标识 -->
        <div v-if="showNodeLabel"
          class="level-icon px-20 flex justify-center items-center h-50 mr-20 gap-6 cursor-pointer">
          <van-image width="16" height="16" :src="levelIcon"></van-image>
          <span class="fsize-20 text-[#FFD8A8] font-pingfang font-400">{{ nodeName }}</span>
        </div>
        <!-- 语言切换按钮 -->
        <div
          class="flex justify-center items-center wh-64 rounded-20 bg-[rgba(0,0,0,0.63)] backdrop-blur-4 mr-24 cursor-pointer"
          @click="handleLanguge">
          <van-image width="28" height="28" :src="lanuage"></van-image>
        </div>

        <!-- 钱包按钮（未连接/已连接） -->
        <div class="check-login flex justify-center items-center h-64 px-16 cursor-pointer"
          @click="!store.address ? connectWallet() : null">
          <div class="flex justify-center items-start">
            <!-- 图标在下层 -->
            <van-image width="10" height="10" :src="headerDot" class="relative z-1"></van-image>
            <!-- 文字在上层，负边距让其重叠在图标上 -->
            <span class="fsize-28 text-[#FFFFFF] font-pingfang font-400 relative z-10 -ml-10">
              {{ store.address ? formatEthereumAddress(store.address) : '链接钱包' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <lang ref="langRef" />
  <van-popup v-model:show="show" z-index="9" :overlay="true" position="left" @closed="handleClosed"
    @opened="handleOpened" :overlay-style="{ background: 'rgba(0, 0, 0, 0.7)' }">
    <div class="nav_body">
      <!-- Logo和关闭按钮区域 -->
      <div class="nav_header">
        <van-image width="48" height="48" :src="logo" />
        <div class="close_btn" @click="changeMeun">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>

      <!-- 菜单列表 -->
      <div class="nav_list">
        <div class="nav_list_item" :class="{ active: route.path === item.path }" v-for="item in navList"
          :key="item.label" @click="handleClick(item)">
          <div class="nav_list_item--icon-left" v-html="item.icon"></div>
          <div class="nav_list_item--label">{{ item.label }}</div>
          <div class="nav_list_item--arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- 底部装饰 -->
      <div class="nav_footer">
        <div class="decoration_line"></div>
        <div class="footer_text">Web3 Mining Platform</div>
      </div>
    </div>
  </van-popup>
</template>

<style scoped lang="scss">
nav {
  position: relative !important;
  // top: 0;
  // left: 0;
  width: 100%;
  height: 142px;
  padding: 42px 35px 27px;
  background-color: transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 99;
  background-color: #000;
  backdrop-filter: blur(50px);

  // margin-bottom: 66px;

  .check-login {
    position: relative;
    border: none;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.63);
    backdrop-filter: blur(4px);

    // 渐变边框（使用伪元素）
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 16px; // 与父元素的 rounded-16 一致
      padding: 2px; // 边框宽度
      // background: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);
      background: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .level-icon {
    border-radius: 19998px;
    border: 1px solid #ffe8c8;
    background: linear-gradient(90deg, #160e00 0%, #7c4d00 102.5%);
  }

  .back-btn {
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.75);
    }

    &:active {
      transform: scale(0.95);
      background: rgba(0, 0, 0, 0.85);
    }
  }
}

.right {
  // position: absolute;
  // right: 0;
  // top: 0;
  // height: 100%;
  // border-radius: 0 0 0 5555px;
  // background: #FFF;
  // // padding-top: 20px;
  // padding-right: 18px;
  // // height: 48px;
}

.account {
  color: #000;
  text-align: center;
  font-family: MiSans;
  font-size: 12px;
  font-style: normal;
  font-weight: 630;
  line-height: normal;
  margin-left: 12px;
  margin-right: 20px;
}

.nav_btn {
  margin-left: 16px;
}

.nav_body {
  width: 85vw;
  max-width: 600px;
  height: 100vh;
  position: relative;
  background: linear-gradient(165deg, #0a1f1c 0%, #011414 50%, #000000 100%);
  padding: 44px 0 40px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 50%, rgba(211, 237, 6, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(211, 237, 6, 0.3) 50%,
        transparent 100%);
  }
}

.nav_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;

  .close_btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      color: #d3ed06;
    }

    &:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.12);
    }
  }
}

.nav_list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 0 20px;
  position: relative;
  z-index: 1;

  .nav_list_item {
    display: flex;
    align-items: center;
    padding: 20px 24px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    // 悬停光效
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(211, 237, 6, 0.1), transparent);
      transition: left 0.5s ease;
    }

    &:active {
      transform: translateX(4px);
    }

    &.active {
      background: linear-gradient(135deg, rgba(211, 237, 6, 0.15) 0%, rgba(211, 237, 6, 0.08) 100%);
      border-color: rgba(211, 237, 6, 0.3);
      box-shadow: 0 4px 20px rgba(211, 237, 6, 0.15);

      .nav_list_item--icon-left {
        color: #d3ed06;
      }

      .nav_list_item--label {
        color: #d3ed06;
      }

      .nav_list_item--arrow {
        color: #d3ed06;
      }
    }

    &:hover::before {
      left: 100%;
    }

    .nav_list_item--icon-left {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      margin-right: 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      color: #9dabc4;
      transition: all 0.3s ease;
    }

    .nav_list_item--label {
      flex: 1;
      color: #ffffff;
      font-family:
        MiSans,
        PingFang SC,
        sans-serif;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    .nav_list_item--arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9dabc4;
      opacity: 0.6;
      transition: all 0.3s ease;
    }

    &:active .nav_list_item--arrow {
      transform: translateX(4px);
    }
  }
}

.nav_footer {
  padding: 30px 30px 0;
  position: relative;
  z-index: 1;

  .decoration_line {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(211, 237, 6, 0.3) 50%,
        transparent 100%);
    margin-bottom: 20px;
  }

  .footer_text {
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-family: 'Roboto', sans-serif;
    font-size: 20px;
    font-weight: 300;
    letter-spacing: 1px;
  }
}

.border-c18 {
  border: 1px solid #00c18d;
}
</style>
