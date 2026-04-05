<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import Footer from '@/components/footer.vue'
import dotIcon from '@/assets/imgs/wallet/dot.svg'

const { t } = useI18n()

// ===== VIP卡余额 =====
const vipCardBalance = ref(0)

// 转账数量
const transferAmount = ref('')

// 收款地址
const toAddress = ref('')

// Tab切换：1-我转出的，2-我收到的
const activeTab = ref(1)

// 转账记录
const transferList = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const params = ref({ page: 1, page_size: 20, transfer_type: 1 })
const total = ref(0)
const isLoadingData = ref(false)

// 获取VIP卡信息
const getVipCardInfo = async () => {
  try {
    const res = await api.box.getVipCardInfo()
    if (res) {
      vipCardBalance.value = res.userCardCount || 0
    }
  } catch (error) {
    console.error('获取VIP卡信息失败:', error)
  }
}

// 获取转账记录
const getTransferList = async () => {
  if (isLoadingData.value) {
    return
  }

  isLoadingData.value = true
  loading.value = true

  try {
    const res = await api.box.getVipCardTransferLog(params.value)

    if (res?.list) {
      if (refreshing.value || params.value.page === 1) {
        transferList.value = res.list
        refreshing.value = false
      } else {
        transferList.value = [...transferList.value, ...res.list]
      }

      total.value = res.total || 0
      params.value.page++

      if (transferList.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取转账记录失败:', error)
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
  getTransferList()
}

// 下拉刷新
const onRefresh = () => {
  finished.value = false
  params.value.page = 1
  transferList.value = []
  getTransferList()
}

// 切换Tab
const switchTab = (type) => {
  if (activeTab.value === type) return

  activeTab.value = type
  params.value.transfer_type = type
  params.value.page = 1
  transferList.value = []
  finished.value = false
  loading.value = false
  getTransferList()
}

// 增加数量
const increaseAmount = () => {
  const current = parseInt(transferAmount.value) || 0
  transferAmount.value = (current + 1).toString()
}

// 减少数量
const decreaseAmount = () => {
  const current = parseInt(transferAmount.value) || 0
  if (current > 0) {
    transferAmount.value = (current - 1).toString()
  }
}

// 处理输入，只允许正整数
const handleInput = (e) => {
  let value = e.target.value
  // 只保留数字
  value = value.replace(/[^\d]/g, '')
  // 去掉前导0
  if (value.length > 1 && value.startsWith('0')) {
    value = value.replace(/^0+/, '')
  }
  transferAmount.value = value
}

// 执行转账
const handleTransfer = async () => {
  // 1. 验证收款地址
  if (!toAddress.value || toAddress.value.trim() === '') {
    showToast(t('vipCard.pleaseEnterAddress'))
    return
  }

  // 2. 验证转账数量
  if (!transferAmount.value || parseInt(transferAmount.value) <= 0) {
    showToast(t('vipCard.pleaseEnterAmount'))
    return
  }

  const amount = parseInt(transferAmount.value)

  // 3. 验证余额
  if (amount > vipCardBalance.value) {
    showToast(t('vipCard.balanceNotEnough'))
    return
  }

  try {
    showLoadingToast({
      message: t('vipCard.transferring'),
      duration: 0,
      forbidClick: true
    })

    // 调用转账接口
    await api.box.vipCardTransfer({
      num: amount,
      to_address: toAddress.value.trim()
    })

    closeToast()
    showToast(t('vipCard.transferSuccess'))

    // 清空输入
    transferAmount.value = ''
    toAddress.value = ''

    // 刷新余额和转账记录
    await getVipCardInfo()

    // 刷新转账记录
    finished.value = false
    params.value.page = 1
    transferList.value = []
    await getTransferList()
  } catch (error) {
    closeToast()
    showToast(error.message || t('vipCard.transferFailed'))
  }
}

onMounted(() => {
  getVipCardInfo()
})
</script>

<template>
  <div class="container">
    <div class="body">
      <!-- 页面标题 -->
      <div class="flex gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
          t('vipCard.transferTitle')
        }}</span>
      </div>

      <!-- 转账表单区域 -->
      <div class="transfer-card mt-23 w-100%">
        <div class="card-inner pt-40 px-30 pb-48">
          <!-- 转账图标和标题 -->
          <div class="transfer-header flex items-center gap-16 mb-40">
            <!-- <div class="transfer-icon-wrapper">
              <svg class="transfer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor" />
                <path d="M20 4L18.59 5.41L13.01 11H1V13H13.01L18.59 18.59L20 20L12 12L20 4Z" fill="currentColor"
                  opacity="0.5" />
              </svg>
            </div> -->
            <div class="flex flex-col gap-4">
              <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-none">{{
                t('vipCard.transferTitle')
              }}</span>
              <span class="fsize-20 font-roboto font-400 text-[rgba(255,255,255,0.5)] leading-none">
                {{ t('vipCard.myBalance') }}: {{ vipCardBalance }} {{ t('vipCard.cardsUnit') }}
              </span>
            </div>
          </div>

          <!-- 收款地址输入 -->
          <div class="input-group">
            <div class="input-label flex items-center gap-8 mb-16">
              <div class="label-dot"></div>
              <span class="fsize-24 font-pingfang font-500 text-[rgba(255,255,255,0.8)] leading-none">{{
                t('vipCard.receiverAddress')
              }}</span>
            </div>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z"
                  fill="currentColor" />
              </svg>
              <input v-model="toAddress" type="text" :placeholder="t('vipCard.pleaseEnterAddress')"
                class="styled-input" />
            </div>
          </div>

          <!-- 转账数量输入 -->
          <div class="input-group mt-32">
            <div class="input-label flex items-center gap-8 mb-16">
              <div class="label-dot"></div>
              <span class="fsize-24 font-pingfang font-500 text-[rgba(255,255,255,0.8)] leading-none">{{
                t('vipCard.transferAmount')
              }}</span>
            </div>
            <div class="amount-control">
              <!-- 减少按钮 -->
              <button class="control-btn decrease" @click="decreaseAmount">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H5V11H19V13Z" fill="currentColor" />
                </svg>
              </button>

              <!-- 数量显示 -->
              <div class="amount-display">
                <input v-model="transferAmount" type="text" :placeholder="'0'" @input="handleInput"
                  class="amount-input" />
                <!-- <span class="amount-unit">{{ t('vipCard.cardsUnit') }}</span> -->
              </div>

              <!-- 增加按钮 -->
              <button class="control-btn increase" @click="increaseAmount">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 转账按钮 -->
          <button class="transfer-submit-btn mt-40" @click="handleTransfer">
            <div class="btn-glow"></div>
            <span class="btn-text">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
              </svg>
              {{ t('vipCard.transferNow') }}
            </span>
          </button>
        </div>
      </div>

      <!-- 转账记录 -->
      <div class="flex mt-50 gap-12 items-center justify-between">
        <div class="flex gap-12 items-center">
          <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
          <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">{{
            t('vipCard.transferRecords')
          }}</span>
        </div>
        <span class="fsize-22 font-pingfang font-400 text-[rgba(255,255,255,0.6)] leading-normal">{{
          t('box.totalRecords', { count: total })
        }}</span>
      </div>

      <!-- Tab切换 -->
      <div class="tabs-wrapper mt-20">
        <div class="tab-item" :class="{ active: activeTab === 1 }" @click="switchTab(1)">
          <span>{{ t('vipCard.sentByMe') }}</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 2 }" @click="switchTab(2)">
          <span>{{ t('vipCard.receivedByMe') }}</span>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="power-container mt-20 w-100% flex-col pt-34 px-30 pb-55 items-start justify-center">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
          <van-list v-model:loading="loading" :finished="finished"
            :finished-text="transferList.length > 0 ? t('common.noMore') : ''" @load="onLoad" class="list-wrapper">
            <!-- 空状态 -->
            <div v-if="transferList.length === 0 && !loading" class="empty-state">
              <van-empty :description="t('vipCard.noTransferRecord')" />
            </div>

            <!-- 列表项 -->
            <div v-for="(item, index) in transferList" :key="index" class="transfer-item">
              <div class="flex flex-col gap-16 w-100%">
                <!-- 第一行：数量和时间 -->
                <div class="flex items-center justify-between w-100%">
                  <div class="flex items-center gap-12">
                    <div class="amount-badge" :class="activeTab === 1 ? 'send' : 'receive'">
                      <span class="amount-text">{{ activeTab === 1 ? '-' : '+' }}{{ item.num }}</span>
                    </div>
                    <span class="fsize-22 font-pingfang font-400 text-[rgba(255,255,255,0.7)] leading-none">
                      {{ t('vipCard.cardsUnit') }}
                    </span>
                  </div>
                  <span class="fsize-20 font-roboto font-400 text-[rgba(255,255,255,0.4)] leading-none">
                    {{ item.created_at }}
                  </span>
                </div>

                <!-- 第二行：地址信息 -->
                <div class="flex items-center gap-12 w-100%">
                  <div class="address-tag">
                    <span class="fsize-20 font-roboto font-400 text-[rgba(255,255,255,0.6)] leading-none">
                      {{ activeTab === 1 ? t('vipCard.to') : t('vipCard.from') }}
                    </span>
                  </div>
                  <span class="fsize-22 font-roboto font-500 text-[#3FFF6C] leading-none">
                    {{ item.o_address }}
                  </span>
                </div>
              </div>

              <!-- 分割线 -->
              <div v-if="index < transferList.length - 1" class="line"></div>
            </div>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>
    <Footer />
  </div>
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

  /* 禁用过度滚动回弹效果 */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  /* CSS 变量定义 */
  --Linear: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);

  .body {
    width: 100%;
    padding: 30px 30px 300px;
    position: relative;
  }

  .power-container {
    position: relative;
    border-radius: 30px;
    background: #122626;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 30px;
      padding: 2px;
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

/* 转账卡片 */
.transfer-card {
  position: relative;
  border-radius: 30px;
  padding: 2px;
  background: var(--Linear);
}

.card-inner {
  border-radius: 28px;
  background: linear-gradient(135deg, #0d2820 0%, #051810 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(63, 255, 108, 0.1) 0%, transparent 70%);
    animation: card-glow 4s ease-in-out infinite;
  }
}

@keyframes card-glow {

  0%,
  100% {
    transform: translate(0, 0);
    opacity: 0.3;
  }

  50% {
    transform: translate(20%, 20%);
    opacity: 0.6;
  }
}

/* 转账头部 */
.transfer-header {
  position: relative;
  z-index: 1;
}

.transfer-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(63, 255, 108, 0.2) 0%, rgba(0, 255, 110, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    padding: 2px;
    background: linear-gradient(135deg, #3fff6c 0%, #00ff6e 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
}

.transfer-icon {
  width: 28px;
  height: 28px;
  color: #3fff6c;
}

/* 输入组 */
.input-group {
  position: relative;
  z-index: 1;
}

.input-label {
  .label-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3fff6c;
    box-shadow: 0 0 8px rgba(63, 255, 108, 0.6);
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(63, 255, 108, 0.2);
  transition: all 0.3s ease;

  &:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: #3fff6c;
    box-shadow: 0 0 0 3px rgba(63, 255, 108, 0.1);
  }

  .input-icon {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.4);
    margin-right: 12px;
    flex-shrink: 0;
  }

  .styled-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 24px;
    font-weight: 500;
    font-family: 'Roboto', sans-serif;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

/* 数量控制 */
.amount-control {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(63, 255, 108, 0.2);
}

.control-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  svg {
    width: 24px;
    height: 24px;
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #3fff6c 0%, #00ff6e 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.decrease {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;

    &::before {
      background: linear-gradient(135deg, #ff6b6b 0%, #ff3f3f 100%);
    }

    &:active {
      transform: scale(0.95);

      &::before {
        opacity: 1;
      }

      svg {
        color: #fff;
        transform: scale(1.1);
      }
    }
  }

  &.increase {
    background: rgba(63, 255, 108, 0.15);
    color: #3fff6c;

    &:active {
      transform: scale(0.95);

      &::before {
        opacity: 1;
      }

      svg {
        color: #000;
        transform: scale(1.1);
      }
    }
  }
}

.amount-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;

  .amount-input {
    flex: 1;
    max-width: 200px;
    background: transparent;
    border: none;
    outline: none;
    text-align: center;
    color: #fff;
    font-size: 40px;
    font-weight: 700;
    font-family: 'Roboto', sans-serif;
    text-shadow: 0 2px 8px rgba(63, 255, 108, 0.3);

    &::placeholder {
      color: rgba(255, 255, 255, 0.2);
    }
  }

  .amount-unit {
    font-size: 24px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'PingFang SC', sans-serif;
  }
}

