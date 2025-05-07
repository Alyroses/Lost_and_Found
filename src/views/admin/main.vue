<template>
  <a-layout id="components-layout-demo-custom-trigger">
    <!-- 修改 Header 背景色和内边距 -->
    <a-layout-header style="background: #fff; padding: 0 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
      <div class="header">
        <img class="header-logo" :src="logo" />
        <!-- 修改标题颜色 -->
        <span class="header-title" style="color:#c46e5b;">失物招领后台管理系统</span>
        <div class="empty"></div>
        <a-button style="margin-right: 24px" @click="handlePreview" class="header-button">
          <eye-outlined class="header-icon" />前台预览
        </a-button>
        <a-dropdown :trigger="['hover']">
          <div class="admin-area">
            <span class="admin-info">
              <img src="/images/管理员.svg" class="header-icon admin-icon" alt="管理员图标" />
              <span class="admin-name">管理员{{ userStore.admin_user_name }}</span>
            </span>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item key="logout">
                <a @click="handleLogout">退出登录</a>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </a-layout-header>
    <a-layout>
      <!-- 修改 Sider 背景色 -->
      <a-layout-sider v-model="collapsed" collapsible style="background: #fffaf5;">
        <a-menu
          style="overflow: auto; overflow-x: hidden"
          v-model:selectedKeys="selectedKeys"
          theme="light" 
          mode="inline"
          @click="handleClick"
        >
          <!-- 1. 用户管理 -->
          <a-menu-item key="user">
            <user-outlined />
            <span>用户管理</span>
          </a-menu-item>
          <!-- 2. 物品分类 -->
          <a-menu-item key="classification">
            <layout-outlined />
            <span>物品分类</span>
          </a-menu-item>
          <!-- 3. 标签管理 -->
          <a-menu-item key="tag">
            <tag-outlined />
            <span>标签管理</span>
          </a-menu-item>
          <!-- 4. 物品管理 (改为子菜单) -->
          <a-sub-menu key="thingSubMenu">
            <template #icon>
              <database-outlined />
            </template>
            <template #title>物品管理</template>
            <a-menu-item key="lostThingManage"> <!-- 新 Key -->
              <appstore-outlined />
              <span>失物发布管理</span>
            </a-menu-item>
            <a-menu-item key="foundThingManage"> <!-- 新 Key -->
              <appstore-outlined />
              <span>拾物发布管理</span>
            </a-menu-item>
            <a-menu-item key="thingMatchManage"> <!-- 新 Key -->
              <appstore-outlined />
              <span>物品匹配管理</span>
            </a-menu-item>
          </a-sub-menu>
          <!-- 5. 评论管理 -->
          <a-menu-item key="comment">
            <comment-outlined />
            <span>评论管理</span>
          </a-menu-item>
          <!-- 6. 通知公告 (移出子菜单) -->
          <!-- <a-menu-item key="consultation">
            <appstore-outlined />
            <span>通知公告</span>
          </a-menu-item> -->
          <!-- 7. 错误日志 (移出子菜单) -->
          <a-menu-item key="errorLog">
            <appstore-outlined />
            <span>错误日志</span>
          </a-menu-item>
          <!-- 8. 统计分析 -->
          <a-menu-item key="overview">
            <home-outlined />
            <span>统计分析</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content :style="{ margin: '16px 16px', minHeight: '200px', background: '#f0f2f5' }"> <!-- 添加内容区背景色 -->
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router';
import logo from '/@/assets/images/k-logo.png';

  import {
AppstoreOutlined,
CommentOutlined,
DatabaseOutlined,
HomeOutlined,
LayoutOutlined,
TagOutlined,
UserOutlined,
EyeOutlined, // 导入预览图标
} from '@ant-design/icons-vue';

  import { ref } from 'vue';
import { useUserStore } from '/@/store';

  const userStore = useUserStore();

  const selectedKeys = ref<any[]>([]);
  const collapsed = ref<boolean>(false);

  const router = useRouter();
  const route = useRoute();

  const handleClick = ({ item, key, keyPath }) => {
    console.log('点击路由===>', key);
    router.push({
      name: key,
    });
  };

  const handlePreview = () => {
    let text = router.resolve({ name: 'index' });
    window.open(text.href, '_blank');
  };

  onMounted(() => {
    console.log('当前路由===>', route.name);
    selectedKeys.value = [route.name];
  });

  const handleLogout = () => {
    userStore.adminLogout().then((res) => {
      router.push({ name: 'adminLogin' });
    });
  };
