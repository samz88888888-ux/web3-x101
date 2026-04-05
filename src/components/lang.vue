<script setup>
import { ref, defineExpose, onMounted } from 'vue'
import { setLocales, i18n } from '../lang'
import zh from '@/assets/icon/zh.png'
import tw from '@/assets/icon/tw.png'
import en from '@/assets/icon/en.png'
import ko from '@/assets/icon/ko.png'
import ja from '@/assets/icon/ja.png'
import id from '@/assets/icon/id.png'
import vi from '@/assets/icon/vi.png'
import th from '@/assets/icon/th.png'

const { locale, t } = i18n.global
let show = ref(false)
let radio = ref('zh')

// 语言选项配置
const langOptions = [
  {
    value: 'zh',
    label: t('langList.zh'),
    enLabel: 'Simplified Chinese',
    icon: zh
  },
  {
    value: 'tw',
    label: t('langList.tw'),
    enLabel: 'Traditional Chinese',
    icon: tw
  },
  {
    value: 'en',
    label: t('langList.en'),
    enLabel: 'English',
    icon: en
  },
  {
    value: 'kr',
    label: t('langList.kr'),
    enLabel: 'Korean',
    icon: ko
  },
  {
    value: 'ja',
    label: t('langList.ja'),
    enLabel: 'Japanese',
    icon: ja
  },
  {
    value: 'id',
    label: t('langList.id'),
    enLabel: 'Indonesian',
    icon: id
  },
  {
    value: 'vi',
    label: t('langList.vi'),
    enLabel: 'Vietnamese',
    icon: vi
  },
  {
    value: 'th',
    label: t('langList.th'),
    enLabel: 'Thai',
    icon: th
  }
]

let open = () => {
  show.value = true
}

onMounted(() => {
  radio.value = localStorage.lang || 'zh'
})

let onRadioChange = (lang) => {
  radio.value = lang // 更新选中状态
  setLocales(lang)
  locale.value = lang
  show.value = false
  
  // 刷新页面以应用新语言
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

defineExpose({
  open
})
</script>
<!-- --van-popup-close-icon-color -->
<!-- van-popup v-model:show="show" position="bottom" round closeable @close="() => { }" safe-area-inset-bottom -->
<template>
  <van-popup 
    position="bottom" 
    :show="show" 
    round
    :style="{ background: 'transparent' }"
    @close="show = false">
    <div class="lang-selector">
      <!-- 顶部指示条 -->
      <div class="drag-indicator"></div>
      
      <!-- 标题 -->
      <div class="lang-header">
        <!-- <div class="header-icon">🌐</div> -->
        <h3>{{ t('langList.selectLanguage') || '选择语言' }}</h3>
      </div>

      <!-- 语言选项 -->
      <div class="lang-options">
        <div 
          v-for="option in langOptions" 
          :key="option.value" 
          class="lang-option"
          :class="{ active: radio === option.value }" 
          @click="onRadioChange(option.value)">
          <!-- 左侧：旗帜图标 -->
          <div class="flag-wrapper">
            <img :src="option.icon" :alt="option.label" class="lang-flag" />
          </div>
          
          <!-- 中间：语言名称 -->
          <div class="lang-content">
            <span class="lang-text">{{ option.label }}</span>
            <!-- <span class="lang-subtext">{{ option.enLabel }}</span> -->
          </div>
          
          <!-- 右侧：选中图标 -->
          <div class="check-wrapper" v-if="radio === option.value">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="url(#gradient)" />
              <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ff3f85;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8a04ff;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="check-circle" v-else></div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<style scoped lang="scss">
.lang-selector {
  position: relative;
  background: linear-gradient(180deg, #1a0b2e 0%, #0f0518 100%);
  border-radius: 40px 40px 0 0;
  padding: 20px 30px 40px;
  min-height: 380px;
  
  /* 渐变边框效果 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #ff3f85 0%, #8a04ff 50%, #ff3f85 100%);
    border-radius: 40px 40px 0 0;
  }
}

/* 顶部拖拽指示条 */
.drag-indicator {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin: 0 auto 30px;
}

/* 标题区域 */
.lang-header {
  text-align: center;
  margin-bottom: 32px;
  
  .header-icon {
    font-size: 48px;
    margin-bottom: 12px;
    animation: rotate 3s linear infinite;
  }

  h3 {
    margin: 0;
    font-size: 32px;
    font-weight: 600;
    color: #fff;
    font-family: 'PingFang SC', sans-serif;
  }
}

@keyframes rotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(15deg);
  }
}

/* 语言选项列表 */
.lang-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 单个语言选项 */
.lang-option {
  position: relative;
  display: flex;
  align-items: center;
  padding: 24px 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  /* 悬停发光效果 */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 3, 164, 0.2) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:active {
    transform: scale(0.98);
  }

  /* 选中状态 */
  &.active {
    background: linear-gradient(135deg, rgba(249, 3, 164, 0.15) 0%, rgba(138, 4, 255, 0.15) 100%);
    border-color: #f903a4;
    box-shadow: 
      0 0 20px rgba(249, 3, 164, 0.3),
      inset 0 0 20px rgba(249, 3, 164, 0.1);
    
    &::after {
      width: 300px;
      height: 300px;
    }
    
    .lang-text {
      color: #f903a4;
      font-weight: 600;
    }
  }
  
  &:not(.active):hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
  }
}

/* 旗帜图标容器 */
.flag-wrapper {
  position: relative;
  flex-shrink: 0;
  margin-right: 20px;
  
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff3f85 0%, #8a04ff 100%);
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s;
  }
  
  .active & {
    &::after {
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

.lang-flag {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  
  .active & {
    border-color: #f903a4;
    transform: scale(1.05);
  }
}

/* 语言内容 */
.lang-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lang-text {
  font-size: 28px;
  color: #fff;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
  transition: all 0.3s;
  line-height: 1.2;
}

.lang-subtext {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  transition: all 0.3s;
  
  .active & {
    color: rgba(249, 3, 164, 0.7);
  }
}

/* 选中图标容器 */
.check-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkIn 0.3s ease-out;
  
  svg {
    filter: drop-shadow(0 2px 8px rgba(249, 3, 164, 0.5));
  }
}

/* 未选中的圆圈 */
.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  transition: all 0.3s;
  
  .lang-option:hover & {
    border-color: rgba(255, 255, 255, 0.5);
  }
}

/* 动画效果 */
@keyframes checkIn {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

/* Popup 覆盖样式 */
:deep(.van-popup) {
  background: transparent !important;
  overflow: visible;
}

:deep(.van-overlay) {
  background-color: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(8px);
}
</style>