/* 转账提交按钮 */
.transfer-submit-btn {
  width: 100%;
  height: 88px;
  border: none;
  border-radius: 44px;
  background: linear-gradient(135deg, #3fff6c 0%, #00ff6e 100%);
  box-shadow: 0 8px 24px rgba(63, 255, 108, 0.4);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;

  .btn-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    animation: btn-shine 3s infinite;
  }

  .btn-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 600;
    color: #000;
    font-family: 'PingFang SC', sans-serif;
    position: relative;
    z-index: 1;
  }

  .btn-icon {
    width: 24px;
    height: 24px;
    color: #000;
  }

  &:hover {
    box-shadow: 0 12px 32px rgba(63, 255, 108, 0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 4px 16px rgba(63, 255, 108, 0.3);
  }
}

@keyframes btn-shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(200%) rotate(45deg);
  }
}

.address-input,
.amount-input {
  background: rgba(255, 255, 255, 0.1);
}

.input-field {
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

/* 转账记录容器 */
.power-container {
  position: relative;
  border-radius: 30px;
  background: #122626;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px;
    padding: 2px;
    background: var(--Linear);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

/* 转账记录项样式 */
.transfer-item {
  width: 100%;
  padding: 28px 0;

  &:first-child {
    padding-top: 0;
  }
}

/* 数量徽章 */
.amount-badge {
  padding: 8px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.15;
  }

  &.send {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);

    .amount-text {
      color: #ff6b6b;
      font-size: 26px;
      font-weight: 700;
      font-family: 'Roboto', sans-serif;
    }
  }

  &.receive {
    background: rgba(63, 255, 108, 0.1);
    border: 1px solid rgba(63, 255, 108, 0.3);

    .amount-text {
      color: #3fff6c;
      font-size: 26px;
      font-weight: 700;
      font-family: 'Roboto', sans-serif;
    }
  }
}

/* 地址标签 */
.address-tag {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(63, 255, 108, 0.08);
  border: 1px solid rgba(63, 255, 108, 0.15);
  flex-shrink: 0;
}

.line {
  margin-top: 28px;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(63, 255, 108, 0.2) 50%,
      transparent 100%);
}

/* Tab 切换 */
.tabs-wrapper {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.tab-item {
  flex: 1;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  span {
    font-size: 26px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'PingFang SC', sans-serif;
    transition: color 0.3s ease;
  }

  &.active {
    background: linear-gradient(135deg, rgba(63, 255, 108, 0.2) 0%, rgba(0, 255, 110, 0.1) 100%);
    border: 2px solid #3fff6c;

    span {
      color: #3fff6c;
      font-weight: 600;
    }
  }

  &:active {
    transform: scale(0.98);
  }
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

/* List 组件样式 */
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
</style>
