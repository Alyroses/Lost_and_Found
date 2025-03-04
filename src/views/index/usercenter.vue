<template>
  <div class="user">
    <Header />

    <div class="user-content">
      <div class="user-content-left">
        <MineInfosView />
      </div>
      <div class="user-content-right">
        <router-view />
      </div>
    </div>

    <Footer />
  </div>
</template>
<script>
  import Header from '/@/views/index/components/header.vue';
  import Footer from '/@/views/index/components/footer.vue';
  import MineInfosView from '/@/views/index/user/mine-infos-view.vue';

  export default {
    components: {
      MineInfosView,
      Footer,
      Header,
    },
    data() {
      return {
        collapsed: false,
      };
    },
  };
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
    min-width: 800px;
    margin: 80px auto;
    .user-content-left {
      background-color: #f8f1e6cf;
    }
    .user-content-right {
      flex: 1;
      padding-right: 20px;
    }
  }
</style>
