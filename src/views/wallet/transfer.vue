<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIndexStore } from '@/store'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatNumber } from '@/utils/format'
import x101Icon from '@/assets/imgs/coin/x101-coin-old.png'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import Footer from '@/components/footer.vue'

const { t } = useI18n()
const store = useIndexStore()

const transferAddress = ref('')
const transferAmount = ref('')
const recordTab = ref('all')
const transferRecords = ref([])
const isSubmitting = ref(false)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)
const isLoadingData = ref(false)
const params = ref({
  page: 1,
  page_size: 20
})

const x101Balance = computed(() => {
  return store.userInfo?.balance_list?.x101_balance || 0
})

const formattedBalance = computed(() => {
  return formatNumber(x101Balance.value, 3)
})

const init = async () => {
  try {
    await store.fetchUserInfo()
    await getTransferList()
  } catch (error) {
    showToast(error.message || t('wallet.getTransferInfoFailed'))
  }
}

onMounted(() => {
  init()
})

const handleAmountInput = (event) => {
  let value = event.target.value
  value = value.replace(/[^\d.]/g, '')

  const firstDotIndex = value.indexOf('.')
  if (firstDotIndex !== -1) {
    value = `${value.slice(0, firstDotIndex + 1)}${value.slice(firstDotIndex + 1).replace(/\./g, '')}`
  }

  if (!value) {
    transferAmount.value = ''
    event.target.value = ''
    return
  }

  if (value.startsWith('.')) {
    value = `0${value}`
  }

  const [integerPart = '', decimalPart] = value.split('.')
  const normalizedIntegerPart = integerPart.replace(/^0+(?=\d)/, '') || '0'
  value = decimalPart !== undefined ? `${normalizedIntegerPart}.${decimalPart}` : normalizedIntegerPart

  transferAmount.value = value
  event.target.value = value
}

const handleMax = () => {
  transferAmount.value = String(x101Balance.value || '0')
}

const getTransferType = () => {
  if (recordTab.value === 'out') return '1'
  if (recordTab.value === 'in') return '2'
  return ''
}

const getDirectionType = (item) => {
  const directionText = String(item?.direction_text || '').toLowerCase()

  if (item?.direction === '1' || item?.direction === 1 || item?.direction === 'out') return 'out'
  if (item?.direction === '2' || item?.direction === 2 || item?.direction === 'in') return 'in'
  if (directionText.includes('out') || item?.direction_text?.includes('转出')) return 'out'
  if (directionText.includes('in') || item?.direction_text?.includes('转入')) return 'in'
  return 'out'
}

const getDirectionText = (item) => {
  if (item?.direction_text) return item.direction_text
  return getDirectionType(item) === 'out' ? t('wallet.transferOut') : t('wallet.transferIn')
}

const getDirectionAmount = (item) => {
  const prefix = getDirectionType(item) === 'out' ? '-' : '+'
  return `${prefix}${formatNumber(item?.amount || 0, 3)}`
}

const getDirectionColor = (item) => {
  return getDirectionType(item) === 'out' ? '#FF8A65' : '#16FFC2'
}

