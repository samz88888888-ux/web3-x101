import { defineConfig } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  rules: [
    // ============ 外边距 Margin ============
    [/^m-(\d+)$/, ([, d]) => ({ margin: `${d}px` })],
    [/^my-(\d+)$/, ([, d]) => ({ margin: `${d}px 0` })],
    [/^mx-(\d+)$/, ([, d]) => ({ margin: `0 ${d}px` })],
    [/^mt-(\d+)$/, ([, d]) => ({ 'margin-top': `${d}px` })],
    [/^mr-(\d+)$/, ([, d]) => ({ 'margin-right': `${d}px` })],
    [/^mb-(\d+)$/, ([, d]) => ({ 'margin-bottom': `${d}px` })],
    [/^ml-(\d+)$/, ([, d]) => ({ 'margin-left': `${d}px` })],
    // 负边距（使用 - 前缀）
    [/^-m-(\d+)$/, ([, d]) => ({ margin: `-${d}px` })],
    [/^-my-(\d+)$/, ([, d]) => ({ margin: `-${d}px 0` })],
    [/^-mx-(\d+)$/, ([, d]) => ({ margin: `0 -${d}px` })],
    [/^-mt-(\d+)$/, ([, d]) => ({ 'margin-top': `-${d}px` })],
    [/^-mr-(\d+)$/, ([, d]) => ({ 'margin-right': `-${d}px` })],
    [/^-mb-(\d+)$/, ([, d]) => ({ 'margin-bottom': `-${d}px` })],
    [/^-ml-(\d+)$/, ([, d]) => ({ 'margin-left': `-${d}px` })],
    
    // ============ 内边距 Padding ============
    [/^p-(\d+)$/, ([, d]) => ({ padding: `${d}px` })],
    [/^px-(\d+)$/, ([, d]) => ({ 'padding-left': `${d}px`, 'padding-right': `${d}px` })],
    [/^py-(\d+)$/, ([, d]) => ({ 'padding-top': `${d}px`, 'padding-bottom': `${d}px` })],
    [/^pt-(\d+)$/, ([, d]) => ({ 'padding-top': `${d}px` })],
    [/^pr-(\d+)$/, ([, d]) => ({ 'padding-right': `${d}px` })],
    [/^pb-(\d+)$/, ([, d]) => ({ 'padding-bottom': `${d}px` })],
    [/^pl-(\d+)$/, ([, d]) => ({ 'padding-left': `${d}px` })],
    
    // ============ 宽度和高度 Width & Height ============
    [/^w-(\d+)$/, ([, w]) => ({ width: `${w}px` })],
    [/^h-(\d+)$/, ([, h]) => ({ height: `${h}px` })],
    [/^wh-(\d+)$/, ([, wh]) => ({ width: `${wh}px`, height: `${wh}px` })],
    // 支持带px的写法（兼容性更好）
    [/^wh-(\d+)px$/, ([, wh]) => ({ width: `${wh}px`, height: `${wh}px` })],
    [/^w-(\d+)%$/, ([, w]) => ({ width: `${w}%` })],
    [/^h-(\d+)%$/, ([, h]) => ({ height: `${h}%` })],
    [/^wMin-(\d+)$/, ([, w]) => ({ 'min-width': `${w}px` })],
    [/^wMax-(\d+)$/, ([, w]) => ({ 'max-width': `${w}px` })],
    [/^wMin-(\d+)%$/, ([, w]) => ({ 'min-width': `${w}%` })],
    [/^wMax-(\d+)%$/, ([, w]) => ({ 'max-width': `${w}%` })],
    [/^hMin-(\d+)$/, ([, h]) => ({ 'min-height': `${h}px` })],
    [/^hMax-(\d+)$/, ([, h]) => ({ 'max-height': `${h}px` })],
    ['w-100%', { width: '100%' }],
    ['h-100%', { height: '100%' }],
    ['w-full', { width: '100%' }],
    ['h-full', { height: '100%' }],
    
    // ============ 字体大小 Font Size ============
    [/^fsize-(\d+)$/, ([, s]) => ({ 'font-size': `${s}px` })],
    [/^text-(\d+)$/, ([, s]) => ({ 'font-size': `${s}px` })],
    
    // ============ 字重 Font Weight ============
    [/^font-(\d+)$/, ([, w]) => ({ 'font-weight': w })],
    ['font-thin', { 'font-weight': '100' }],
    ['font-extralight', { 'font-weight': '200' }],
    ['font-light', { 'font-weight': '300' }],
    ['font-normal', { 'font-weight': '400' }],
    ['font-medium', { 'font-weight': '500' }],
    ['font-semibold', { 'font-weight': '600' }],
    ['font-bold', { 'font-weight': '700' }],
    ['font-extrabold', { 'font-weight': '800' }],
    ['font-black', { 'font-weight': '900' }],
    
    // ============ 字体家族 Font Family ============
    ['font-pingfang', { 'font-family': 'PingFang SC' }],
    ['font-source', { 'font-family': 'Source Han Sans CN' }],
    ['font-microsoft', { 'font-family': 'Microsoft YaHei' }],
    ['font-inter', { 'font-family': 'Inter' }],
    ['font-roboto', { 'font-family': 'Roboto' }],
    ['font-miSans', { 'font-family': 'MiSans' }],
    
    // ============ 行高 Line Height ============
    [/^leading-(\d+)$/, ([, l]) => ({ 'line-height': `${l}px` })],
    [/^lh-(\d+)$/, ([, l]) => ({ 'line-height': `${l}px` })],
    ['leading-none', { 'line-height': '1' }],
    ['leading-tight', { 'line-height': '1.25' }],
    ['leading-snug', { 'line-height': '1.375' }],
    ['leading-normal', { 'line-height': '1.5' }],
    ['leading-relaxed', { 'line-height': '1.625' }],
    ['leading-loose', { 'line-height': '2' }],
    
    // ============ 圆角 Border Radius ============
    [/^rounded-(\d+)$/, ([, r]) => ({ 'border-radius': `${r}px` })],
    ['rounded-none', { 'border-radius': '0' }],
    ['rounded-sm', { 'border-radius': '2px' }],
    ['rounded', { 'border-radius': '4px' }],
    ['rounded-md', { 'border-radius': '6px' }],
    ['rounded-lg', { 'border-radius': '8px' }],
    ['rounded-xl', { 'border-radius': '12px' }],
    ['rounded-2xl', { 'border-radius': '16px' }],
    ['rounded-3xl', { 'border-radius': '24px' }],
    ['rounded-full', { 'border-radius': '9999px' }],
    
    // ============ Flex布局相关 ============
    [/^gap-(\d+)$/, ([, g]) => ({ gap: `${g}px` })],
    [/^gap-x-(\d+)$/, ([, g]) => ({ 'column-gap': `${g}px` })],
    [/^gap-y-(\d+)$/, ([, g]) => ({ 'row-gap': `${g}px` })],
    ['flex', { display: 'flex' }],
    ['inline-flex', { display: 'inline-flex' }],
    ['flex-row', { 'flex-direction': 'row' }],
    ['flex-col', { 'flex-direction': 'column' }],
    ['flex-row-reverse', { 'flex-direction': 'row-reverse' }],
    ['flex-col-reverse', { 'flex-direction': 'column-reverse' }],
    ['flex-wrap', { 'flex-wrap': 'wrap' }],
    ['flex-nowrap', { 'flex-wrap': 'nowrap' }],
    ['flex-wrap-reverse', { 'flex-wrap': 'wrap-reverse' }],
    ['justify-start', { 'justify-content': 'flex-start' }],
    ['justify-end', { 'justify-content': 'flex-end' }],
    ['justify-center', { 'justify-content': 'center' }],
    ['justify-between', { 'justify-content': 'space-between' }],
    ['justify-around', { 'justify-content': 'space-around' }],
    ['justify-evenly', { 'justify-content': 'space-evenly' }],
    ['items-start', { 'align-items': 'flex-start' }],
    ['items-end', { 'align-items': 'flex-end' }],
    ['items-center', { 'align-items': 'center' }],
    ['items-baseline', { 'align-items': 'baseline' }],
    ['items-stretch', { 'align-items': 'stretch' }],
    [/^flex-(\d+)$/, ([, f]) => ({ flex: f })],
    ['flex-1', { flex: '1 1 0%' }],
    ['flex-auto', { flex: '1 1 auto' }],
    ['flex-initial', { flex: '0 1 auto' }],
    ['flex-none', { flex: 'none' }],
    
    // ============ 定位 Position ============
    ['static', { position: 'static' }],
    ['fixed', { position: 'fixed' }],
    ['absolute', { position: 'absolute' }],
    ['relative', { position: 'relative' }],
    ['sticky', { position: 'sticky' }],
    [/^top-(\d+)$/, ([, t]) => ({ top: `${t}px` })],
    [/^right-(\d+)$/, ([, r]) => ({ right: `${r}px` })],
    [/^bottom-(\d+)$/, ([, b]) => ({ bottom: `${b}px` })],
    [/^left-(\d+)$/, ([, l]) => ({ left: `${l}px` })],
    ['top-0', { top: '0' }],
    ['right-0', { right: '0' }],
    ['bottom-0', { bottom: '0' }],
    ['left-0', { left: '0' }],
    ['inset-0', { top: '0', right: '0', bottom: '0', left: '0' }],
    
    // ============ 层级 Z-index ============
    [/^z-(\d+)$/, ([, z]) => ({ 'z-index': z })],
    ['z-auto', { 'z-index': 'auto' }],
    
    // ============ 显示 Display ============
    ['block', { display: 'block' }],
    ['inline-block', { display: 'inline-block' }],
    ['inline', { display: 'inline' }],
    ['grid', { display: 'grid' }],
    ['inline-grid', { display: 'inline-grid' }],
    ['hidden', { display: 'none' }],
    
    // ============ 透明度 Opacity ============
    [/^opacity-(\d+)$/, ([, o]) => ({ opacity: Number(o) / 100 })],
    ['opacity-0', { opacity: '0' }],
    ['opacity-25', { opacity: '0.25' }],
    ['opacity-50', { opacity: '0.5' }],
    ['opacity-75', { opacity: '0.75' }],
    ['opacity-100', { opacity: '1' }],
    
    // ============ 溢出 Overflow ============
    ['overflow-auto', { overflow: 'auto' }],
    ['overflow-hidden', { overflow: 'hidden' }],
    ['overflow-visible', { overflow: 'visible' }],
    ['overflow-scroll', { overflow: 'scroll' }],
    ['overflow-x-auto', { 'overflow-x': 'auto' }],
    ['overflow-y-auto', { 'overflow-y': 'auto' }],
    ['overflow-x-hidden', { 'overflow-x': 'hidden' }],
    ['overflow-y-hidden', { 'overflow-y': 'hidden' }],
    ['overflow-x-scroll', { 'overflow-x': 'scroll' }],
    ['overflow-y-scroll', { 'overflow-y': 'scroll' }],
    
    // ============ 文本对齐 Text Align ============
    ['text-left', { 'text-align': 'left' }],
    ['text-center', { 'text-align': 'center' }],
    ['text-right', { 'text-align': 'right' }],
    ['text-justify', { 'text-align': 'justify' }],
    
    // ============ 文本装饰 Text Decoration ============
    ['underline', { 'text-decoration': 'underline' }],
    ['line-through', { 'text-decoration': 'line-through' }],
    ['no-underline', { 'text-decoration': 'none' }],
    
    // ============ 文本溢出 Text Overflow ============
    ['truncate', { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }],
    ['text-ellipsis', { 'text-overflow': 'ellipsis' }],
    ['text-clip', { 'text-overflow': 'clip' }],
    
    // ============ 空白符 White Space ============
    ['whitespace-normal', { 'white-space': 'normal' }],
    ['whitespace-nowrap', { 'white-space': 'nowrap' }],
    ['whitespace-pre', { 'white-space': 'pre' }],
    ['whitespace-pre-line', { 'white-space': 'pre-line' }],
    ['whitespace-pre-wrap', { 'white-space': 'pre-wrap' }],
    
    // ============ 边框 Border ============
    [/^border-(\d+)$/, ([, b]) => ({ 'border-width': `${b}px` })],
    ['border', { 'border-width': '1px' }],
    ['border-0', { 'border-width': '0' }],
    ['border-t', { 'border-top-width': '1px' }],
    ['border-r', { 'border-right-width': '1px' }],
    ['border-b', { 'border-bottom-width': '1px' }],
    ['border-l', { 'border-left-width': '1px' }],
    // 单边边框宽度
    [/^border-t-(\d+)$/, ([, b]) => ({ 'border-top-width': `${b}px` })],
    [/^border-r-(\d+)$/, ([, b]) => ({ 'border-right-width': `${b}px` })],
    [/^border-b-(\d+)$/, ([, b]) => ({ 'border-bottom-width': `${b}px` })],
    [/^border-l-(\d+)$/, ([, b]) => ({ 'border-left-width': `${b}px` })],
    // 边框样式
    ['border-solid', { 'border-style': 'solid' }],
    ['border-dashed', { 'border-style': 'dashed' }],
    ['border-dotted', { 'border-style': 'dotted' }],
    ['border-none', { 'border-style': 'none' }],
    
    // ============ 光标 Cursor ============
    ['cursor-auto', { cursor: 'auto' }],
    ['cursor-default', { cursor: 'default' }],
    ['cursor-pointer', { cursor: 'pointer' }],
    ['cursor-wait', { cursor: 'wait' }],
    ['cursor-text', { cursor: 'text' }],
    ['cursor-move', { cursor: 'move' }],
    ['cursor-not-allowed', { cursor: 'not-allowed' }],
    
    // ============ 用户选择 User Select ============
    ['select-none', { 'user-select': 'none' }],
    ['select-text', { 'user-select': 'text' }],
    ['select-all', { 'user-select': 'all' }],
    ['select-auto', { 'user-select': 'auto' }],
    
    // ============ 指针事件 Pointer Events ============
    ['pointer-events-none', { 'pointer-events': 'none' }],
    ['pointer-events-auto', { 'pointer-events': 'auto' }],
    
    // ============ 背景模糊 Backdrop Filter ============
    [/^backdrop-blur-(\d+)$/, ([, b]) => ({ 'backdrop-filter': `blur(${b}px)` })],
    ['backdrop-blur-none', { 'backdrop-filter': 'none' }],
    ['backdrop-blur-sm', { 'backdrop-filter': 'blur(4px)' }],
    ['backdrop-blur', { 'backdrop-filter': 'blur(8px)' }],
    ['backdrop-blur-md', { 'backdrop-filter': 'blur(12px)' }],
    ['backdrop-blur-lg', { 'backdrop-filter': 'blur(16px)' }],
    ['backdrop-blur-xl', { 'backdrop-filter': 'blur(24px)' }],
    ['backdrop-blur-2xl', { 'backdrop-filter': 'blur(40px)' }],
    ['backdrop-blur-3xl', { 'backdrop-filter': 'blur(64px)' }],
  ]
})
