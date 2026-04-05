<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast } from 'vant'
import { formatNumber } from '@/utils/format'
import dotIcon from '@/assets/imgs/power/dot.svg'
import checkedIcon from '@/assets/imgs/power/checked.svg'

const { t } = useI18n()

// 列表数据
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// 分页参数
const params = ref({
  page: 1,
  page_size: 20
})

// 总条数
const total = ref(0)

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  // 如果是时间戳格式,需要转换
  // 如果已经是格式化的字符串,直接返回
  return timeStr
}

// 加载数据
const getPowerLog = async () => {
  try {
    const res = await api.power.powerOrderList(params.value)

    if (res?.list) {
      // 如果是下拉刷新,清空列表
      if (refreshing.value) {
        list.value = res.list
        refreshing.value = false
      } else {
        // 否则追加数据
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
    console.error('获取认购记录失败:', error)
    showToast(error.message || '获取认购记录失败')
    finished.value = true
    loading.value = false
  }
}

// 上拉加载
const onLoad = () => {
  if (refreshing.value) {
    return
  }

  getPowerLog()
}

// 下拉刷新
const onRefresh = () => {
  // 重置状态
  finished.value = false
  params.value.page = 1
  list.value = []

  getPowerLog()
}

onMounted(() => {
  // 组件挂载时不做任何操作
  // van-list 会自动触发 onLoad
})
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="power-container mt-37 w-100% flex-col pt-37 px-30 pb-40 items-start justify-center">
        <div class="flex items-center justify-between w-100% mb-24">
          <span class="fsize-28 font-miSans font-630 text-[#fff] leading-none">{{
            t('power.powerPurchaseRecord')
          }}</span>
          <span class="fsize-22 font-miSans font-400 text-[#fff] leading-none opacity-60">
            {{ t('power.powerPurchaseRecordTotal', { count: total }) }}
          </span>
        </div>
        <div class="line"></div>

        <!-- 使用 Vant List 组件实现上拉加载和下拉刷新 -->
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="w-100%">
          <van-list v-model:loading="loading" :finished="finished" :finished-text="list.length > 0 ? '没有更多了' : ''"
            @load="onLoad" class="log-list">
            <!-- 空状态 -->
            <div v-if="list.length === 0 && !loading" class="empty-state">
              <van-empty description="暂无认购记录" />
            </div>

            <!-- 列表项 -->
            <div v-for="(item, index) in list" :key="item.id || index"
              class="w-100% flex flex-col items-start justify-center">
              <div class="flex mt-24 w-100% items-start justify-between">
                <div class="flex flex-col gap-10 items-start justify-center flex-1">
                  <div class="flex items-center gap-8">
                    <span class="fsize-26 font-miSans font-500 text-[#fff] leading-none">认购 {{
                      formatNumber(item.base_amount || 0, 3) }} U</span>
                    <span class="pay-badge px-10 py-4 rounded-8 fsize-18 font-pingfang font-400 text-[#fff]">{{
                      item.coin_name || 'ADX' }}</span>
                  </div>
                  <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">{{
                    formatTime(item.created_at)
                  }}</span>
                  <div class="flex items-center gap-12 mt-6">
                    <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">支付: {{
                      formatNumber(item.coin_amount || 0, 3) }}
                      {{ item.coin_name || 'ADX' }}</span>
                  </div>
                </div>
                <div class="flex flex-col gap-6 items-end justify-center">
                  <span class="fsize-26 font-miSans font-630 text-[#16FFC2] leading-none">+{{
                    formatNumber(item.total_power || 0, 3) }}</span>
                  <span class="fsize-20 font-miSans font-330 text-[#fff] leading-none opacity-50">累计算力</span>
                </div>
              </div>
              <div class="line"></div>
            </div>
          </van-list>
        </van-pull-refresh>
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
  --Style: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);

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

  /* 隐藏最后一个子元素的分割线 */
  .log-list>div:last-child .line {
    display: none;
  }

  /* 支付徽章 */
  .pay-badge {
    background: rgba(249, 3, 164, 0.2);
    border: 1px solid rgba(249, 3, 164, 0.4);
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
  .log-list {
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
        color: #f903a4;
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
}
</style>
