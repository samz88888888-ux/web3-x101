<script setup>
import { ref, defineExpose, defineProps, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
import { showToast, showLoadingToast, closeToast } from 'vant'
import config from '@/config'
import useWeb3 from '@/utils/useWeb3'
import logoIcon from '@/assets/imgs/logo.png'
const { t } = useI18n()
let show = ref(false)
let isProcessing = ref(false) // 是否正在处理中

let open = () => {
  show.value = true
}

// 检查链是否已添加到钱包
const checkChainExists = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: config.network.chainId }]
    })
    return true // 链已存在，切换成功
  } catch (switchError) {
    // 错误码 4902 表示链未添加
    if (switchError.code === 4902) {
      return false // 链不存在
    }
    // 用户拒绝切换
    if (switchError.code === 4001) {
      throw new Error('用户拒绝切换网络')
    }
    throw switchError
  }
}

// 添加链到钱包
const addChainToWallet = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: config.network.chainId,
          chainName: config.network.chainName,
          nativeCurrency: {
            name: config.network.nativeCurrency.name,
            symbol: config.network.nativeCurrency.symbol,
            decimals: config.network.nativeCurrency.decimals
          },
          rpcUrls: config.network.rpcUrls,
          blockExplorerUrls: config.network.blockExplorerUrls
        }
      ]
    })
    return true
  } catch (addError) {
    // 用户拒绝添加
    if (addError.code === 4001) {
      throw new Error('用户拒绝添加网络')
    }
    throw addError
  }
}

// 自动切换或添加链
let handleSwitchChain = async () => {
  if (isProcessing.value) return

  isProcessing.value = true
  
  try {
    showLoadingToast({
      message: '检查网络...',
      duration: 0,
      forbidClick: true
    })

    await useWeb3.ensureReady()

    console.log('=========== 开始切换/添加链 ===========')
    console.log('目标链ID:', config.network.chainId)
    console.log('当前链ID:', window.ethereum.chainId)

    // 1. 先尝试切换链（如果链已存在）
    showLoadingToast({
      message: '尝试切换网络...',
      duration: 0,
      forbidClick: true
    })

    const chainExists = await checkChainExists()

    if (chainExists) {
      // 链已存在且切换成功
      console.log('✅ 链已存在，切换成功')
      closeToast()
      showToast('网络切换成功')
      
      // 延迟关闭弹窗并触发确认事件
      setTimeout(() => {
        show.value = false
        emit('confirm')
      }, 500)
      
      return
    }

    // 2. 链不存在，提示用户添加
    console.log('⚠️ 链不存在，开始添加...')
    showLoadingToast({
      message: '添加网络中...',
      duration: 0,
      forbidClick: true
    })

    const addSuccess = await addChainToWallet()

    if (addSuccess) {
      console.log('✅ 链添加成功')
      closeToast()
      showToast('网络添加成功')
      
      // 延迟关闭弹窗并触发确认事件
      setTimeout(() => {
        show.value = false
        emit('confirm')
      }, 500)
    }

    console.log('=====================================')
  } catch (error) {
    console.error('切换/添加链失败:', error)
    closeToast()
    
    if (error.message.includes('拒绝')) {
      showToast(error.message)
    } else {
      showToast('网络切换失败，请手动切换')
    }
  } finally {
    isProcessing.value = false
  }
}

// 手动重新检测（不自动切换，仅检查）
let handleRecheck = async () => {
  try {
    await useWeb3.ensureReady()
    if (window.ethereum.chainId == config.network.chainId) {
      show.value = false
      emit('confirm')
      showToast('网络检测通过')
    } else {
      showToast('当前仍未切换到正确网络')
    }
  } catch (error) {
    console.error('重新检测失败:', error)
  }
}

let props = defineProps({
  title: {
    type: String,
    default: '标题'
  },
  cancelText: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: ''
  }
})

let emit = defineEmits(['confirm'])

defineExpose({
  open
})
</script>

