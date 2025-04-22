<template>
  <div class="user">
    <Header />

    <div class="user-content">
      <!-- 条件渲染侧边栏 -->
      <div class="user-content-left" v-if="showSidebar">
        <MineInfosView />
      </div>
      <div class="user-content-right">
        <router-view />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import Header from '/@/views/index/components/header.vue';
  import Footer from '/@/views/index/components/footer.vue';
  import MineInfosView from '/@/views/index/user/mine-infos-view.vue';

  const route = useRoute();

  // 定义不需要显示侧边栏的路由名称列表
  const routesWithoutSidebar = ['founditemView', 'jiajiaoEditView'];

  // 计算属性：判断是否应显示侧边栏
  const showSidebar = computed(() => {
    // 如果当前路由的 name 不在排除列表中，则显示侧边栏
    return !routesWithoutSidebar.includes(route.name);
  });

  // 如果需要保留 Options API 的 data，可以这样写，但在此场景下不需要
  // import { ref } from 'vue';
  // const collapsed = ref(false);

</script>

<style scoped lang="less">
  .user {
    display: block;
    background-image: url('/bg_main.jpg'); // 使用根路径引用 public 目录中的文件
    background-size: cover;
    background-position: center;
    opacity: 0.8; // 设置透明度
  }

  .user-content {
    display: flex;
    flex-direction: row;
    //background-color: #2a9a44;
    max-width: 1200px;
    min-width: 800px; /* 保持最小宽度 */
    margin: 76px auto;
    .user-content-left {
      background-color: #f8f1e6cf;
      flex-shrink: 0; /* 防止侧边栏被压缩 */
    }
    .user-content-right {
      flex: 1; /* 右侧内容区域占据剩余空间 */
      /* 移除固定的 padding-right，让内容自适应 */
      /* padding-right: 20px; */
      /* 可以添加内边距来控制内容与边缘的距离 */
       padding: 0 20px; /* 例如左右添加内边距 */
       min-width: 0; /* 允许右侧内容区域收缩 */
    }
  }
</style>
