# 🚀 UnoCSS 原子类快速参考表

> **设计稿基准**: 750px  
> **自动转换**: postcss-px2vp（750px → vw）  
> **使用原则**: 设计稿是多少px就写多少，例如 73px → `width="73"`

---

## 📏 尺寸类

| 类型 | 语法 | 示例 | 效果 |
|------|------|------|------|
| **宽度** | `w-{数字}` | `w-100` | width: 100px |
| **高度** | `h-{数字}` | `h-200` | height: 200px |
| **宽高相等** | `wh-{数字}` | `wh-50` | width: 50px; height: 50px |
| **百分比宽度** | `w-{数字}%` | `w-100%` | width: 100% |
| **满宽** | `w-full` / `w-100%` | - | width: 100% |
| **满高** | `h-full` / `h-100%` | - | height: 100% |
| **最小宽度** | `wMin-{数字}` | `wMin-300` | min-width: 300px |
| **最大宽度** | `wMax-{数字}` | `wMax-600` | max-width: 600px |

---

## 📦 间距类

### 外边距 (Margin)
| 方向 | 语法 | 示例 | 效果 |
|------|------|------|------|
| 全部 | `m-{数字}` | `m-20` | margin: 20px |
| 上下 | `my-{数字}` | `my-30` | margin: 30px 0 |
| 左右 | `mx-{数字}` | `mx-40` | margin: 0 40px |
| 上 | `mt-{数字}` | `mt-10` | margin-top: 10px |
| 右 | `mr-{数字}` | `mr-15` | margin-right: 15px |
| 下 | `mb-{数字}` | `mb-20` | margin-bottom: 20px |
| 左 | `ml-{数字}` | `ml-25` | margin-left: 25px |

### 内边距 (Padding)
| 方向 | 语法 | 示例 | 效果 |
|------|------|------|------|
| 全部 | `p-{数字}` | `p-20` | padding: 20px |
| 上下 | `py-{数字}` | `py-30` | padding: 30px 0 |
| 左右 | `px-{数字}` | `px-40` | padding: 0 40px |
| 上 | `pt-{数字}` | `pt-10` | padding-top: 10px |
| 右 | `pr-{数字}` | `pr-15` | padding-right: 15px |
| 下 | `pb-{数字}` | `pb-20` | padding-bottom: 20px |
| 左 | `pl-{数字}` | `pl-25` | padding-left: 25px |

---

## ✨ 文字类

### 字体大小
```
fsize-{数字}  或  text-{数字}
示例: fsize-28 → font-size: 28px
```

### 字体粗细
| 类名 | 效果 | 数值 |
|------|------|------|
| `font-thin` | 最细 | 100 |
| `font-light` | 细 | 300 |
| `font-normal` | 正常 | 400 |
| `font-medium` | 中等 | 500 |
| `font-semibold` | 半粗 | 600 |
| `font-bold` | 粗体 | 700 |
| `font-black` | 最粗 | 900 |
| `font-{数字}` | 自定义 | `font-500` |

### 字体家族
| 类名 | 字体 |
|------|------|
| `font-pingfang` | PingFang SC（苹方） |
| `font-source` | Source Han Sans CN（思源黑体） |
| `font-microsoft` | Microsoft YaHei（微软雅黑） |
| `font-inter` | Inter |
| `font-roboto` | Roboto |
| `font-miSans` | MiSans |

### 行高
```
leading-{数字}  或  lh-{数字}
示例: leading-40 → line-height: 40px

预设值:
leading-none      → 1
leading-tight     → 1.25
leading-normal    → 1.5
leading-loose     → 2
```

### 文本对齐
| 类名 | 效果 |
|------|------|
| `text-left` | 左对齐 |
| `text-center` | 居中 |
| `text-right` | 右对齐 |
| `text-justify` | 两端对齐 |

### 文本装饰
| 类名 | 效果 |
|------|------|
| `underline` | 下划线 |
| `line-through` | 删除线 |
| `no-underline` | 无装饰 |
| `truncate` | 单行省略号 |

---

## 🎨 布局类

### Flex 布局
```vue
<!-- 基础 Flex -->
<div class="flex">...</div>
<div class="inline-flex">...</div>

<!-- 方向 -->
flex-row         水平排列（默认）
flex-col         垂直排列
flex-row-reverse 水平反向
flex-col-reverse 垂直反向

<!-- 主轴对齐 -->
justify-start    起点对齐
justify-center   居中对齐
justify-end      终点对齐
justify-between  两端对齐
justify-around   环绕对齐
justify-evenly   均匀分布

<!-- 交叉轴对齐 -->
items-start      起点对齐
items-center     居中对齐
items-end        终点对齐
items-baseline   基线对齐
items-stretch    拉伸填充

<!-- 换行 -->
flex-wrap        允许换行
flex-nowrap      不换行

<!-- Flex 属性 -->
flex-1          flex: 1 1 0%
flex-auto       flex: 1 1 auto
flex-none       flex: none
```

### 间距
```
gap-{数字}      整体间距
gap-x-{数字}    水平间距
gap-y-{数字}    垂直间距

示例: gap-20 → gap: 20px
```

---

## 🎯 定位类

### 定位类型
| 类名 | 效果 |
|------|------|
| `static` | 静态定位（默认） |
| `relative` | 相对定位 |
| `absolute` | 绝对定位 |
| `fixed` | 固定定位 |
| `sticky` | 粘性定位 |

### 位置偏移
```
top-{数字}      top: {数字}px
right-{数字}    right: {数字}px
bottom-{数字}   bottom: {数字}px
left-{数字}     left: {数字}px

快捷方式:
top-0, right-0, bottom-0, left-0
inset-0  →  所有方向都为0
```