const formatAddress = (address) => {
  if (!address) return '--'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getTransferList = async () => {
  if (isLoadingData.value) return

  isLoadingData.value = true

  try {
    const requestParams = {
      page: params.value.page.toString(),
      page_size: params.value.page_size.toString()
    }

    const transferType = getTransferType()
    if (transferType) {
      requestParams.transfer_type = transferType
    }

    const res = await api.transfer.transferList(requestParams)

    if (res?.list) {
      if (refreshing.value || params.value.page === 1) {
        transferRecords.value = res.list
        refreshing.value = false
      } else {
        transferRecords.value = [...transferRecords.value, ...res.list]
      }

      total.value = res.total || 0
      params.value.page += 1
      finished.value = transferRecords.value.length >= total.value
      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    showToast(error.message || t('wallet.getTransferListFailed'))
    finished.value = true
    loading.value = false
  } finally {
    isLoadingData.value = false
  }
}

const handleTabChange = (tab) => {
  if (recordTab.value === tab) return

  recordTab.value = tab
  transferRecords.value = []
  finished.value = false
  loading.value = false
  params.value.page = 1
  getTransferList()
}

const onLoad = () => {
  if (refreshing.value) return
  getTransferList()
}

const onRefresh = () => {
  refreshing.value = true
  finished.value = false
  params.value.page = 1
  transferRecords.value = []
  getTransferList()
}

const handleSubmit = async () => {
  if (!transferAddress.value.trim()) {
    showToast(t('wallet.pleaseEnterTransferAddress'))
    return
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(transferAddress.value.trim())) {
    showToast(t('wallet.pleaseEnterValidWalletAddress'))
    return
  }

  const amount = parseFloat(transferAmount.value)

  if (!transferAmount.value || Number.isNaN(amount) || amount <= 0) {
    showToast(t('wallet.pleaseEnterTransferAmount'))
    return
  }

  if (amount > parseFloat(x101Balance.value || 0)) {
    showToast(t('wallet.transferBalanceNotEnough'))
    return
  }

  isSubmitting.value = true
  try {
    showLoadingToast({
      message: t('wallet.transferring'),
      duration: 0,
      forbidClick: true
    })

    await api.transfer.executeTransfer({
      address: transferAddress.value.trim(),
      num: transferAmount.value
    })

    closeToast()
    showToast(t('wallet.transferSuccess'))

    transferAddress.value = ''
    transferAmount.value = ''

    await store.fetchUserInfo()
    refreshing.value = false
    finished.value = false
    params.value.page = 1
    transferRecords.value = []
    await getTransferList()
  } catch (error) {
    closeToast()
    showToast(error.message || t('wallet.transferFailed'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container">
    <div class="body">
      <div class="page-header flex items-center justify-between">
        <div class="flex gap-12 items-center">
          <div class="title-badge"></div>
          <span class="page-title">{{ t('wallet.transfer') }}</span>
        </div>
        <!-- <div class="record-button" @click="router.push('/walletLog')">
          <span class="record-text">资金记录</span>
          <van-icon name="arrow" size="14" color="#00FF6E" />
        </div> -->
      </div>

      <div class="transfer-card">
        <div class="token-row">
          <div class="token-info">
            <van-image width="40" height="40" :src="x101Icon" fit="contain"></van-image>
            <div class="flex flex-col gap-6">
              <span class="token-name">X101</span>
              <div class="balance-row">
                <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
                <span class="balance-text">{{ t('wallet.dappX101Balance') }}: {{ formattedBalance }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-block">
          <span class="field-label">{{ t('wallet.transferOutAddress') }}</span>
          <div class="input-shell">
            <input v-model="transferAddress" type="text" :placeholder="t('wallet.pleaseEnterReceiveAddress')"
              class="field-input" />
          </div>
        </div>

        <div class="form-block">
          <span class="field-label">{{ t('wallet.transferAmount') }}</span>
          <div class="input-shell amount-shell">
            <input v-model="transferAmount" type="text" inputmode="numeric"
              :placeholder="t('wallet.pleaseEnterTransferAmount')" class="field-input" @input="handleAmountInput" />
            <button type="button" class="max-btn close-btn-text" @click="handleMax">MAX</button>
          </div>
        </div>

        <button type="button" class="submit-btn close-btn-text" :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? t('wallet.submitting') : t('wallet.immediatelyTransfer') }}
        </button>
      </div>

      <div class="record-card">
        <div class="record-header flex items-center justify-between">
          <div class="flex gap-12 items-center">
            <div class="title-badge small"></div>
            <span class="record-title">{{ t('wallet.transferRecord') }}</span>
          </div>
          <span class="record-count">{{ t('wallet.transferRecordTotal', { count: transferRecords.length }) }}</span>
        </div>

        <div class="record-tabs">
          <button type="button" class="record-tab" :class="{ active: recordTab === 'all' }"
            @click="handleTabChange('all')">
            {{ t('wallet.all') }}
          </button>
          <button type="button" class="record-tab" :class="{ active: recordTab === 'out' }"
            @click="handleTabChange('out')">
            {{ t('wallet.transferOut') }}
          </button>
          <button type="button" class="record-tab" :class="{ active: recordTab === 'in' }"
            @click="handleTabChange('in')">
            {{ t('wallet.transferIn') }}
          </button>
        </div>

        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list v-model:loading="loading" :finished="finished"
            :finished-text="transferRecords.length > 0 ? t('wallet.noMore') : ''" @load="onLoad" class="record-list">
            <van-empty v-if="transferRecords.length === 0 && !loading" :description="t('wallet.noTransferRecord')" />

            <div v-for="item in transferRecords" :key="item.id || item.order_no" class="record-item">
              <div class="record-item-header">
                <div class="record-item-main">
                  <span class="record-direction" :style="{ color: getDirectionColor(item) }">
                    {{ getDirectionText(item) }}
                  </span>
                  <span class="record-amount" :style="{ color: getDirectionColor(item) }">
                    {{ getDirectionAmount(item) }} {{ item.currency || 'X101' }}
                  </span>
                </div>
                <span class="record-time">{{ item.created_at || '--' }}</span>
              </div>

              <div class="record-item-body">
                <span class="record-line">{{ t('wallet.counterpartyAddress') }}：{{
                  formatAddress(item.other_user?.address) }}</span>
                <span class="record-line">{{ t('wallet.orderNumber') }}：{{ item.order_no || '--' }}</span>
                <span class="record-line">{{ t('wallet.fee') }}：{{ formatNumber(item.fee_amount || 0, 3) }} {{
                  item.currency || 'X101'
                  }}</span>
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </div>
    </div>
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
}

.body {
  width: 100%;
  padding: 20px 30px 290px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.page-header {
  margin-top: 20px;
}

.title-badge {
  width: 7px;
  height: 30px;
  border-radius: 999px;
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
}

.title-badge.small {
  height: 24px;
}

.page-title,
.record-title {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  font-family: 'PingFang SC', sans-serif;
}

.record-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 255, 110, 0.35);
  background: rgba(0, 255, 110, 0.08);
}

.record-text,
.record-count {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.72);
  font-family: 'PingFang SC', sans-serif;
}

.transfer-card,
.record-card {
  position: relative;
  padding: 32px 28px 60px;
  border-radius: 28px;
  background: rgba(10, 24, 29, 0.92);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 28px;
    padding: 1px;
    background: linear-gradient(334deg, rgba(63, 255, 108, 0.8) 9.54%, rgba(255, 255, 255, 0.6) 97.8%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.token-row {
  margin-bottom: 28px;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.token-name {
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
}

.balance-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-text {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.66);
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.field-label {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.88);
  font-family: 'PingFang SC', sans-serif;
}

.input-shell {
  display: flex;
  align-items: center;
  min-height: 88px;
  padding: 0 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.amount-shell {
  gap: 16px;
}

.field-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 28px;
  font-family: 'Roboto', sans-serif;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
}

.max-btn {
  min-width: 90px;
  height: 52px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 255, 110, 0.16);
  color: #00ff6e;
  font-size: 22px;
}

.submit-btn {
  width: 100%;
  height: 88px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
  color: #02151d;
  font-size: 34px;
  font-weight: 600;

  &:disabled {
    opacity: 0.55;
  }
}

.record-header {
  margin-bottom: 24px;
}

.record-tabs {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.record-tab {
  min-width: 110px;
  height: 58px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.68);
  font-size: 22px;
  font-family: 'PingFang SC', sans-serif;

  &.active {
    background: linear-gradient(180deg, #00ff6e 0%, #009543 100%);
    color: #02151d;
    font-weight: 600;
  }
}

.record-list {
  min-height: 220px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.03);
  padding: 0 18px 18px;
}

.record-item {
  padding: 24px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.record-item:last-child {
  border-bottom: none;
}

.record-item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.record-item-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-direction {
  font-size: 24px;
  font-weight: 600;
}

.record-amount {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}

.record-time {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.48);
  white-space: nowrap;
}

.record-item-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.record-line {
  font-size: 22px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.68);
}
</style>
