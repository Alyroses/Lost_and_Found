import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import piniaStore from './store';

import Antd from 'ant-design-vue';
// 引入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
import bootstrap from './core/bootstrap';
import '/@/styles/index.less';
import '/@/styles/reset.less';

const app = createApp(App);
app.use(ElementPlus);
app.use(Antd);
app.use(router);
app.use(piniaStore);
app.use(bootstrap);
app.mount('#app');
