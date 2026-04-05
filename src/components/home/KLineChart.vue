<script setup>
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'

// 注册必要的组件
use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, DataZoomComponent])

// 定义组件 props
const props = defineProps({
  // K线数据 - 数组格式: [{ time: '7AM', value: 10 }, ...]
  data: {
    type: Array,
    default: () => []
  },
  // K线颜色
  lineColor: {
    type: String,
    default: '#3FFFA5'
  },
  // K线宽度
  lineWidth: {
    type: Number,
    default: 2
  },
  // 渐变起始颜色和透明度
  gradientStartColor: {
    type: String,
    default: '#03E0F9'
  },
  gradientStartOpacity: {
    type: Number,
    default: 0.55
  },
  // 渐变结束颜色和透明度
  gradientEndColor: {
    type: String,
    default: '#8DFF58'
  },
  gradientEndOpacity: {
    type: Number,
    default: 0
  },
  // 图表宽度
  width: {
    type: String,
    default: '100%'
  },
  // 图表高度
  height: {
    type: String,
    default: '100%'
  },
  // Y轴显示的刻度数量
  yAxisTicks: {
    type: Number,
    default: 10
  },
  // 是否显示坐标轴
  showAxis: {
    type: Boolean,
    default: true
  },
  // 是否显示tooltip
  showTooltip: {
    type: Boolean,
    default: true
  }
})

// ECharts 配置
const option = computed(() => {
  // 提取时间和值
  const xAxisData = props.data.map((item) => item.time)
  const seriesData = props.data.map((item) => item.value)

  // 计算显示30%的数据
  const dataLength = props.data.length
  const showPercentage = 30 // 显示30%的数据
  const startValue = Math.max(0, dataLength - Math.ceil((dataLength * showPercentage) / 100))

  return {
    // 图表边距
    grid: {
      left: 1,
      right: 5,
      top: 5,
      bottom: 25, // 增加底部空间，为dataZoom留出空间
      containLabel: true
    },

    // 数据区域缩放组件
    dataZoom: [
      {
        type: 'inside', // 内置型数据区域缩放组件(支持鼠标滚轮缩放、手指拖动等)
        start: 70, // 数据窗口范围的起始百分比（显示最后30%）
        end: 100, // 数据窗口范围的结束百分比
        zoomOnMouseWheel: true, // 滚轮缩放
        moveOnMouseMove: false, // 鼠标移动平移
        moveOnMouseWheel: false // 滚轮不平移
      },
      {
        type: 'slider', // 滑动条型数据区域缩放组件
        show: true,
        start: 70,
        end: 100,
        height: 15,
        bottom: 5,
        borderColor: 'transparent',
        backgroundColor: 'rgba(3, 224, 249, 0.1)', // 使用K线区域背景色
        fillerColor: `rgba(${hexToRgb(props.gradientStartColor)}, ${props.gradientStartOpacity * 0.4})`, // 选中区域颜色
        handleStyle: {
          color: props.lineColor, // 使用K线颜色
          borderColor: props.lineColor
        },
        textStyle: {
          color: 'transparent' // 隐藏文字
        },
        brushSelect: false, // 禁用刷选
        zoomLock: false // 允许缩放
      }
    ],

    // Tooltip 配置
    tooltip: props.showTooltip
      ? {
          trigger: 'axis',
          backgroundColor: 'rgba(20, 18, 28, 0.9)',
          borderColor: props.lineColor, // 使用K线颜色
          borderWidth: 1,
          textStyle: {
            color: '#FFF',
            fontSize: 15,
            fontFamily: 'PingFang SC'
          },
          formatter: (params) => {
            const param = params[0]
            return `${param.name}<br/>$${parseFloat(param.value).toFixed(2)}`
          },
          axisPointer: {
            lineStyle: {
              color: props.lineColor, // 使用K线颜色
              width: 1,
              type: 'dashed'
            }
          }
        }
      : undefined,

    // X轴配置
    xAxis: {
      type: 'category',
      data: xAxisData,
      show: props.showAxis,
      boundaryGap: true,
      axisLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Roboto',
        fontWeight: 400,
        margin: 8,
        opacity: 0.7, // X轴文字透明度
        interval: 'auto', // 自动计算间隔，避免重叠
        rotate: 0, // 不旋转
        formatter: (value) => {
          // 简化时间显示：只显示 MM-DD HH:mm 的简短版本
          // 如果是 "01-17 14:30" 格式，可以进一步简化
          if (value.includes(' ')) {
            const parts = value.split(' ')
            return `${parts[0]}\n${parts[1]}` // 换行显示日期和时间
          }
          return value
        }
      }
    },

    // Y轴配置
    yAxis: {
      type: 'value',
      show: props.showAxis,
      splitNumber: props.yAxisTicks - 1,
      scale: true,
      min: 'dataMin',
      max: 'dataMax',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Roboto',
        fontWeight: 400,
        margin: 2,
        opacity: 0.7, // Y轴文字透明度
        formatter: (value) => {
          // 格式化为小数点后2位
          return value.toFixed(2)
        }
      }
    },

    // 数据系列
    series: [
      {
        type: 'line',
        data: seriesData,
        smooth: true, // 改为平滑曲线
        symbol: 'none',
        lineStyle: {
          color: props.lineColor,
          width: props.lineWidth
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: `rgba(${hexToRgb(props.gradientStartColor)}, ${props.gradientStartOpacity})`
              },
              {
                offset: 1,
                color: `rgba(${hexToRgb(props.gradientEndColor)}, ${props.gradientEndOpacity})`
              }
            ]
          }
        }
      }
    ]
  }
})

// 辅助函数: 将hex颜色转换为rgb
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '249, 3, 164'
}
</script>

<template>
  <div class="kline-chart-container" :style="{ width: props.width, height: props.height }">
    <VChart class="chart" :option="option" :autoresize="true" />
  </div>
</template>

<style lang="scss" scoped>
.kline-chart-container {
  position: relative;
  width: 100%;
  height: 100%;

  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>
