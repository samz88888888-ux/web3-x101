<template>
  <div class="py-[10px] px-[20px] h-60 flex items-center icon"
    :style="{ '--icon-item-width': (props.icon.length * 60) - (props.icon.length) * 30 + 'px' }">
    <img :src="item" alt="" class="w-60  h-60 icon-item" :style="{ '--icon-item-index': index * 20 + 'px' }"
      v-for="(item, index) in props.icon" :key="item">
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  icon: {
    type: Array,
    required: true
  }
})
</script>
<style scoped>
::root {
  --icon-item-index: 0px;
  --icon-item-width: 0px;
}

.icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-item-width);
}

.icon-item {
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: var(--icon-item-index);
}
</style>