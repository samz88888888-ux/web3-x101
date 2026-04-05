# UnoCSS 原子化配置文档

## 📐 设计稿说明

- **设计稿宽度**: 750px
- **实际显示**: 自动转换为 vw（通过 postcss-px2vp）
- **Vant 组件**: 按 375px 基准转换
- **自定义代码**: 按 750px 基准转换
- **使用规则**: 直接按设计稿尺寸写，例如设计稿 73px 就写 `width="73"`

---

## 🎨 当前已配置的原子化类

### 1️⃣ 外边距 (Margin)

| 类名 | 说明 | 示例 | 生成样式 |
|------|------|------|----------|
| `m-{数字}` | 四周外边距 | `m-10` | `margin: 10px` |
| `my-{数字}` | 上下外边距 | `my-20` | `margin: 20px 0` |
| `mx-{数字}` | 左右外边距 | `mx-30` | `margin: 0 30px` |
| `mb-{数字}` | 底部外边距 | `mb-40` | `margin-bottom: 40px` |
| `ml-{数字}` | 左侧外边距 | `ml-50` | `margin-left: 50px` |

### 2️⃣ 内边距 (Padding)

| 类名 | 说明 | 示例 | 生成样式 |
|------|------|------|----------|
| `p-{数字}` | 四周内边距 | `p-15` | `padding: 15px` |
| `px-{数字}` | 左右内边距 | `px-25` | `padding-left: 25px; padding-right: 25px` |
| `py-{数字}` | 上下内边距 | `py-35` | `padding-top: 35px; padding-bottom: 35px` |
| `pb-{数字}` | 底部内边距 | `pb-45` | `padding-bottom: 45px` |

### 3️⃣ 宽度和高度 (Width & Height)

| 类名 | 说明 | 示例 | 生成样式 |
|------|------|------|----------|
| `w-{数字}` | 宽度 | `w-100` | `width: 100px` |
| `h-{数字}` | 高度 | `h-200` | `height: 200px` |
| `wh-{数字}` | 宽高相等 | `wh-50` | `width: 50px; height: 50px` |
| `w-{数字}%` | 百分比宽度 | `w-100%` | `width: 100%` |
| `wMin-{数字}%` | 最小宽度 | `wMin-50%` | `min-width: 50%` |
| `wMax-{数字}%` | 最大宽度 | `wMax-80%` | `max-width: 80%` |
| `h-100%` | 100%高度 | `h-100%` | `height: 100%` |

### 4️⃣ 字体 (Font)

| 类名 | 说明 | 生成样式 |
|------|------|----------|
| `fsize-{数字}` | 字体大小 | `font-size: {数字}px` |
| `font-pingfang` | 苹方字体 | `font-family: 'PingFang SC'` |
| `font-source` | 思源字体 | `font-family: 'Source Han Sans CN'` |
| `font-microsoft` | 微软雅黑 | `font-family: 'Microsoft YaHei'` |
| `font-inter` | Inter字体 | `font-family: 'Inter'` |
| `font-roboto` | Roboto字体 | `font-family: 'Roboto'` |
| `font-miSans` | MiSans字体 | `font-family: 'MiSans'` |

### 5️⃣ 间距 (Gap)

| 类名 | 说明 | 示例 | 生成样式 |
|------|------|------|----------|
| `gap-{数字}` | Flex/Grid间距 | `gap-20` | `gap: 20px` |

---

## 🚀 推荐补充的常用配置

### 6️⃣ 完整的边距配置

```javascript
// 上边距
[/^mt-(\d+)$/, ([, d]) => ({ 'margin-top': `${d}px` })],
// 右边距
[/^mr-(\d+)$/, ([, d]) => ({ 'margin-right': `${d}px` })],
// 上内边距
[/^pt-(\d+)$/, ([, d]) => ({ 'padding-top': `${d}px` })],
// 右内边距
[/^pr-(\d+)$/, ([, d]) => ({ 'padding-right': `${d}px` })],
// 左内边距
[/^pl-(\d+)$/, ([, d]) => ({ 'padding-left': `${d}px` })],
```

### 7️⃣ 行高和字重

