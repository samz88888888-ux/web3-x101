/**
 * 清除字符串中空格
 * params is_global == 'all' 则字符串内的空格都清除掉
 */
export function strTrim(str, isAll) {
  let result = str.replace(/(^\s+)|(\s+$)/g, '')
  if (isAll.toLowerCase() === 'all') {
    result = result.replace(/\s/g, '')
  }
  return result
}
/**
 * 获取本地存储
 * @param key
 * @param data
 * @param expires
 * @returns {*}
 * @author Dll
 */
export function localStore(key, data, expires) {
  /**
   * 基于本地存储的缓存模块
   *
   * @param {String} key 键名
   * @param {any} data 数据
   * @param {Number} expires 有效期(秒), 0永久
   * @returns {any}
   *
   * 使用例子：
   * localStore('aaa', { a: 1 }); //  永久存储
   * localStore('bbb', { b: 2 }, 3); //  存储3秒
   *
   * setTimeout(function() {
   *     console.log(localStore('aaa'), localStore('bbb')); //  {a: 1} {b: 2}
   * }, 1000);
   *
   * setTimeout(function() {
   *     console.log(localStore('aaa'), localStore('bbb')); //  {a: 1} undefined
   * }, 4000);
   */
  const localStorage = window.localStorage
  //  不兼容返回空
  if (!localStorage) {
    return undefined
  }
  const now = +new Date() //  当前时间戳
  //  有值则存储数据
  if (data !== undefined && data !== '') {
    const storeData = {
      data,
      expires: 0 //  有效期
    }
    if (expires) {
      storeData.expires = now + expires * 1000 //  到期时间戳
    }
    //  无法存入情况
    try {
      return localStorage.setItem(key, JSON.stringify(storeData))
    } catch (er) {
      //  不做处理统一返回
    }
  } else {
    //  获取数据
    try {
      const storeData = JSON.parse(localStorage.getItem(key))
      if (storeData.expires === 0 || now <= storeData.expires) {
        return storeData.data
      }
      return localStorage.removeItem(key) //  清理过期数据
    } catch (er) {
      //  不做处理统一返回
    }
  }
  return undefined
}
/**
 * 更改title
 * @param {*}} title
 */
export function changeTitle(title) {
  document.title = title
  // 如果是 iOS 微信设备，则使用如下 hack 的写法实现页面标题的更新
  if (navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
    const i = document.createElement('iframe')
    i.src = '/favicon.ico'
    i.style.display = 'none'
    i.onload = () => {
      setTimeout(() => {
        i.remove()
      }, 10)
    }
    document.body.appendChild(i)
  }
}
/**
 * 替换指定传入参数的值,paramName为参数,replaceWith为新值
 * @param {*} paramName
 * @param {*} replaceWith
 */
export function replaceParamVal(paramName, replaceWith) {
  const state = { title: '', url: window.location.href }
  window.history.replaceState(state, '', `${window.location.pathname}?${paramName}=${replaceWith}`)
}
/**
 * 获取地址栏参数
 * @param {string} key - 参数名
 * @param {string} url - 可选的URL，默认使用当前页面URL
 * @returns {string|null} 参数值，不存在返回null
 */
export function getQueryString(key, url = null) {
  try {
    const targetUrl = url || window.location.href
    const urlObj = new URL(targetUrl)
    return urlObj.searchParams.get(key)
  } catch (error) {
    return null
  }
}

/**
 * 获取所有地址栏参数
 * @param {string} url - 可选的URL，默认使用当前页面URL
 * @returns {Object} 包含所有参数的对象
 */
export function getAllQueryParams(url = null) {
  try {
    const targetUrl = url || window.location.href
    const urlObj = new URL(targetUrl)
    const params = {}
    
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value
    }
    
    return params
  } catch (error) {
    return {}
  }
}

/**
 * 检查地址栏是否包含指定参数
 * @param {string} key - 参数名
 * @param {string} url - 可选的URL，默认使用当前页面URL
 * @returns {boolean} 是否存在该参数
 */
export function hasQueryParam(key, url = null) {
  try {
    const targetUrl = url || window.location.href
    const urlObj = new URL(targetUrl)
    return urlObj.searchParams.has(key)
  } catch (error) {
    return false
  }
}

/**
 * 设置地址栏参数（不刷新页面）
 * @param {string} key - 参数名
 * @param {string} value - 参数值
 * @param {boolean} replace - 是否替换当前历史记录，默认true
 */
export function setQueryParam(key, value, replace = true) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    
    if (replace) {
      window.history.replaceState({}, '', url.toString())
    } else {
      window.history.pushState({}, '', url.toString())
    }
  } catch (error) {
    console.warn('设置URL参数失败:', error)
  }
}

/**
 * 删除地址栏参数（不刷新页面）
 * @param {string} key - 参数名
 * @param {boolean} replace - 是否替换当前历史记录，默认true
 */
export function removeQueryParam(key, replace = true) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete(key)
    
    if (replace) {
      window.history.replaceState({}, '', url.toString())
    } else {
      window.history.pushState({}, '', url.toString())
    }
  } catch (error) {
    console.warn('删除URL参数失败:', error)
  }
}

/**
 * 格式化数字
 * @param {*} num
 * @param {*} decimals
 * @returns
 */
export function formatNumber(num, decimals) {
  num = num.toFixed(decimals)
  num += ''
  const x = num.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  const rgx = /(\d+)(\d{3})/
  if (',' && isNaN(parseFloat(','))) {
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    }
  }
  return x1 + x2
}

//格式化以太坊地址
export function formatEthereumAddress(address) {
  if(!address){
    return '-'
  }
  return `${address.slice(0, 4)}***${address.slice(-4)}`
}


export function debounce(func, delay, immediate = false) {
  let timeoutId = null
  
  return function(...args) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // 如果立即执行且没有定时器
    if (immediate && !timeoutId) {
      func.apply(this, args)
    }
    
    // 设置新的定时器
    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) {
        func.apply(this, args)
      }
    }, delay)
  }
}