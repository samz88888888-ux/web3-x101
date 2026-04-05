import { createApp } from 'vue'
import { Empty,showLoadingToast,Popover,RadioGroup, Radio,Overlay,Image as VanImage,Dialog,Popup,Loading,Lazyload,PullRefresh,Swipe,SwipeItem } from 'vant'

const app = createApp()
app.use(RadioGroup)
app.use(Radio)
app.use(VanImage)
app.use(Dialog)
app.use(Popup)
app.use(Loading)
app.use(Lazyload)
app.use(PullRefresh)
app.use(Swipe)
app.use(SwipeItem)
app.use(Overlay)
app.use(Popover)
app.use(showLoadingToast)
app.use(Empty)
export default app