<template>
  <van-overlay
    z-index="99"
    :custom-style="{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.7)' }"
    :show="show">
    <div class="wrapper">
      <div class="network-error-popup">
        <!-- 警告图标 -->
        <div class="icon-container">
          <div class="warning-icon">
            <!-- <van-image width="80" height="80" :src="logoIcon" fit="contain"></van-image> -->
          </div>
        </div>

        <!-- 标题 -->
        <h3 class="popup-title">网络错误</h3>

        <!-- 描述 -->
        <p class="popup-desc">
          当前钱包网络不匹配，请切换到 {{ config.network.chainName }} 网络以继续使用
        </p>

        <!-- 网络信息卡片 -->
        <div class="chain-info-card">
          <div class="info-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#iconGradient)" opacity="0.8"/>
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#iconGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ff3f85;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8a04ff;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            <span class="info-header-text">网络信息</span>
          </div>
          
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">网络名称</span>
              <span class="info-value">{{ config.network.chainName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">链 ID</span>
              <span class="info-value">{{ config.network.chainId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">RPC URL</span>
              <span class="info-value">{{ config.network.rpcUrls[0] }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">区块浏览器</span>
              <span class="info-value">{{ config.network.blockExplorerUrls[0] }}</span>
            </div>
          </div>
        </div>

        <!-- 提示文字 -->
        <p class="tip-text">
          💡 点击下方按钮，系统将自动为您切换或添加网络
        </p>

        <!-- 按钮组 -->
        <div class="button-group">
          <div 
            class="action-btn primary-btn" 
            @click="handleSwitchChain"
            :class="{ disabled: isProcessing }">
            <svg v-if="!isProcessing" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10M3 10L6 7M3 10L6 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10M17 10L14 13M17 10L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isProcessing ? '处理中...' : '一键切换网络' }}</span>
          </div>
          
          <div 
            class="action-btn secondary-btn" 
            @click="handleRecheck"
            :class="{ disabled: isProcessing }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3V6M10 14V17M17 10H14M6 10H3M15.364 4.636L13.243 6.757M6.757 13.243L4.636 15.364M15.364 15.364L13.243 13.243M6.757 6.757L4.636 4.636" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>重新检测</span>
          </div>
        </div>
      </div>
    </div>
  </van-overlay>
</template>

<style scoped lang="scss">
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 40px;
}

.network-error-popup {
  position: relative;
  width: 100%;
  max-width: 626px;
  padding: 60px 50px 60px;
  border-radius: 40px;
  background: linear-gradient(180deg, #000 0%, #450047 100%);
  box-sizing: border-box;

  /* 渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 40px;
    padding: 2px;
    background: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* 图标容器 */
.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  
  .warning-icon {
    animation: iconPulse 2s ease-in-out infinite;
    
    svg {
      filter: drop-shadow(0 4px 20px rgba(249, 3, 164, 0.4));
    }
  }
}

/* 标题 */
.popup-title {
  font-size: 44px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  margin: 0 0 24px 0;
  text-align: center;
  background: linear-gradient(135deg, #ff3f85 0%, #c77dff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 描述文字 */
.popup-desc {
  font-size: 26px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  text-align: center;
  margin: 0 0 32px 0;
}

/* 网络信息卡片 */
.chain-info-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  .info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .info-header-text {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      font-family: 'PingFang SC', sans-serif;
    }
  }
  
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    
    .info-label {
      font-size: 24px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      font-family: 'PingFang SC', sans-serif;
    }
    
    .info-value {
      font-size: 24px;
      font-weight: 500;
      color: #fff;
      text-align: right;
      word-break: break-all;
      font-family: 'Roboto', sans-serif;
    }
  }
}

/* 提示文字 */
.tip-text {
  font-size: 22px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
  text-align: center;
  margin: 0 0 36px 0;
}

/* 按钮组 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 按钮基础样式 */
.action-btn {
  width: 100%;
  height: 88px;
  border-radius: 8888px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  font-size: 32px;
  font-family: 'Roboto', sans-serif;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  
  svg {
    flex-shrink: 0;
  }
  
  span {
    line-height: 1;
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  &:active:not(.disabled) {
    transform: scale(0.98);
  }
}

/* 主按钮 */
.primary-btn {
  background: #f903a4;
  color: #fff;
  box-shadow: 0 8px 24px rgba(249, 3, 164, 0.4);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover:not(.disabled)::before {
    opacity: 1;
  }
  
  &:active:not(.disabled) {
    background: #d8038a;
    box-shadow: 0 4px 16px rgba(249, 3, 164, 0.6);
  }
}

/* 次要按钮 */
.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 30px;
  
  &:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:active:not(.disabled) {
    background: rgba(255, 255, 255, 0.08);
  }
}

/* 图标脉冲动画 */
@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .wrapper {
    padding: 30px;
  }
  
  .network-error-popup {
    max-width: 90%;
    padding: 50px 40px 50px;
    border-radius: 30px;
  }
  
  .popup-title {
    font-size: 38px;
  }
  
  .popup-desc {
    font-size: 24px;
  }
  
  .chain-info-card {
    padding: 24px;
    
    .info-header-text {
      font-size: 26px;
    }
    
    .info-item {
      .info-label,
      .info-value {
        font-size: 22px;
      }
    }
  }
  
  .tip-text {
    font-size: 20px;
  }
  
  .action-btn {
    height: 80px;
    font-size: 28px;
  }
  
  .secondary-btn {
    font-size: 26px;
  }
}
</style>
