<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>
<script setup lang="ts">

import zhCN from 'ant-design-vue/es/locale/zh_CN';

</script>

<style>

  #app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  height: 100vh;
  background-image: url('/bg_main.jpg'); 
  background-size: cover;
  background-position: center;
  opacity: 0.8; 
}
</style>
