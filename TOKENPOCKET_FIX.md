# TokenPocket 钱包兼容性修复说明

## 问题描述

在某些手机使用 TokenPocket 钱包打开 DApp 时,页面只显示背景色,其他内容无法显示。

## 根本原因分析

### 1. **钱包提供者检测不完整**
   - 原代码只检测 `window.ethereum`,但 TokenPocket 在某些情况下使用 `window.tokenpocket`
   - 不同钱包提供者注入方式不同,导致初始化失败

### 2. **错误被静默捕获**
   - `App.vue` 的 `init()` 函数中错误被 `try-catch` 捕获但没有适当处理
   - 生产环境禁用了 console.log,无法看到错误信息
   - 初始化失败导致 Vue 组件无法正常渲染

### 3. **链ID检测方式单一**
   - 直接使用 `window.ethereum.chainId`,在 TokenPocket 中可能不存在

## 修复方案

### 修改文件列表
1. `src/utils/useWeb3.js` - 钱包检测和初始化逻辑
2. `src/App.vue` - 错误处理和日志输出

### 具体修改

#### 1. 增强钱包检测 (`useWeb3.js`)

```javascript
// 新增函数:检测多种钱包提供者
const isWalletInstalled = () => {
  if (typeof window === 'undefined') return false
  
  return !!(
    window.ethereum ||           // MetaMask, TokenPocket (某些版本)
    window.tokenpocket ||        // TokenPocket 专用
    window.web3?.currentProvider // 旧版钱包
  )
}

// 新增函数:获取钱包提供者
const getProvider = () => {
  if (typeof window === 'undefined') return null
  
  // TokenPocket 优先
  if (window.tokenpocket?.isTokenPocket) {
    console.log('检测到 TokenPocket 钱包')
    return window.tokenpocket
  }
  
  // 标准 ethereum 提供者
  if (window.ethereum) {
    console.log('检测到标准 Ethereum 提供者')
    return window.ethereum
  }
  
  // 旧版 web3
  if (window.web3?.currentProvider) {
    console.log('检测到旧版 Web3 提供者')
    return window.web3.currentProvider
  }
  
  return null
}
```

#### 2. 更新初始化逻辑

```javascript
// ensureReady 函数中使用 getProvider()
if (!provider) {
  const walletProvider = getProvider()
  provider = new ethers.BrowserProvider(walletProvider)
}
```

#### 3. 改进错误处理 (`App.vue`)

```javascript
const init = async () => {
  try {
    console.log('========== 应用初始化开始 ==========')
    console.log('当前环境:', config.env)
    console.log('检查钱包提供者...')
    
    await useWeb3.ensureReady()
    
    // 获取链ID时同时检查多个来源
    const currentChainId = window.ethereum?.chainId || window.tokenpocket?.chainId
    
    // ... 后续逻辑
  } catch (error) {
    console.error('========== 应用初始化失败 ==========')
    console.error('错误类型:', error.name)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    
    // 显示友好的错误提示
    if (error.message.includes('Wallet not installed')) {
      showToast('请先安装Web3钱包')
    } else if (error.message.includes('No wallet provider')) {
      showToast('无法连接到钱包')
    } else {
      showToast('初始化失败,请刷新重试')
    }
  }
}
```

## 调试建议

### 1. 开启临时日志(针对生产环境问题)

在 `src/config/modules/production.js` 中临时开启日志:

```javascript
isEnableConsole: true, // 临时改为 true
```

### 2. 检查点

使用 TokenPocket 打开 DApp 后,在控制台查看:

```javascript
// 检查钱包对象
console.log('window.ethereum:', window.ethereum)
console.log('window.tokenpocket:', window.tokenpocket)
console.log('window.web3:', window.web3)

// 检查链ID
console.log('ethereum chainId:', window.ethereum?.chainId)
console.log('tokenpocket chainId:', window.tokenpocket?.chainId)
```

### 3. 测试环境

建议在以下环境中测试:
- ✅ TokenPocket iOS
- ✅ TokenPocket Android
- ✅ MetaMask 移动端
- ✅ imToken
- ✅ Trust Wallet

## 预防措施

### 1. 错误监控

建议添加全局错误监控(如 Sentry):

```javascript
// main.js
import * as Sentry from "@sentry/vue"

Sentry.init({
  app,
  dsn: "your-sentry-dsn",
  environment: config.env
})
```

### 2. 用户反馈机制

在初始化失败时提供:
- 明确的错误提示
- 刷新重试按钮
- 客服联系方式

### 3. 兼容性测试清单

每次发布前检查:
- [ ] MetaMask 桌面端
- [ ] MetaMask 移动端
- [ ] TokenPocket iOS
- [ ] TokenPocket Android  
- [ ] imToken
- [ ] Trust Wallet
- [ ] Coinbase Wallet

## 额外优化建议

### 1. 添加加载状态

```vue
<template>
  <div v-if="isInitializing" class="loading-screen">
    <van-loading type="spinner">初始化中...</van-loading>
  </div>
  <router-view v-else></router-view>
</template>
```

### 2. 超时处理

```javascript
const initWithTimeout = async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('初始化超时')), 10000)
  )
  
  try {
    await Promise.race([init(), timeout])
  } catch (error) {
    showToast('初始化超时,请检查网络后重试')
  }
}
```

### 3. 重试机制

```javascript
const initWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await init()
      return
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 总结

本次修复主要解决了钱包提供者检测不完整的问题,通过支持多种钱包注入方式,提高了 DApp 的兼容性。同时改进了错误处理和日志输出,方便后续排查问题。
