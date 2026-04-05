<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showNotify } from 'vant'
import { useIndexStore } from '@/store'
import { formatNumber, formatPerformance } from '@/utils/format'
import { useRouter } from 'vue-router'
import mineBanner from '@/assets/imgs/user/mine-banner.png'
import topTipSvg from '@/assets/imgs/user/top-tip.svg'
import tip1 from '@/assets/imgs/user/tip1.svg'
import tip2 from '@/assets/imgs/user/tip2.svg'
import tip3 from '@/assets/imgs/user/tip3.svg'
import chartSvg from '@/assets/imgs/user/chart.svg'
import notice from '@/assets/imgs/user/notice.png'
import handleHide from '@/assets/imgs/user/hide.svg'
import levelIcon from '@/assets/imgs/user/level.svg'
import boxIcon from '@/assets/imgs/user/box.svg'
import uprightIcon from '@/assets/imgs/user/up-right.svg'
import logoIcon from '@/assets/imgs/logo.png'
import X10CoinOld from '@/assets/imgs/coin/x101-coin-old.png'
import SotaCoin from '@/assets/imgs/coin/x101-coin.png'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import adxIcon from '@/assets/imgs/coin/adx-coin.png'
import mcnIcon from '@/assets/imgs/coin/pyt-coin.png'
import Footer from '@/components/footer.vue'

const router = useRouter()
const { t } = useI18n()
const store = useIndexStore()
const show = ref(false)

// 是否隐藏资产
const isHidden = ref(false)

// 切换隐藏/显示
const toggleHidden = () => {
  isHidden.value = !isHidden.value
}

// 格式化显示的金额(支持隐藏)
const formatAmount = (value, decimals = 2) => {
  if (isHidden.value) {
    return '****'
  }
  return formatNumber(value || 0, decimals)
}

// 从 store 获取用户信息
const userInfo = computed(() => store.userInfo)

// 格式化钱包地址
const formatAddress = computed(() => {
  const addr = userInfo.value?.name
  if (!addr) return '--'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
})

// 计算总资产(USDT)
const totalAssets = computed(() => {
  return userInfo.value?.balance_list?.total_assets || '0'
})

// SOTA 余额
const sotaBalance = computed(() => {
  return userInfo.value?.balance_list?.sota_balance || 0
})

// SOTA 总价值
const sotaAssets = computed(() => {
  return userInfo.value?.balance_list?.sota_assets || '0'
})
// X101 余额
const x101Balance = computed(() => {
  return userInfo.value?.balance_list?.x101_balance || 0
})

// X101 价格
const x101Price = computed(() => {
  return userInfo.value?.balance_list?.x101_price || 0
})

// X101 总价值
const x101Assets = computed(() => {
  return userInfo.value?.balance_list?.x101_assets || '0'
})
// ADX 余额
const adxBalance = computed(() => {
  return userInfo.value?.balance_list?.adx_balance || 0
})

// ADX 总价值
const adxAssets = computed(() => {
  return userInfo.value?.balance_list?.adx_assets || '0'
})
// 用户等级
const userNode = computed(() => {
  return userInfo.value.node_id >= 1 ? userInfo.value?.node_name : '--'
})

// GAS 余额
const gasBalance = computed(() => {
  return userInfo.value?.user_gas || 0
})

// GAS 是否充足
const gasEnough = computed(() => {
  return userInfo.value?.gas_enough !== false
})

// 收益数据
const incomeData = computed(() => {
  const income = userInfo.value?.income_list || {}
  const incomeByTypes = userInfo.value?.income_by_types || {}

  return {
    total: income.total_income || 0, // 累计收益
    today: income.today_income || 0, // 今日收益
    shareIncome: userInfo.value?.total_zhi || 0, // 分享收益
    static: incomeByTypes.static_income?.total || 0, // 静态收益(算力收益)
    node: incomeByTypes.node_income?.total || 0, // 节点收益
    dynamic: incomeByTypes.dynamic_income?.total || 0, // 动态收益(推广收益)
    level: incomeByTypes.level_income?.total || 0 // 等级收益
  }
})

let teamList = ref([])
let init = async () => {
  // 获取团队列表
  api.home.teamList().then((res) => {
    teamList.value = res
  })
  // 获取用户信息到 store
  await store.fetchUserInfo()
  console.log('用户信息:', userInfo.value)
}

