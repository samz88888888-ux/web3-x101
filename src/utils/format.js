/**
 * 数字格式化工具函数
 */

import { showToast } from 'vant'

/**
 * 格式化数字，添加千分位分隔符，保留指定小数位（直接截取，不四舍五入）
 * @param {number|string} number - 要格式化的数字
 * @param {number} decimals - 保留的小数位数，默认3位
 * @returns {string} 格式化后的数字字符串
 * 
 * @example
 * formatNumber(10002) // "1,000.200"
 * formatNumber(10002.123456) // "1,000.123"
 * formatNumber(10002.123456, 2) // "1,000.12"
 * formatNumber(0) // "0.000"
 */
export function formatNumber(number, decimals = 3) {
  // 处理空值
  if (number === null || number === undefined || number === '') {
    return '0.' + '0'.repeat(decimals)
  }

  // 转换为字符串
  let numStr = String(number)
  
  // 处理负数
  const isNegative = numStr.startsWith('-')
  if (isNegative) {
    numStr = numStr.slice(1)
  }

  // 分离整数和小数部分
  let [integerPart, decimalPart = ''] = numStr.split('.')
  
  // 截取小数部分（不四舍五入）
  if (decimalPart.length > decimals) {
    decimalPart = decimalPart.slice(0, decimals)
  } else {
    // 补齐小数位
    decimalPart = decimalPart.padEnd(decimals, '0')
  }

  // 整数部分添加千分位分隔符
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // 组合结果
  const result = decimals > 0 
    ? `${integerPart}.${decimalPart}` 
    : integerPart

  return isNegative ? `-${result}` : result
}

/**
 * 格式化余额显示（保留2位小数）
 * @param {number|string} balance - 余额
 * @returns {string} 格式化后的余额
 */
export function formatBalance(balance) {
  return formatNumber(balance, 2)
}

/**
 * 格式化业绩显示（保留3位小数）
 * @param {number|string} performance - 业绩
 * @returns {string} 格式化后的业绩
 */
export function formatPerformance(performance) {
  return formatNumber(performance, 3)
}

/**
 * 格式化整数（不显示小数）
 * @param {number|string} num - 数字
 * @returns {string} 格式化后的整数
 */
export function formatInteger(num) {
  return formatNumber(num, 0)
}

/**
 * 简化大数字显示（K, M, B）
 * @param {number|string} number - 要格式化的数字
 * @param {number} decimals - 保留的小数位数
 * @returns {string} 格式化后的数字
 * 
 * @example
 * formatLargeNumber(1234) // "1.23K"
 * formatLargeNumber(1234567) // "1.23M"
 * formatLargeNumber(1234567890) // "1.23B"
 */
export function formatLargeNumber(number, decimals = 2) {
  const num = Number(number)
  
  if (isNaN(num)) return '0'
  
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  
  if (absNum >= 1e9) {
    return sign + formatNumber(absNum / 1e9, decimals) + 'B'
  }
  if (absNum >= 1e6) {
    return sign + formatNumber(absNum / 1e6, decimals) + 'M'
  }
  if (absNum >= 1e3) {
    return sign + formatNumber(absNum / 1e3, decimals) + 'K'
  }
  
  return formatNumber(num, decimals)
}

/**
 * 处理菜单点击事件 - 根据配置进行路由跳转或提示
 * @param {Object} item - 菜单项对象
 * @param {boolean} item.turn - 是否开启该功能
 * @param {string} item.link - 路由路径
 * @param {string} item.tip - 未开启时的提示信息
 * @param {Object} router - Vue Router 实例
 * 
 * @example
 * // 在组件中使用
 * import { useRouter } from 'vue-router'
 * import { handleMenuClick } from '@/utils/format'
 * 
 * const router = useRouter()
 * const menuItem = { turn: true, link: '/node', tip: '节点已完结~' }
 * handleMenuClick(menuItem, router)
 */
export function handleMenuClick(item, router) {
  // 检查是否开启
  if (!item.turn) {
    // 未开启，显示提示信息（居中显示）
    showToast({
      message: item.tip || '敬请期待~',
      position: 'middle',  // 居中显示
      duration: 2000
    })
    return
  }

  // 已开启，检查是否有路由链接
  if (item.link) {
    router.push(item.link)
  } else {
    showToast({
      message: '敬请期待~',
      position: 'middle',  // 居中显示
      duration: 2000
    })
  }
}

export default {
  formatNumber,
  formatBalance,
  formatPerformance,
  formatInteger,
  formatLargeNumber,
  handleMenuClick
}

