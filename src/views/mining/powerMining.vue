<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/apis'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { formatPerformance } from '@/utils/format'
import web3 from '@/utils/useWeb3'
import { ethers } from 'ethers'
import usdtIcon from '@/assets/imgs/coin/usdt-coin.png'
import x101Icon from '@/assets/imgs/coin/x101-coin.png'
import filterIcon from '@/assets/imgs/user/fitter.svg'
import dotIcon from '@/assets/imgs/wallet/dot.svg'
import addIcon from '@/assets/imgs/mining/add.svg'
import checkedIcon from '@/assets/imgs/mining/checked.svg'
import exchangeIcon from '@/assets/imgs/wallet/exchange.svg'

const { t } = useI18n()
</script>
<template>
  <div class="container">
    <div class="body">
      <div class="flex gap-12 items-center justify-start">
        <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
        <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">双币挖矿</span>
      </div>
      <div class="power-container mt-30 w-100% flex-col py-40 px-25 items-start justify-center">
        <div class="h-81 w-100% flex items-center justify-center gap-26">
          <van-image width="40" height="40" :src="usdtIcon" fit="contain"></van-image>
          <van-image width="9" height="18" :src="addIcon" fit="contain"></van-image>
          <van-image width="40" height="40" :src="x101Icon" fit="contain"></van-image>
        </div>
        <span
          class="block mt-23 fsize-30 text-center font-roboto font-700 text-[#fff] leading-normal"
          >USDT + X101</span
        >
        <span
          class="block mt-13 fsize-20 text-center font-roboto font-500 text-[#fff] leading-normal opacity-60"
          >提供流动性获得算力奖励</span
        >
        <div
          class="button-bg flex mt-30 flex-col items-center justify-center w-100% rounded-20 h-165 gap-10">
          <span class="fsize-48 font-roboto font-700 text-[#fff] leading-none">10%</span>
          <span class="fsize-22 font-roboto font-400 text-[#fff] leading-none">年化收益率</span>
        </div>
      </div>

      <!-- 提供流动性 -->
      <div class="flex mt-30 flex-col items-start justify-start gap-30">
        <div
          class="power-container flex flex-col items-center justify-start gap-30 w-100% pt-44 pb-55 px-30">
          <div class="flex gap-12 items-center justify-start w-100%">
            <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
            <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">开始挖矿</span>
          </div>
          <div class="flex flex-col items-start justify-center w-100%">
            <div class="flex items-center justify-between w-100%">
              <span class="fsize-28 font-roboto font-700 text-[#fff] leading-normal">投资数量</span>
              <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal">余额：0</span>
            </div>
            <div
              class="box-input mt-24 w-100% h-92 flex px-30 flex items-center justify-between rounded-20">
              <span class="fsize-28 font-roboto font-500 text-[#BEC0CA] lh-50">输入数量</span>
              <span class="fsize-28 font-roboto font-500 text-[#F903A4] lh-50">Max</span>
            </div>
            <div class="flex items-center justify-between w-100% mt-30">
              <span class="fsize-28 font-roboto font-700 text-[#fff] leading-normal">挖矿周期</span>
            </div>
            <div
              class="box-input mt-24 w-100% h-92 flex px-30 flex items-center justify-between rounded-20">
              <span class="fsize-28 font-roboto font-500 text-[#BEC0CA] lh-50">输入数量</span>
              <span class="fsize-28 font-roboto font-500 text-[#F903A4] lh-50">天</span>
            </div>
            <!-- tips -->
            <div class="mt-30 flex flex-col items-start justify-center w-100% gap-30">
              <div class="flex items-center justify-between w-100%">
                <div class="flex items-center justify-center gap-10">
                  <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
                  <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal"
                    >每日收益：</span
                  >
                </div>
                <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal">5 USDT</span>
              </div>
              <div class="flex items-center justify-between w-100%">
                <div class="flex items-center justify-center gap-10">
                  <van-image width="12" height="12" :src="dotIcon" fit="contain"></van-image>
                  <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal"
                    >每日收益：</span
                  >
                </div>
                <span class="fsize-24 font-roboto font-400 text-[#fff] leading-normal">5 USDT</span>
              </div>
            </div>
            <div class="flex w-100% h-90 mt-30 items-center justify-center">
              <van-button
                round
                color="#F903A4"
                class="w-100% h-100% fsize-34 font-roboto font-600 leading-none uppercase"
                >开始挖矿</van-button
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 挖矿记录 -->
      <div class="flex mt-30 flex-col items-start justify-start">
        <div
          class="power-container flex flex-col items-center justify-start w-100% pt-37 pb-55 px-30">
          <div class="flex gap-12 items-center justify-start w-100%">
            <div class="box w-7 h-30 rounded-1398 flex items-center justify-center"></div>
            <span class="fsize-28 font-pingfang font-600 text-[#fff] leading-normal">挖矿记录</span>
          </div>
          <!-- 记录 -->
          <div class="mt-31 flex flex-col items-center justify-center w-100% gap-24">
            <div class="flex flex-col items-start justify-center gap-25 w-100%">
              <div class="log-line"></div>
              <div class="flex flex-col w-100% gap-16 items-start justify-center">
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >收益数量</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >投资数量</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >周期</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >日期</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >2026-11-11 10:00:00</span
                  >
                </div>
              </div>
            </div>
            <div class="flex flex-col items-start justify-center gap-25 w-100%">
              <div class="log-line"></div>
              <div class="flex flex-col w-100% gap-16 items-start justify-center">
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >收益数量</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >投资数量</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >周期</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >100 USDT</span
                  >
                </div>
                <div class="flex items-center justify-between w-100%">
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >日期</span
                  >
                  <span class="fsize-24 font-pingfang font-500 text-[#fff] leading-normal"
                    >2026-11-11 10:00:00</span
                  >
                </div>
              </div>
            </div>
          </div>
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
  background: url('@/assets/imgs/mining/ming-bg.png') no-repeat top center;

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
  --Linear: linear-gradient(334deg, #320041 9.54%, #fff 97.8%);
  --Style: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);
  --bgColor: linear-gradient(180deg, #352700 0%, #1d170b 12.2%, #030202 81.32%);
  --Radial: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 36.85%, #f658ff 100%);

  .body {
    width: 100%;
    padding: 30px 30px 300px;
    position: relative;
  }

  .power-container {
    position: relative;
    border-radius: 30px;
    background: radial-gradient(106.52% 106.52% at 50% 50%, #14121c 45%, #f658ff 100%);

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
}

.box {
  background: linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%);
}

.out-coin {
  background: rgba(255, 255, 255, 0.1);
}

.box-input {
  background: rgba(255, 255, 255, 0.1);
}

.exchange-btn {
  border-radius: 55px;
  background: var(--Style, linear-gradient(180deg, #ff3f85 0%, #8a04ff 100%));
  box-shadow: 0 0 8px 0 rgba(255, 255, 255, 0.25) inset;
}

.button-bg {
  background: var(--Style, linear-gradient(180deg, #f903a4 0%, #4e54ff 100%));
}

.log-line {
  width: 100%;
  height: 1px;
  opacity: 0.1;
  background: #fff;
}
</style>