```javascript
// 行高
[/^leading-(\d+)$/, ([, l]) => ({ 'line-height': `${l}px` })],
[/^leading-(\d+\.?\d*)$/, ([, l]) => ({ 'line-height': l })],
// 字重
['font-100', { 'font-weight': '100' }],
['font-200', { 'font-weight': '200' }],
['font-300', { 'font-weight': '300' }],
['font-400', { 'font-weight': '400' }],
['font-500', { 'font-weight': '500' }],
['font-600', { 'font-weight': '600' }],
['font-700', { 'font-weight': '700' }],
['font-800', { 'font-weight': '800' }],
['font-900', { 'font-weight': '900' }],
```

### 8️⃣ 圆角

```javascript
[/^rounded-(\d+)$/, ([, r]) => ({ 'border-radius': `${r}px` })],
['rounded-full', { 'border-radius': '9999px' }],
['rounded-none', { 'border-radius': '0' }],
```

### 9️⃣ 定位

```javascript
// 定位类型
['relative', { position: 'relative' }],
['absolute', { position: 'absolute' }],
['fixed', { position: 'fixed' }],
['sticky', { position: 'sticky' }],
// top/right/bottom/left
[/^top-(\d+)$/, ([, t]) => ({ top: `${t}px` })],
[/^right-(\d+)$/, ([, r]) => ({ right: `${r}px` })],
[/^bottom-(\d+)$/, ([, b]) => ({ bottom: `${b}px` })],
[/^left-(\d+)$/, ([, l]) => ({ left: `${l}px` })],
```

### 🔟 层级和显示

```javascript
// z-index
[/^z-(\d+)$/, ([, z]) => ({ 'z-index': z })],
// display
['block', { display: 'block' }],
['inline-block', { display: 'inline-block' }],
['inline', { display: 'inline' }],
['flex', { display: 'flex' }],
['inline-flex', { display: 'inline-flex' }],
['grid', { display: 'grid' }],
['hidden', { display: 'none' }],
```

### 1️⃣1️⃣ Flex 布局

```javascript
// flex-direction
['flex-row', { 'flex-direction': 'row' }],
['flex-col', { 'flex-direction': 'column' }],
['flex-row-reverse', { 'flex-direction': 'row-reverse' }],
['flex-col-reverse', { 'flex-direction': 'column-reverse' }],
// justify-content
['justify-start', { 'justify-content': 'flex-start' }],
['justify-end', { 'justify-content': 'flex-end' }],
['justify-center', { 'justify-content': 'center' }],
['justify-between', { 'justify-content': 'space-between' }],
['justify-around', { 'justify-content': 'space-around' }],
['justify-evenly', { 'justify-content': 'space-evenly' }],
// align-items
['items-start', { 'align-items': 'flex-start' }],
['items-end', { 'align-items': 'flex-end' }],
['items-center', { 'align-items': 'center' }],
['items-baseline', { 'align-items': 'baseline' }],
['items-stretch', { 'align-items': 'stretch' }],
// flex-wrap
['flex-wrap', { 'flex-wrap': 'wrap' }],
['flex-nowrap', { 'flex-wrap': 'nowrap' }],
// flex
[/^flex-(\d+)$/, ([, f]) => ({ flex: f })],
['flex-1', { flex: '1 1 0%' }],
['flex-auto', { flex: '1 1 auto' }],
['flex-none', { flex: 'none' }],
```

### 1️⃣2️⃣ 透明度和溢出

```javascript
// opacity
[/^opacity-(\d+)$/, ([, o]) => ({ opacity: `0.${o}` })],
['opacity-0', { opacity: '0' }],
['opacity-100', { opacity: '1' }],
// overflow
['overflow-hidden', { overflow: 'hidden' }],
['overflow-auto', { overflow: 'auto' }],
['overflow-scroll', { overflow: 'scroll' }],
['overflow-x-hidden', { 'overflow-x': 'hidden' }],
['overflow-y-hidden', { 'overflow-y': 'hidden' }],
['overflow-x-auto', { 'overflow-x': 'auto' }],
['overflow-y-auto', { 'overflow-y': 'auto' }],
```

### 1️⃣3️⃣ 文本对齐和装饰