// 获取首页信息
const homeInfo = ref({})
const getHomeInfo = async () => {
  try {
    const res = await api.home.getHomeInfo()
    homeInfo.value = res
  } catch (error) {
    console.error('获取首页信息失败:', error)
  }
}
onMounted(() => {
  ; (init(), getHomeInfo())
})
</script>
<template>
  <div class="container">
    <div class="body w-100% flex flex-col items-start justify-center">
      <!-- 公告栏 -->
      <!-- <div class="pt-24 px-3 w-100%">
        <div
          class="p-14 flex items-center w-100% rounded-14 bg-[rgba(255,255,255,0.1)] gap-9 overflow-hidden">
          <van-image
            width="17"
            height="17"
            :src="notice"
            fit="contain"
            class="flex-shrink-0"></van-image>
          <div class="notice-scroll-wrapper flex-1 overflow-hidden">
            <div class="notice-scroll-content">
              <span class="fsize-24 text-[#FFF] font-pingfang font-400 whitespace-nowrap">
                关于BTC提币手续费调整的通知
              </span>
            </div>
          </div>
        </div>
      </div> -->
      <div class="top-bg mt-33 flex flex-col items-start justify-center px-32 py-41 rounded-20">
        <div class="flex items-center justify-between w-100%">
          <div class="flex flex-col gap-20 items-start justify-center">
            <div class="flex items-center justify-center gap-10">
              <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal opacity-60">{{
                t('wallet.estimatedTotalAssets')
              }}</span>
              <div class="hide-icon-wrapper flex items-center justify-center cursor-pointer" @click="toggleHidden">
                <van-image width="18" height="18" :src="handleHide" fit="contain"
                  :class="['hide-icon', { 'icon-active': isHidden }]"></van-image>
              </div>
            </div>
            <span class="fsize-36 font-miSans font-800 text-[#fff] leading-normal total-amount">{{
              formatAmount(totalAssets, 3)
            }}</span>
          </div>
          <div class="arrow-container flex gap-5 items-center justify-center py-12 px-14 cursor-pointer"
            @click="router.push('/walletLog')">
            <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-none">{{
              t('wallet.assetRecord')
            }}</span>
            <van-icon name="arrow" size="14" color="#fff" />
          </div>
        </div>

        <div class="wallet-action-row flex items-center justify-between w-100% mt-35 gap-20">
          <div class="flex flex-1 items-center gap-20">
            <div
              class="wallet-action-btn flex-1 h-80 rounded-55 bg-[#00FF6E] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              @click="router.push('/withdrawal')">
              <span class="fsize-34 font-pingfang font-600 text-[#000] leading-normal uppercase">{{
                t('wallet.withdraw')
              }}</span>
            </div>
            <div
              class="wallet-action-btn wallet-action-btn-secondary flex-1 h-80 rounded-55 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              @click="router.push('/transfer')">
              <span class="fsize-34 font-pingfang font-600 text-[#fff] leading-normal">转账</span>
            </div>
          </div>
          <div class="level-box flex gap-6 items-center justify-center py-10 px-20">
            <van-image width="16" height="16" :src="levelIcon" fit="contain"></van-image>
            <span class="fsize-20 font-pingfang font-400 text-[#fff] leading-none uppercase">{{
              userNode
            }}</span>
          </div>
        </div>
      </div>

      <!-- GAS 警告提示 -->
      <div class="gas-warning mt-20 w-100% flex items-center gap-12 px-24 py-16">
        <van-icon name="warning-o" size="22" color="#00FF6E" class="flex-shrink-0" />
        <div class="flex flex-col gap-6 flex-1">
          <span class="fsize-26 font-pingfang font-600 text-[#00FF6E] leading-tight">
            {{ t('user.gasBelowPerformance70') }}
          </span>
          <!-- <span class="fsize-20 font-pingfang font-400 text-[rgba(0,255,110,0.8)] leading-tight">
            请及时充值 GAS 以恢复收益
          </span> -->
        </div>
        <!-- <van-icon name="info-o" size="20" color="rgba(0, 255, 110, 0.6)" /> -->
      </div>

      <!-- 资产详情 -->
      <div class="assets-detail-container flex flex-col gap-30 w-100% items-start justify-center">
        <div class="flex pt-45 gap-12 items-center justify-center">
          <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
          <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
            t('wallet.assetDetail')
          }}</span>
        </div>

        <!-- SOTA 资产 -->
        <div class="flex flex-col w-100% items-start justify-center gap-22">
          <div class="flex items-center justify-between w-100%">
            <div class="flex items-center justify-center gap-18">
              <van-image width="40" height="40" :src="SotaCoin" fit="contain"></van-image>
              <div class="flex flex-col items-start justify-center gap-4">
                <span class="fsize-30 font-pingfang font-600 text-[#fff] leading-tight">SOTA</span>
                <div class="flex items-center gap-8">
                  <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-none opacity-50">≈${{
                    formatAmount(sotaAssets, 3) }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end justify-center gap-2">
              <span class="fsize-32 font-pingfang font-600 text-[#fff] leading-tight asset-value">{{
                formatAmount(sotaBalance, 3)
                }}</span>
            </div>
          </div>
          <div class="assets-line"></div>
        </div>
        <!-- X101 资产 -->
        <div class="flex flex-col w-100% items-start justify-center gap-22">
          <div class="flex items-center justify-between w-100%">
            <div class="flex items-center justify-center gap-18">
              <van-image width="40" height="40" :src="X10CoinOld" fit="contain"></van-image>
              <div class="flex flex-col items-start justify-center gap-4">
                <span class="fsize-30 font-pingfang font-600 text-[#fff] leading-tight">X101</span>
                <div class="flex items-center gap-8">
                  <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-none opacity-50">≈${{
                    formatAmount(x101Assets, 3) }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end justify-center gap-2">
              <span class="fsize-32 font-pingfang font-600 text-[#fff] leading-tight asset-value">{{
                formatAmount(x101Balance, 3)
              }}</span>
            </div>
          </div>
          <div class="assets-line"></div>
        </div>
        <!-- ADX资产 -->
        <div class="flex flex-col w-100% items-start justify-center gap-22">
          <div class="flex items-center justify-between w-100%">
            <div class="flex items-center justify-center gap-18">
              <van-image width="40" height="40" :src="mcnIcon" fit="contain"></van-image>
              <div class="flex flex-col items-start justify-center gap-4">
                <span class="fsize-30 font-pingfang font-600 text-[#fff] leading-tight">PYTHIA</span>
                <div class="flex items-center gap-8">
                  <span class="fsize-22 font-pingfang font-400 text-[#fff] leading-none opacity-50">≈${{
                    formatAmount(adxAssets, 3) }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end justify-center gap-2">
              <span class="fsize-32 font-pingfang font-600 text-[#fff] leading-tight asset-value">{{
                formatAmount(adxBalance, 3)
                }}</span>
            </div>
          </div>
          <div class="assets-line"></div>
        </div>

        <!-- GAS 资产 -->
        <div class="flex flex-col w-100% items-start justify-center gap-22">
          <div class="flex items-center justify-between w-100%">
            <div class="flex items-center justify-center gap-18">
              <div class="gas-icon-wrapper flex items-center justify-center">
                <van-icon name="fire-o" size="24" :color="gasEnough ? '#16FFC2' : '#00FF6E'" />
              </div>
              <div class="flex flex-col items-start justify-center gap-4">
                <div class="flex items-center gap-10">
                  <span class="fsize-30 font-pingfang font-600 text-[#fff] leading-tight">GAS</span>
                  <span v-if="!gasEnough"
                    class="gas-warning-badge px-10 py-4 rounded-6 fsize-18 font-pingfang font-400">
                    {{ t('user.gasNotEnough') }}
                  </span>
                  <span v-else class="gas-normal-badge px-10 py-4 rounded-6 fsize-18 font-pingfang font-400">
                    {{ t('user.gasEnough') }}
                  </span>
                </div>
                <span class="fsize-22 font-pingfang font-400 leading-none" :class="gasEnough ? 'text-[rgba(255,255,255,0.5)]' : 'text-[rgba(0,255,110,0.8)]'
                  ">
                  {{ gasEnough ? t('user.gasNormal') : t('user.gasBelowPerformance70Tip') }}
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end justify-center gap-2">
              <span class="fsize-32 font-pingfang font-600 leading-tight asset-value"
                :class="gasEnough ? 'text-[#16FFC2]' : 'text-[#00FF6E]'">
                {{ formatAmount(gasBalance, 3) }}
              </span>
            </div>
          </div>
          <div class="assets-line"></div>
        </div>
      </div>
      <div class="flex pt-40 gap-12 items-center justify-center">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
          t('wallet.myIncome')
        }}</span>
      </div>
      <!-- 我的收获 -->
      <div class="harvest-grid mt-27 w-100%">
        <!-- 累计收益 -->
        <div class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.totalIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.total, 3)
          }}</span>
        </div>

        <!-- 今日收益 -->
        <div class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.todayIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.today, 3)
          }}</span>
        </div>

        <!-- 静态收益(算力收益) -->
        <div
          class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33 cursor-pointer active:scale-95 transition-transform"
          @click="router.push({ path: '/walletLog', query: { type: 5 } })">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.powerIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain" class="click-icon"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.static, 3)
          }}</span>
        </div>

        <!-- 节点收益 -->
        <div
          class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33 cursor-pointer active:scale-95 transition-transform"
          @click="router.push({ path: '/walletLog', query: { type: 8 } })">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.nodeIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain" class="click-icon"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.node, 3)
          }}</span>
        </div>

        <!-- 动态收益(推广收益) -->
        <div
          class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33 cursor-pointer"
          @click="router.push('/direct-income-log')">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.dynamicIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.shareIncome, 3)
          }}</span>
        </div>

        <!-- 等级收益 -->
        <div
          class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33 cursor-pointer active:scale-95 transition-transform"
          @click="router.push({ path: '/walletLog', query: { type: 7 } })">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('wallet.levelIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain" class="click-icon"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.level, 3)
          }}</span>
        </div>

        <!-- 级别奖池 -->
        <div class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('walletEnum.levelPool')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(homeInfo?.pool_balance, 3)
          }}</span>
        </div>

        <!-- DAO奖池 -->
        <div class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('walletEnum.daoPool')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(homeInfo?.dao_balance, 3)
          }}</span>
        </div>
        <!-- 小区收益 -->
        <div
          class="box-bg flex flex-col gap-11 items-start justify-center w-335 h-155 pt-37 pb-33 pl-29 pr-33 cursor-pointer active:scale-95 transition-transform"
          @click="router.push({ path: '/walletLog', query: { type: 6 } })">
          <div class="flex items-start justify-between w-100%">
            <span class="fsize-22 font-pingfang font-500 text-[#fff] leading-normal opacity-60">{{
              t('walletEnum.minIncome')
            }}</span>
            <van-image width="15" height="15" :src="uprightIcon" fit="contain" class="click-icon"></van-image>
          </div>
          <span class="fsize-31 font-pingfang font-600 text-[#fff] leading-relaxed income-value">{{
            formatAmount(incomeData.dynamic, 3)
          }}</span>
        </div>
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
  background: url('@/assets/imgs/user/mine-bg.png') no-repeat top center;
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
  padding: 1px 30px 245px;
  position: relative;
}