### 层级
```
z-{数字}    z-index: {数字}
z-auto      z-index: auto

示例: z-10, z-50, z-999
```

---

## 🎭 显示类

### Display
| 类名 | 效果 |
|------|------|
| `block` | display: block |
| `inline-block` | display: inline-block |
| `inline` | display: inline |
| `flex` | display: flex |
| `inline-flex` | display: inline-flex |
| `grid` | display: grid |
| `hidden` | display: none |

### 溢出
| 类名 | 效果 |
|------|------|
| `overflow-auto` | 自动滚动 |
| `overflow-hidden` | 隐藏溢出 |
| `overflow-scroll` | 强制滚动条 |
| `overflow-x-auto` | 水平自动滚动 |
| `overflow-y-auto` | 垂直自动滚动 |

### 透明度
```
opacity-{数字}    0-100之间

示例:
opacity-0     → 完全透明
opacity-50    → 半透明
opacity-100   → 完全不透明
```

---

## 🎪 装饰类

### 圆角
```
rounded-{数字}    自定义圆角 px

预设值:
rounded-none    → 0
rounded-sm      → 2px
rounded         → 4px
rounded-md      → 6px
rounded-lg      → 8px
rounded-xl      → 12px
rounded-2xl     → 16px
rounded-3xl     → 24px
rounded-full    → 9999px (圆形)
```

### 边框
```
border-{数字}    边框宽度
border           1px边框
border-0         无边框

方向:
border-t    上边框
border-r    右边框
border-b    下边框
border-l    左边框

样式:
border-solid    实线
border-dashed   虚线
border-dotted   点线
border-none     无边框
```

---

## 🖱️ 交互类

### 光标
| 类名 | 效果 |
|------|------|
| `cursor-auto` | 自动 |
| `cursor-default` | 默认箭头 |
| `cursor-pointer` | 手型指针 |
| `cursor-wait` | 等待 |
| `cursor-text` | 文本选择 |
| `cursor-move` | 移动 |
| `cursor-not-allowed` | 禁止 |

### 用户选择
| 类名 | 效果 |
|------|------|
| `select-none` | 禁止选择 |
| `select-text` | 允许文本选择 |
| `select-all` | 点击全选 |
| `select-auto` | 自动 |

### 指针事件
| 类名 | 效果 |
|------|------|
| `pointer-events-none` | 禁用鼠标事件 |
| `pointer-events-auto` | 启用鼠标事件 |

---

## 💡 常用组合示例

### 1. 居中容器
```vue
<div class="flex items-center justify-center">
  居中内容
</div>
```

### 2. 按钮样式
```vue
<button class="
  px-32 py-16 
  rounded-20 
  fsize-24 
  font-medium
  cursor-pointer
  bg-[#D3ED06]
  text-[#000000]
">
  按钮文字
</button>
```

### 3. 卡片布局
```vue
<div class="
  w-full 
  p-30 
  rounded-16 
  bg-[#FFFFFF]
  flex flex-col 
  gap-20
">
  <h3 class="fsize-32 font-600">标题</h3>
  <p class="fsize-24 leading-36">内容</p>
</div>
```

### 4. 头像容器
```vue
<!-- 设计稿 73px × 73px -->
<div class="wh-73 rounded-full overflow-hidden">
  <img :src="avatar" class="w-full h-full" />
</div>
```

### 5. 固定底部按钮
```vue
<div class="fixed bottom-0 left-0 w-full p-30 bg-[#FFFFFF]">
  <button class="w-full py-20 rounded-16">提交</button>
</div>
```

### 6. 响应式间距网格
```vue
<div class="flex flex-wrap gap-20">
  <div class="w-[calc(50%-10px)] p-20">项目1</div>
  <div class="w-[calc(50%-10px)] p-20">项目2</div>
</div>
```

---

## 🎨 自定义值语法

UnoCSS 支持任意自定义值，使用方括号：

```vue
<!-- 颜色 -->
<div class="bg-[#D3ED06] text-[#FFFFFF] border-[#00C18D]">

<!-- 尺寸 -->
<div class="w-[375px] h-[667px] p-[23px]">

<!-- 计算值 -->
<div class="w-[calc(100%-40px)] mt-[calc(50vh-100px)]">

<!-- 渐变 -->
<div class="bg-[linear-gradient(90deg,#fff,#000)]">
```

---

## 📌 重要提醒

### ✅ 正确做法
```vue
<!-- 设计稿是 73px，直接写 73 -->
<van-image width="73" height="73" :src="logo" />

<!-- 使用原子类 -->
<div class="wh-73 rounded-full">
```

### ❌ 错误做法
```vue
<!-- ❌ 不要除以2 -->
<van-image width="36.5" height="36.5" :src="logo" />

<!-- ❌ 不要使用rem、em等单位 -->
<div class="w-[3.65rem]">
```

### 🔧 配置说明
- **750px 设计稿**: 你的自定义代码按 750px 转换
- **375px 基准**: Vant 组件库按 375px 转换
- **自动转换**: postcss-px2vp 会自动处理，无需手动计算

---

## 🔗 相关文档

- [完整配置文档](./UnoCSS-原子化配置文档.md)
- [UnoCSS 官方文档](https://unocss.dev/)
- [项目配置](./vite.config.js) - 查看 postcss-px2vp 配置

---

📅 **最后更新**: 2026-01-12  
💡 **提示**: 收藏此文档，开发时随时查阅！