```javascript
// text-align
['text-left', { 'text-align': 'left' }],
['text-center', { 'text-align': 'center' }],
['text-right', { 'text-align': 'right' }],
['text-justify', { 'text-align': 'justify' }],
// text-decoration
['underline', { 'text-decoration': 'underline' }],
['line-through', { 'text-decoration': 'line-through' }],
['no-underline', { 'text-decoration': 'none' }],
// white-space
['whitespace-normal', { 'white-space': 'normal' }],
['whitespace-nowrap', { 'white-space': 'nowrap' }],
['whitespace-pre', { 'white-space': 'pre' }],
['whitespace-pre-wrap', { 'white-space': 'pre-wrap' }],
// text-overflow
['truncate', { 
  overflow: 'hidden', 
  'text-overflow': 'ellipsis', 
  'white-space': 'nowrap' 
}],
```

### 1️⃣4️⃣ 边框

```javascript
// border-width
[/^border-(\d+)$/, ([, b]) => ({ 'border-width': `${b}px` })],
['border', { 'border-width': '1px' }],
['border-t', { 'border-top-width': '1px' }],
['border-r', { 'border-right-width': '1px' }],
['border-b', { 'border-bottom-width': '1px' }],
['border-l', { 'border-left-width': '1px' }],
// border-style
['border-solid', { 'border-style': 'solid' }],
['border-dashed', { 'border-style': 'dashed' }],
['border-dotted', { 'border-style': 'dotted' }],
['border-none', { 'border-style': 'none' }],
```

### 1️⃣5️⃣ 光标和用户选择

```javascript
// cursor
['cursor-pointer', { cursor: 'pointer' }],
['cursor-default', { cursor: 'default' }],
['cursor-not-allowed', { cursor: 'not-allowed' }],
['cursor-move', { cursor: 'move' }],
// user-select
['select-none', { 'user-select': 'none' }],
['select-text', { 'user-select': 'text' }],
['select-all', { 'user-select': 'all' }],
['select-auto', { 'user-select': 'auto' }],
```

---

## 💡 使用示例

### 示例 1: 按钮组件
```vue
<template>
  <button class="
    px-32 py-16 
    bg-[#D3ED06] 
    rounded-20 
    fsize-22 
    font-roboto 
    font-500
    cursor-pointer
    flex items-center justify-center
    gap-10
  ">
    <span>Connect Wallet</span>
  </button>
</template>
```

### 示例 2: 卡片布局
```vue
<template>
  <div class="
    w-100% 
    p-30 
    my-20
    rounded-16
    flex flex-col
    gap-20
    bg-[#FFFFFF]
    relative
  ">
    <h3 class="fsize-32 font-600 font-pingfang">标题</h3>
    <p class="fsize-24 font-400 leading-36 text-[#666666]">内容文本</p>
  </div>
</template>
```

### 示例 3: 图片容器（按设计稿尺寸）
```vue
<template>
  <!-- 设计稿是 73px × 73px，直接写 73 -->
  <van-image width="73" height="73" :src="logo" />
  
  <!-- 或使用原子类 -->
  <div class="wh-73 rounded-full overflow-hidden">
    <img :src="logo" alt="logo" class="w-100% h-100%" />
  </div>
</template>
```

---

## ⚠️ 注意事项

1. **设计稿尺寸直接使用**: 因为配置了 postcss-px2vp，所以按设计稿尺寸写即可
2. **Vant 组件特殊处理**: Vant 组件按 375px 基准，会自动识别
3. **不要混用单位**: 统一使用 px，让 postcss-px2vp 自动转换
4. **颜色使用方括号**: `bg-[#D3ED06]` `text-[#FFFFFF]`
5. **自定义值**: UnoCSS 支持任意值，如 `w-[375px]` `mt-[23px]`

---

## 📦 快速配置完整版

如需要完整的推荐配置，请看 `uno.config.js` 文件更新版本。

---

## 🔧 常见问题

### Q1: 图片尺寸显示不正确？
**A**: 检查是否按设计稿尺寸写。设计稿 73px 应该写 `width="73"`，不是 `width="34"`。

### Q2: 原子类不生效？
**A**: 确保已在 `main.js` 中导入 UnoCSS：
```javascript
import 'uno.css'
```

### Q3: 如何使用自定义颜色？
**A**: 使用方括号语法：
```vue
<div class="bg-[#D3ED06] text-[#FFFFFF]"></div>
```

### Q4: Flex 布局快速居中？
**A**: 
```vue
<div class="flex items-center justify-center">
  居中内容
</div>
```

---

📅 **最后更新**: 2026-01-12  
📝 **版本**: v1.0  
👨‍💻 **维护者**: 项目团队