.top-bg {
  position: relative;
  width: 100%;
  background: url('@/assets/imgs/user/mine-banner.png') no-repeat top center;
  background-size: 100% auto;
  border-radius: 30px;

  /* 使用伪元素实现左、右、底部渐变边框 */
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(100% - 0px);
    /* 从顶部0px开始，覆盖左右底部 */
    border-radius: 0 0 30px 30px;
    /* 只保留底部圆角 */
    padding: 0 0px 2px 0px;
    /* 左、右、底部各2px边框宽度 */
    background: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }

  /* 确保内容在边框之上 */
  >* {
    position: relative;
    z-index: 1;
  }
}

.arrow-container {
  border-radius: 13px;
  border: 1px solid #fff;
}

/* 隐藏图标容器 */
.hide-icon-wrapper {
  width: 28px;
  height: 28px;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.9);
  }
}

.hide-icon {
  transition: all 0.3s ease;
}

.icon-active {
  opacity: 0.5;
  filter: brightness(1.5);
}

/* 总金额动画 */
.total-amount {
  transition: all 0.3s ease;
  min-width: 120px;
}

/* 资产数值动画 */
.asset-value {
  transition: all 0.3s ease;
  min-width: 80px;
  text-align: right;
}

/* 收益数值动画 */
.income-value {
  transition: all 0.3s ease;
  min-width: 100px;
}