</script>
<style scoped lang="less">
  // header样式
  .header {
    display: flex;
    flex-direction: row;
    align-items: center; // 垂直居中
    // 移除内边距，因为已在 a-layout-header 设置
    // padding-left: 24px;
    // padding-right: 24px;

    .header-logo {
      width: 32px;
      height: 32px;
      cursor: pointer;
    }

    .header-title {
      margin-left: 16px;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      // color 已在 template 中设置
    }

    .header-button {
      display: inline-flex; // 使按钮内容垂直居中
      align-items: center;
      gap: 6px; // 图标和文字间距
    }

    .admin-info {
      display: inline-flex; // 使内容垂直居中
      align-items: center;
      gap: 6px; // 图标和文字间距
    }

    .header-icon {
      transition: transform 0.3s ease-in-out; // 添加过渡效果
      // 为 img 标签设置默认大小，如果需要的话
      width: 1em; // 保持与 antd 图标类似的大小
      height: 1em;
      vertical-align: -0.125em; // 尝试垂直对齐
    }

    // 按钮悬停时图标旋转
    .header-button:hover .header-icon {
       transform: rotate(360deg);
    }

    // 管理员信息悬停时图标放大
    .admin-info:hover .admin-icon {
       transform: scale(1.2); // 放大效果，可以调整数值
    }

    .empty {
      flex: 1;
    }

    .header-quit {
      margin-left: 12px;
    }

    .admin-area {
      display: inline-flex;
      align-items: center;
      margin-left: 16px; // 与按钮保持间距
      cursor: pointer; // 添加指针手势

      .admin-info {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        .admin-name {
          transition: color 0.3s ease, transform 0.3s ease; // 添加颜色和变换过渡
        }

        // 管理员信息悬停时图标放大
        &:hover .admin-icon {
           transform: scale(1.2);
        }
        // 管理员信息悬停时文字效果
        &:hover .admin-name {
           color: #d9534f; // 悬停时文字变红
           transform: scale(1.05); // 轻微放大
        }
      }
    }
  }

  #components-layout-demo-custom-trigger {
    height: 100%;
  }

  #components-layout-demo-custom-trigger .trigger {
    font-size: 18px;
    line-height: 64px;
    padding: 0 24px;
    cursor: pointer;
    transition: color 0.3s;
  }

  #components-layout-demo-custom-trigger .trigger:hover {
    color: #1890ff;
  }

  :deep(.ant-layout-content) {
    overflow-x: hidden;
  }

  :deep(.ant-layout-sider) {
    // padding: 0; // 移除内边距，让菜单占满
    // background-color: #fadfbb; // 移除旧背景色
    transition: background-color 0.3s;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05); // 添加右侧阴影
  }

  :deep(.ant-menu) {
    padding-top: 16px;
    height: 100%;
    background-color: transparent; // 继承 Sider 背景
    border-right: none;

    .ant-menu-item,
    .ant-menu-submenu-title {
      color: #555; // 默认文字颜色
      margin: 4px 8px;
      width: calc(100% - 16px);
      border-radius: 6px;
      transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;

      span {
        font-weight: 500; // 调整字重
        font-size: 14px;
      }

      &:hover {
        // 修改 hover 背景色和文字颜色
        background-color: #ffeae0; // 浅橙色
        color: #c46e5b; // 匹配标题颜色
        transform: translateX(3px);
      }
    }

    .ant-menu-item-selected {
      // 修改选中背景色和文字颜色
      background-color: #ff7e5f; // 登录按钮渐变色之一
      color: #fff; // 选中文字白色
      font-weight: bold;
      &::after {
        border-right: none;
      }
    }

    .ant-menu-sub .ant-menu-item {
      margin-left: 16px;
      width: calc(100% - 24px);
    }
  }

  :deep(.ant-layout-sider-trigger) {
    // 修改 Sider 触发器背景色
    background-color: #fff0e6; // 比 Sider 背景稍深
    color: #555;
  }
</style>
