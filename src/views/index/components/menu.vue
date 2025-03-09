<template>
  <a-menu
    style="overflow: auto; overflow-x: hidden"
    v-model:selectedKeys="selectedKeys"
    mode="inline"
    @click="handleClick"
    class="custom-menu"
  >
    <!-- ...existing code... -->
  </a-menu>
</template>

<script setup>
// ...existing code...
</script>

<style scoped lang="less">
.custom-menu {
  background-color: #ffe4e1; // 设置菜单背景颜色为粉色
  .ant-menu-item {
    color: #ff69b4; // 设置菜单项文字颜色为粉色
    &:hover {
      background-color: #ffb6c1; // 设置菜单项悬停背景颜色为浅粉色
    }
    &.ant-menu-item-selected {
      background-color: #ff1493; // 设置选中菜单项背景颜色为深粉色
      color: #fff; // 设置选中菜单项文字颜色为白色
    }
  }
  .ant-menu-submenu-title {
    color: #ff69b4; // 设置子菜单标题文字颜色为粉色
    &:hover {
      background-color: #ffb6c1; // 设置子菜单标题悬停背景颜色为浅粉色
    }
  }
  .ant-menu-submenu-arrow {
    color: #ff69b4; // 设置子菜单箭头颜色为粉色
  }
}
</style>
