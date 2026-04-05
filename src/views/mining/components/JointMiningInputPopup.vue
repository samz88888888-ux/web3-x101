<template>
  <van-popup
    :show="show"
    position="bottom"
    :style="{ background: 'transparent', padding: '0 26px 72px' }"
    :overlay-style="{ backdropFilter: 'blur(4px)' }"
    @click-overlay="closePopup">
    <div class="liquidity-popup">
      <div class="flex items-center justify-between w-100%">
        <!-- 标题 -->
        <div class="popup-title">{{ t('miningPopup.invest') }} {{ packageName }}</div>
        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closePopup">
          <van-icon name="cross" size="24" color="#fff" />
        </div>
      </div>
      <div class="box-line mt-27 mb-44 w-100% bg-[#fff] opacity-25 h-2"></div>

      <!-- 输入数量 -->
      <div class="section-title">{{ t('miningPopup.investQuantity') }}</div>
      <div class="input-box">
        <input
          v-model="inputAmount"
          type="number"
          :placeholder="t('miningPopup.pleaseEnterUSDTQuantity')"
          class="amount-input"
          @input="handleInput" />
        <span class="unit">USDT</span>
      </div>
      <div class="min-tip">
        {{ t('miningPopup.minimumInvest') }}: {{ formatNumber(minAmount, 3) }} USDT
      </div>

      <!-- 投资信息 -->
      <div class="section-title mt-32">{{ t('miningPopup.investInformation') }}</div>
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">{{ t('miningPopup.powerRate') }}</span>
          <span class="info-value highlight">{{ powerRate }}</span>
        </div>
        <!-- <div v-if="inputAmount" class="info-item">
          <span class="info-label">预计算力</span>
          <span class="info-value">{{ expectedPower }}</span>
        </div> -->
      </div>

      <!-- 确定按钮 -->
      <div
        @click="handleConfirm"
        :class="['confirm-btn', { disabled: !canSubmit, loading: loading }]">
        <van-loading v-if="loading" color="#fff" size="24" />
        <span v-else>{{ t('miningPopup.confirmInvest') }}</span>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { formatNumber } from '@/utils/format'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  packageInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const inputAmount = ref('')
const loading = ref(false)

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 组合信息
const packageName = computed(() => props.packageInfo?.name || '')
const minAmount = computed(() => props.packageInfo?.min_amount || '0')
const powerRate = computed(
  () => props.packageInfo?.power_rate_display || props.packageInfo?.power_rate + 'x' || '0x'
)

// 预计算力
const expectedPower = computed(() => {
  const amount = parseFloat(inputAmount.value) || 0
  const rate = parseFloat(props.packageInfo?.power_rate || 1)
  return (amount * rate).toFixed(2)
})

// 是否可以提交
const canSubmit = computed(() => {
  const amount = parseFloat(inputAmount.value) || 0
  const min = parseFloat(minAmount.value) || 0
  return amount >= min && !loading.value
})

// 输入处理
const handleInput = (e) => {
  const value = e.target.value
  // 只保留数字和小数点
  inputAmount.value = value.replace(/[^\d.]/g, '')
}

// 确定
const handleConfirm = () => {
  if (!canSubmit.value) {
    showToast(`最低投资额为 ${minAmount.value} USDT`)
    return
  }

  emit('confirm', inputAmount.value)
}

// 监听弹窗关闭,清空输入
watch(
  () => props.show,
  (val) => {
    if (!val) {
      inputAmount.value = ''
      loading.value = false
    }
  }
)

// 暴露 loading 状态给父组件控制
defineExpose({
  setLoading: (val) => {
    loading.value = val
  }
})
</script>

<style lang="scss" scoped>
/* 弹窗容器 */
.liquidity-popup {
  position: relative;
  width: 100%;
  padding: 35px 30px 47px;
  border-radius: 40px;
  background: #122626;

  /* 渐变边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 40px;
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

  > * {
    position: relative;
    z-index: 1;
  }
}

/* 关闭按钮 */
.close-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s ease;
  &:active {
    transform: scale(0.9);
  }
}

/* 标题 */
.popup-title {
  font-size: 36px;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

/* 小标题 */
.section-title {
  font-size: 32px;
  font-family: Roboto, sans-serif;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20px;

  &.mt-32 {
    margin-top: 32px;
  }
}

/* 输入框 */
.input-box {
  display: flex;
  width: 100%;
  height: 100px;
  padding: 0 30px;
  background: rgba(255, 154, 252, 0.1);
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-radius: 20px;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;

  &:focus-within {
    border-color: #00ff6e;
  }

  .amount-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 32px;
    font-weight: 600;
    color: #fff;
    font-family: 'Roboto', sans-serif;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
      font-weight: 400;
    }

    /* 移除数字输入框的上下箭头 */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }

  .unit {
    font-size: 28px;
    font-family: Roboto, sans-serif;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1;
  }
}

/* 最低投资提示 */
.min-tip {
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 24px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1;
}

/* 投资信息卡片 */
.info-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 24px 30px;
  background: rgba(255, 154, 252, 0.1);
  border-radius: 20px;

  .info-label {
    font-size: 26px;
    font-family: Roboto, sans-serif;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1;
  }

  .info-value {
    font-size: 28px;
    font-family: Roboto, sans-serif;
    font-weight: 700;
    color: #fff;
    line-height: 1;

    &.highlight {
      color: #ffcd05;
    }
  }
}

/* 确定按钮 */
.confirm-btn {
  width: 100%;
  height: 88px;
  border-radius: 8888px;
  background: #00ff6e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  span {
    font-size: 32px;
    font-family: Roboto, sans-serif;
    font-weight: 600;
    color: #000;
    line-height: 1;
  }

  &:active {
    transform: scale(0.98);
    background: #00ff6e;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.loading {
    opacity: 0.8;
    pointer-events: none;
  }
}
</style>
