<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast } from 'vant'
import { formatNumber } from '@/utils/format'

const { t } = useI18n()

// 列表数据
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const total = ref(0)

// 添加一个标志，用于判断是否需要清空列表
const shouldClearList = ref(false)

// 添加加载锁，防止并发请求
const isLoadingData = ref(false)

// 分页参数
const params = ref({
  page: 1,
  page_size: 20
})

// 格式化地址
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 加载数据
const getDirectIncomeLog = async () => {
  // 如果正在加载，直接返回，防止并发请求
  if (isLoadingData.value) {
    console.log('已有请求在进行中，跳过本次请求')
    return
  }

  isLoadingData.value = true

  try {
    // 构建请求参数
    const requestParams = {
      page: params.value.page,
      page_size: params.value.page_size
    }

    console.log('发送请求，页码:', params.value.page, '参数:', requestParams)

    const res = await api.wallet.getDirectIncomeLog(requestParams)

    if (res?.list) {
      // 如果是下拉刷新、需要清空列表或第一页，清空列表
      if (refreshing.value || shouldClearList.value || params.value.page === 1) {
        console.log('清空并替换列表，数据条数:', res.list.length)
        list.value = res.list
        refreshing.value = false
        shouldClearList.value = false
      } else {
        // 否则追加数据
        console.log('追加数据，原有:', list.value.length, '新增:', res.list.length)
        list.value = [...list.value, ...res.list]
      }

      total.value = res.total || 0

      // 加载成功后,页码+1,准备下次加载
      params.value.page++

      // 判断是否已加载完所有数据
      if (list.value.length >= total.value) {
        finished.value = true
      }

      loading.value = false
    } else {
      finished.value = true
      loading.value = false
    }
  } catch (error) {
    console.error('获取直推收益记录失败:', error)
    showToast(error.message || '获取直推收益记录失败')
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

  // 如果正在切换标签，跳过自动加载
  if (shouldClearList.value) {
    return
  }

  getDirectIncomeLog()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  params.value.page = 1
  list.value = []
  getDirectIncomeLog()
}
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="power-container mt-37 w-100% flex-col pt-37 px-30 pb-195 items-start justify-center">
        <div class="flex items-center justify-between">
          <span class="block fsize-28 font-miSans font-630 text-[#fff] leading-none">
            {{ t('wallet.total') }}: {{ total }} {{ t('wallet.records') }}
          </span>
        </div>
        <div class="line"></div>

        <div class="log-list flex flex-col items-start justify-center gap-24 pt-28">
          <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
            <van-list v-model:loading="loading" :finished="finished"
              :finished-text="list.length > 0 ? t('wallet.noMore') : ''" @load="onLoad" class="list-wrapper">
              <!-- 空状态 -->
              <div v-if="list.length === 0 && !loading" class="empty-state">
                <van-empty :description="t('wallet.noData')" />
              </div>

              <!-- 列表项 -->
              <div v-for="(item, index) in list" :key="index"
                class="w-100% flex flex-col mt-20 items-start justify-center">
                <div class="flex w-100% items-center justify-between">
                  <div class="flex flex-col gap-16 items-start justify-center">
                    <div class="flex items-center justify-center gap-7">
                      <span class="fsize-26 font-miSans font-380 text-[#fff] leading-none">
                        {{ t('wallet.directIncome') }}
                      </span>
                    </div>
                    <!-- 来源地址 -->
                    <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">
                      {{ t('wallet.fromAddress') }}: {{ formatAddress(item.source_address) }}
                    </span>
                    <!-- 时间 -->
                    <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">
                      {{ item.created_at }}
                    </span>
                  </div>
                  <span class="fsize-26 font-miSans font-630 leading-none text-[#16FFC2]">
                    +{{ formatNumber(item.amount, 3) }} PYTHIA
                  </span>
                </div>
                <div class="line"></div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #fdfdfd;
  background: url('@/assets/imgs/power/power-log-bg.png') no-repeat top center;

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

  .body {
    width: 100%;
    padding: 10px 30px 300px;
    position: relative;
  }

  .power-container {
    position: relative;
    border-radius: 30px;
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

  .line {
    margin-top: 24px;
    width: 100%;
    height: 1px;
    opacity: 0.1;
    background: #fff;
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

  /* Vant List 组件样式覆盖 */
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
        color: #00ff6e;
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

      .van-loading__spinner {
        color: #00ff6e;
      }
    }
  }
}
</style>