.box {
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
}

.wallet-action-btn-secondary {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(12px);
}

.level-box {
  border-radius: 30px;
  position: relative;
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

.gray-color {
  color: rgba(255, 255, 255, 0.7);
}

.table-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
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

.assets-line {
  width: 100%;
  height: 1px;
  opacity: 0.1;
  background: #fff;
}

/* 隐藏资产详情中最后一个分割线 */
.assets-detail-container>div:last-child .assets-line {
  display: none;
}

/* GAS 警告提示 */
.gas-warning {
  position: relative;
  border-radius: 16px;
  background: rgba(0, 255, 110, 0.1);
  border: 1px solid rgba(0, 255, 110, 0.3);
  backdrop-filter: blur(10px);
  animation: pulse-warning 2s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    background: linear-gradient(135deg,
        rgba(0, 255, 110, 0.3) 0%,
        rgba(0, 255, 110, 0.1) 50%,
        rgba(0, 255, 110, 0.3) 100%);
    z-index: -1;
    opacity: 0;
    animation: border-pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse-warning {

  0%,
  100% {
    background: rgba(0, 255, 110, 0.1);
  }

  50% {
    background: rgba(0, 255, 110, 0.15);
  }
}

@keyframes border-pulse {

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

/* GAS 图标容器 */
.gas-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

/* GAS 警告徽章 */
.gas-warning-badge {
  background: rgba(0, 255, 110, 0.2);
  border: 1px solid rgba(0, 255, 110, 0.4);
  color: #00ff6e;
  animation: badge-blink 1.5s ease-in-out infinite;
}

@keyframes badge-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

/* GAS 正常徽章 */
.gas-normal-badge {
  background: rgba(22, 255, 194, 0.15);
  border: 1px solid rgba(22, 255, 194, 0.3);
  color: #16ffc2;
}

.harvest-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 一行2列 */
  gap: 20px;
  /* 间距 */
}

.box-bg {
  // position: relative;
  border-radius: 20px;
  /* 背景图 */
  background: url('@/assets/imgs/user/box.svg') no-repeat center center;
  background-size: contain;

  /* 使用伪元素实现上下渐变边框 */
  &::before {
    content: '';
    position: absolute;
    left: 20px;
    /* 从圆角结束处开始 */
    right: 20px;
    /* 到圆角开始处结束 */
    top: 0;
    bottom: 0;
    /* 只在上下添加边框 */
    // border-top: 1px solid transparent;
    border-bottom: 1px solid transparent;
    border-image: linear-gradient(90deg, #320041 0%, #fff 50%, #320041 100%) 1;
    pointer-events: none;
    z-index: 0;
  }

  /* 上边框 */
  &::after {
    content: '';
    position: absolute;
    left: 20px;
    /* 从圆角结束处开始 */
    right: 20px;
    /* 到圆角开始处结束 */
    top: 0;
    height: 1px;
    background: linear-gradient(90deg, #320041 0%, #fff 50%, #320041 100%);
    pointer-events: none;
    z-index: 2;
  }

  /* 下边框使用另一个方法 */
  &::before {
    content: '';
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, #3fff6c 0%, #fff 50%, #3fff6c 100%);
    pointer-events: none;
    z-index: 2;
  }

  /* 确保内容在边框之上 */
  >* {
    position: relative;
    z-index: 3;
  }

  /* 点击图标动画 */
  .click-icon {
    transition: transform 0.3s ease;
    animation: bounce-hint 2s ease-in-out infinite;
  }

  /* 鼠标悬停时图标效果 */
  &:hover .click-icon {
    transform: translateX(3px) translateY(-3px);
    animation: none;
  }

  /* 点击效果 */
  &:active {
    transform: scale(0.98);
  }
}

/* 提示动画 - 轻微弹跳 */
@keyframes bounce-hint {

  0%,
  100% {
    transform: translateX(0) translateY(0);
  }

  50% {
    transform: translateX(2px) translateY(-2px);
  }
}
</style>
