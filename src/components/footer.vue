<template>
  <div class="footer-container">
    <div
      v-for="item in menuList"
      :key="item.key"
      class="footer-item"
      @click="handleMenuClick(item.key)">
      <img
        :src="activeMenu === item.key ? item.activeIcon : item.icon"
        class="footer-icon"
        alt="" />
      <span class="footer-text" :class="{ active: activeMenu === item.key }">
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
// 图标导入
import indexIcon from '@/assets/imgs/footer/index.svg'
import indexActiveIcon from '@/assets/imgs/footer/index-active.svg'
import powerIcon from '@/assets/imgs/footer/power.svg'
import powerActiveIcon from '@/assets/imgs/footer/power-active.svg'
import inviteIcon from '@/assets/imgs/footer/invite.svg'
import inviteActiveIcon from '@/assets/imgs/footer/invite-active.svg'
import exchangeIcon from '@/assets/imgs/footer/exchange.svg'
import exchangeActiveIcon from '@/assets/imgs/footer/exchange-active.svg'
import mineIcon from '@/assets/imgs/footer/mine.svg'
import mineActiveIcon from '@/assets/imgs/footer/mine-active.svg'

// 路由实例
const router = useRouter()
const route = useRoute()

// 当前激活的菜单
const activeMenu = ref('index')

// 菜单列表配置
const menuList = [
  {
    key: 'index',
    label: t('footer.index'),
    icon: indexIcon,
    activeIcon: indexActiveIcon,
    path: '/'
  },
  {
    key: 'power',
    label: t('footer.power'),
    icon: powerIcon,
    activeIcon: powerActiveIcon,
    path: '/power'
  },
  {
    key: 'invite',
    label: t('footer.invite'),
    icon: inviteIcon,
    activeIcon: inviteActiveIcon,
    path: '/invite'
  },
  {
    key: 'exchange',
    label: t('footer.exchange'),
    icon: exchangeIcon,
    activeIcon: exchangeActiveIcon,
    path: '/exchange'
  },
  {
    key: 'mine',
    label: t('footer.mine'),
    icon: mineIcon,
    activeIcon: mineActiveIcon,
    path: '/mine'
  }
]

// 根据当前路由更新激活菜单
const updateActiveMenu = () => {
  const currentPath = route.path
  const matchedMenu = menuList.find((item) => item.path === currentPath)
  if (matchedMenu) {
    activeMenu.value = matchedMenu.key
  }
}

// 菜单点击事件
const handleMenuClick = (key) => {
  const menuItem = menuList.find((item) => item.key === key)
  if (menuItem) {
    // 如果当前已经在这个路由，不重复跳转
    if (route.path !== menuItem.path) {
      router.push(menuItem.path)
    }
    activeMenu.value = key
  }
}

// 监听路由变化，自动更新激活状态
watch(
  () => route.path,
  () => {
    updateActiveMenu()
  },
  { immediate: true }
)

// 组件挂载时更新激活状态
onMounted(() => {
  updateActiveMenu()
})
</script>

<style scoped lang="scss">
.footer-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 140px;
  background: #000;
  box-shadow: 0 -4px 12px 0 rgba(255, 255, 255, 0.19);
  padding: 25.5px 20px 23.5px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  z-index: 999;
}

.footer-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.footer-icon {
  width: 52px;
  height: 52px;
  margin-bottom: 8px;
}

.footer-text {
  color: #9391a2;
  text-align: center;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 22px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(180deg, #3fff6c 0%, #009543 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
