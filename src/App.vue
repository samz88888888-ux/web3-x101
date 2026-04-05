<style>
.van-popup.van-toast {
  background: var(--van-toast-background) !important;
  box-sizing: content-box !important;
  transition: all var(--van-duration-fast) !important;
  width: 200px !important;
  max-width: 800px !important;
}

/* 覆盖 vant popup 的默认样式 */
:deep(.van-popup) {
  background: transparent !important;
}

:deep(.van-overlay) {
  background-color: rgba(0, 0, 0, 0.7) !important;
}
</style>
<template>
  <Nav :theme="theme" @connectWallet="init" />
  <NetworkErr @confirm="init" ref="networkErrRef" />
  <div id="main">
    <router-view></router-view>
  </div>
  <van-popup v-model:show="show" position="center" :style="{ background: 'transparent' }"
    :overlay-style="{ backdropFilter: 'blur(4px)' }" @close="() => { }">
    <div class="invitation-popup">
      <!-- 关闭按钮 -->
      <div class="close-btn" @click="show = false">
        <van-icon name="cross" size="24" color="#fff" />
      </div>

      <!-- 标题 -->
      <div class="popup-title">邀请码</div>

      <!-- 输入框 -->
      <div class="input-container">
        <input type="text" v-model="invitationCode" class="invitation-input" placeholder="请输入邀请码" />
      </div>

      <!-- 确定按钮 -->
      <div @click="handleConfirmCode" :class="['confirm-btn', { disabled: !invitationCode }]">
        <span>确定</span>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import Nav from '@/components/header.vue'
import Footer from '@/components/footer.vue'
import NetworkErr from '@/components/networkErr.vue'
import { watch, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import useWeb3 from '@/utils/useWeb3'
import { showToast } from 'vant'
import { useIndexStore } from '@/store'
import api from '@/apis'
import config from '@/config'
const show = ref(false)
const store = useIndexStore()
const route = useRoute()
const theme = ref('') // dark light
let invitationCode = ref('')
//监听地址变化
useWeb3.onAccountChange((address) => {
  store.setToken('')
  setTimeout(() => {
    window.location.reload()
  }, 800)
})

let networkErrRef = ref(null)

let handleConfirmCode = async () => {
  if (!invitationCode.value) {
    return
  }
  show.value = false
  login()
}

const init = async () => {
  invitationCode.value = route.query?.code || ''
  if (config.env == 'dev' && invitationCode.value == '') {
    invitationCode.value = config.debugCode
  }
  try {
    await useWeb3.ensureReady()

    const currentChainId = window.ethereum?.chainId || window.tokenpocket?.chainId
    if (currentChainId != config.network.chainId) {
      console.warn('链ID不匹配,打开网络错误提示')
      networkErrRef.value.open()
      return
    }
    let address = useWeb3.signer?.address

    const isRegister = await api.home.isRegister({ address })

    if (!isRegister?.isRegister) {
      invitationCode.value = route.query?.code || ''
      show.value = true
      return
    }
    login()
  } catch (error) {

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

let login = async () => {
  await useWeb3.ensureReady()
  let address = useWeb3.signer?.address
  const { message } = await api.home.loginMessage()
  const signature = await useWeb3.signMessage(`${message}`)
  const res = await api.home.login({
    address: address,
    message,
    sign_message: signature,
    code: invitationCode.value
  })
  store.setAddress(address)
  store.setToken(res.token)
  // 登录成功后获取用户信息
  await store.fetchUserInfo()
}
useWeb3.onChainChange((chainId) => {
  console.log(chainId)
  console.log(window.ethereum.chainId, config.network.chainId)
  if (window.ethereum.chainId != config.network.chainId) {
    networkErrRef.value.open()
    return
  }
})
onMounted(() => {
  if (config.isVerifyToken) {
    init()
  }
})
//监听路由变化
watch(
  () => route.path,
  (val) => {
    theme.value = route.meta.headerTheme || 'light'
  }
)
</script>
<style lang="scss" scoped>
#main {
  /* CSS 变量定义 - 渐变边框（绿色主题） */
  --Linear: linear-gradient(334deg, #3fff6c 9.54%, #fff 97.8%);
  --Style: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
  --bgColor: linear-gradient(180deg, #0d2820 0%, #051810 100%);
}

/* 邀请码弹窗样式 */
.invitation-popup {
  position: relative;
  width: 626px;
  padding: 50px 40px 60px;
  border-radius: 40px;
  background: #122626;

  /* 渐变边框 - 绿色主题 */
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

  >* {
    position: relative;
    z-index: 1;
  }
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
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
  margin-bottom: 40px;
  text-align: left;
}

/* 输入框容器 */
.input-container {
  width: 100%;
  margin-bottom: 40px;
}

/* 输入框 */
.invitation-input {
  width: 100%;
  height: 88px;
  padding: 0 30px;
  border-radius: 20px;
  background: rgba(255, 154, 252, 0.1);
  border: none;
  outline: none;
  color: #fff;
  font-size: 28px;
  font-family: Roboto, sans-serif;
  font-weight: 500;
  line-height: 50px;
  transition: background 0.3s ease;

  &::placeholder {
    color: #bec0ca;
    font-size: 28px;
    font-family: Roboto, sans-serif;
    font-weight: 500;
  }

  &:focus {
    background: rgba(0, 255, 110, 0.15);
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
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 255, 110, 0.3);

  span {
    font-size: 32px;
    font-family: Roboto, sans-serif;
    font-weight: 600;
    color: #000;
    line-height: 1;
  }

  &:hover {
    background: #00ff6e;
    box-shadow: 0 6px 20px rgba(0, 255, 110, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
    background: #00d95c;
    box-shadow: 0 2px 12px rgba(0, 255, 110, 0.2);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    box-shadow: none;
  }
}
</style>
