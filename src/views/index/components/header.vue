<template>
  <div class="main-bar-view">
    <div class="logo">
      <img :src="LogoIcon" class="search-icon" @click="$router.push({ name: 'portal' })" />
    </div>
    <span class="header-title">失物招领平台</span>
    <span class="header-title-english">LOST & FOUND </span>
    &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;
    <div class="search-entry">
      <img :src="SearchIcon" class="search-icon" />
      <input placeholder="输入关键词" ref="keywordRef" @keyup.enter="search" />
    </div>
    <div class="right-view">
      <el-popover placement="right" width="300" trigger="click">
        <el-table :data="data.rankingList" v-loading="data.loading">
          <!-- 用户昵称列 -->
          <el-table-column label="用户昵称" width="200">
            <template #default="{ row, $index }">
              <span :style="{ color: row.id === currentUserId ? 'red' : '#ccaf13' }">
                {{ $index + 1 }}. {{ row.nickname || row.username || '匿名用户' }}
              </span>
            </template>
          </el-table-column>
          <!-- 积分列 -->
          <el-table-column label="积分" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.id === currentUserId ? 'red' : '#ccaf13' }">
                {{ row.total_points || 0 }}
              </span>
            </template>
          </el-table-column>
        </el-table>
        <template #reference>
          <el-button style="color: red;">Rank积分排名</el-button>
        </template>
      </el-popover>
      <a-button type="link" @click="handlemap()">分布地图</a-button>
      <a-button type="link" @click="handleJoin()">发布失物信息</a-button>
      <a-button type="link" @click="foundhandel()">发布招领信息</a-button>
      <template v-if="userStore.user_token">
        <a-dropdown>
          <a class="ant-dropdown-link" @click="(e) => e.preventDefault()">
            <!-- 修改：根据 userStore.user_avatar 显示头像 -->
            <img v-if="userStore.user_avatar" :src="userStore.user_avatar" class="self-img" />
            <img v-else :src="AvatarIcon" class="self-img" />
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item>
                <a @click="goUserCenter('userInfoEditView')">个人中心</a>
              </a-menu-item>
              <a-menu-item>
                <a @click="quit()">登出</a>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
      <template v-else>
        <!-- 这个是登录按钮，点击会跳转到登录页 -->
        <button class="login btn hidden-sm" @click="goLogin()">登录</button>
      </template>

      <div class="right-icon" @click="showDrawer">
        <a-badge :count="unreadCount" :overflow-count="99">
          <bell-outlined class="icon-message" />
        </a-badge>
        <span class="message-text">消息</span>
      </div>
      <div>
        <a-drawer title="消息" placement="right" :closable="true" :maskClosable="true" :visible="msgVisible"
          @close="onClose">
          <a-spin :spinning="loading" style="min-height: 200px">
            <div class="list-content">
              <div class="notification-view">
                <div class="list">
                  <div class="notification-item flex-view" v-for="item in msgData">
                    <div class="content-box">
                      <div class="header">
                        <span class="title-txt">{{ item.title }}</span>
                        <br />
                        <span class="time">{{ item.create_time }}</span>
                      </div>
                      <div class="head-text"> </div>
                      <div class="content">
                        <p>{{ item.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-spin>
        </a-drawer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import LogoIcon from '/public/lost_found_logo.png';
import { listApi as UserListApi } from '/@/api/admin/user';

import { getUserRankingApi } from '/@/api/index/user';
import AvatarIcon from '/@/assets/images/avatar.jpg';
import logoImage from '/@/assets/images/k-logo.png';
import MessageIcon from '/@/assets/images/message-icon.svg';
import SearchIcon from '/@/assets/images/search-icon.svg';
import { useUserStore } from '/@/store';
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import defaultAvatar from '/@/assets/images/avatar.jpg';
import { BellOutlined } from '@ant-design/icons-vue'; // 导入消息图标
import { message, Badge as ABadge, Drawer as ADrawer, Spin as ASpin, Empty as AEmpty, Button as AButton, Modal } from 'ant-design-vue';
// 导入 Notice API
import { listApi, unreadCountApi, markAsReadApi } from '/@/api/index/notice';
// 导入图标和工具函数 (假设已存在)
import chatIcon from '/@/assets/icons/svg/chat-bubble.svg';
import likeIcon from '/@/assets/icons/svg/like.svg';
import replyIcon from '/@/assets/icons/svg/reply.svg';
import defaultNoticeIcon from 'data:image/png;base64,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';

// --- 状态 ---
const router = useRouter();
const userStore = useUserStore();
// Removed duplicate declaration of unreadCount
const msgVisible = ref(false); // 抽屉可见性
const drawerMsgData = ref<any[]>([]); // 抽屉内的消息列表
const drawerLoading = ref(false); // 抽屉加载状态
const markAllLoading = ref(false); // 标记全部已读加载状态
let pollInterval: number | null = null; // 轮询定时器 ID

// --- 计算属性 ---
const hasUnreadInDrawer = computed(() => {
  return drawerMsgData.value.some(item => !item.is_read);
});

// --- 方法 ---
// 获取未读消息数
const fetchUnreadCount = async () => {
  if (!userStore.user_token) return; // 未登录不获取
  try {
    const res = await noticeUnreadCountApi();
    if (res.code === 0) {
      unreadCount.value = res.data.count;
    } else {
      console.error("获取未读消息数失败:", res.msg);
    }
  } catch (error) {
    console.error("请求未读消息数出错:", error);
  }
};

// 显示抽屉并加载数据
const showDrawer = async () => {
  if (!userStore.user_token) {
    message.warn('请先登录');
    router.push({ name: 'login' });
    return;
  }
  msgVisible.value = true;
  await fetchDrawerMessages();
};

// 关闭抽屉
const onClose = () => {
  msgVisible.value = false;
  // 关闭抽屉时可以考虑重新获取未读数，因为可能在抽屉内标记了已读
  fetchUnreadCount();
};

// 获取抽屉内的消息列表
const fetchDrawerMessages = async () => {
  drawerLoading.value = true;
  try {
    // 使用 listApi 获取当前用户的通知
    const res = await listApi();
    if (res.code === 0 && Array.isArray(res.data)) {
      drawerMsgData.value = res.data;
    } else {
      message.error(res.msg || '获取消息列表失败');
      drawerMsgData.value = [];
    }
  } catch (error) {
    console.error("获取抽屉消息列表出错:", error);
    message.error('加载消息列表时出错');
    drawerMsgData.value = [];
  } finally {
    drawerLoading.value = false;
  }
};

// --- 抽屉内使用的辅助函数 (与 message-view.vue 类似) ---
const getNoticeIconOrAvatar = (item: any) => {
  if (item.notice_type === 'chat_message') {
    return item.sender?.avatar || defaultAvatar;
  }
  switch (item.notice_type) {
    case 'like': return likeIcon;
    case 'reply': return replyIcon;
    default: return defaultNoticeIcon;
  }
};

const getNoticeTitle = (item: any) => {
  switch (item.notice_type) {
    case 'chat_message':
      return `来自 ${item.sender?.nickname || item.sender?.username || '未知用户'} 的消息`;
    case 'like':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 点赞了你的评论`;
    case 'reply':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 回复了你的评论`;
    default:
      return item.title || '系统通知';
  }
};

const formatTime = (timeStr: string | null | undefined) => {
   if (!timeStr) return '';
   try {
     const date = new Date(timeStr);
     // 可以使用更友好的时间格式，例如 '几分钟前', '几小时前'
     // 这里暂时用简单的本地化时间
     return date.toLocaleString();
   } catch (e) {
     return timeStr;
   }
};

// --- 抽屉内的交互函数 ---
const goToChatAndMarkReadInDrawer = async (item: any) => {
  if (item.notice_type !== 'chat_message' || !item.sender || !item.thing_id || !item.thing_type) {
    return;
  }
  if (!item.is_read) {
    try {
      await markNoticeReadApi({ notice_id: item.id });
      item.is_read = true; // 更新本地状态
      // 标记成功后，立即减少未读计数
      if (unreadCount.value > 0) {
        unreadCount.value--;
      }
    } catch (error) {
      console.error(`标记通知 ${item.id} 已读失败:`, error);
    }
  }
  // 关闭抽屉
  onClose();
  // 跳转
  router.push({
    name: 'chat',
    params: { recipientId: item.sender.id },
    query: {
      thingId: item.thing_id,
      thingType: item.thing_type,
    },
  });
};

const markAllAsReadInDrawer = async () => {
  markAllLoading.value = true;
  try {
    const res = await markNoticeReadApi({ all: 'true' });
    message.success(res.msg || '已将所有消息标记为已读');
    drawerMsgData.value.forEach(item => item.is_read = true);
    unreadCount.value = 0; // 清空未读计数
  } catch (error) {
    console.error("标记全部已读失败:", error);
    message.error(error.msg || '标记全部已读失败');
  } finally {
    markAllLoading.value = false;
  }
};

// --- 生命周期和监听 ---
onMounted(() => {
  fetchUnreadCount(); // 组件挂载时获取一次
  // 设置定时器轮询未读消息数 (简单实现)
  pollInterval = setInterval(fetchUnreadCount, 60000); // 每分钟轮询一次
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval); // 组件卸载时清除定时器
  }
});

// 监听登录状态变化，登录后获取未读数
watch(() => userStore.user_token, (newToken) => {
  if (newToken) {
    fetchUnreadCount();
  } else {
    unreadCount.value = 0; // 退出登录清空计数
  }
});

// 其他 header.vue 已有逻辑
const handleUserCenter = () => {
  router.push({ name: 'userCenter', query: { menu: 'info' } });
};
const handleLogout = () => {
  Modal.confirm({
    title: '确认',
    content: '确定要退出登录吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      userStore.logout().then((res) => {
        message.success('退出成功');
        router.push({ name: 'portal' });
      });
    },
  });
};

interface RankingItem {
  id: number;
  username: string;
  nickname?: string;
  total_points: number;
}
// 页面数据
const data = reactive({
  rankingList: [] as RankingItem[],
  loading: false,
  keyword: '',
});

const keywordRef = ref();
// 新增数据
let unreadCount = ref(0);
let loading = ref(false);
// Removed duplicate declaration of msgVisible
let msgData = ref([] as any);
let noticeId = userStore.user_id




onMounted(() => {
  // getMessageList();
  getMessageByid();
  // getUserList();
  getUserRanking();
  // 添加日志检查 header 中的 avatar URL
  console.log('Header mounted. Avatar URL from store:', userStore.user_avatar);
});

const getMessageByid = () => {
  loading.value = true
  noticebyidApi({ user: noticeId }).then(res => {
    msgData.value = res.data
    console.log(msgData.value)
    loading.value = false
  }).catch(err => {
    console.log(err)
    loading.value = false
  })
}

const getMessageList = () => {
  loading.value = true;
  listApi({})
    .then((res) => {
      msgData.value = res.data;
      loading.value = false;
    })
    .catch((err) => {
      console.log(err);
      loading.value = false;
    });
};



// 获取未读消息数
const getUnreadCount = () => {
  if (userStore.user_token) {
    noticeUnreadCountApi({ user: userStore.user_id }).then(res => {
      unreadCount.value = res.data.count;
    });
  }
};

// 标记为已读
const markAsRead = () => {
  markNoticeReadApi({ user: userStore.user_id }).then(() => {
    unreadCount.value = 0;
  });
};

// 在消息列表中，每条消息添加跳转逻辑
const handleNoticeClick = (notice) => {
  router.push({
    name: 'detail',
    query: { id: notice.thing_id },
    hash: `#comment-${notice.comment_id}`
  });
};

// 获取排名数据
const getUserRanking = () => {
  data.loading = true;
  UserListApi({ keyword: data.keyword })
    .then(res => {
      data.rankingList = res.data.map(item => ({
        ...item,
        // 数据清洗
        nickname: item.nickname?.trim() || null,
        username: item.username || `用户_${item.id.slice(0,6)}` // 生成易读的默认名
      }));
      
      // 自动滚动到当前用户位置
      setTimeout(() => {
        const index = data.rankingList.findIndex(r => r.id === currentUserId);
        if (index > -1) {
          document.querySelector(`.el-table__row:nth-child(${index+1})`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    })
    .catch(err => {
      message.error(`加载失败：${err.response?.data?.msg || '服务器异常'}`);
    })
    .finally(() => data.loading = false);
};

const search = () => {
  const keyword = keywordRef.value.value;
  // 统一使用路由跳转（带查询参数）
  router.push({
    name: 'search',
    query: { keyword: keyword }
  });
};

const goLogin = () => {
  router.push({ name: 'login' });
};

const goUserCenter = (menuName) => {
  router.push({ name: menuName });
};
const quit = () => {
  console.log('quit() function called in header.vue'); // <-- 添加日志
  userStore.logout().then((res) => {
    console.log('userStore.logout() finished, navigating to portal.'); // <-- 添加日志
    router.push({ name: 'portal' });
  }).catch(err => { // <-- 添加 catch 以防万一
    console.error('Error during logout process:', err);
  });
};
const onClose = () => {
  msgVisible.value = false;
};

// 跳转到发布失物信息页面
const handleJoin = () => {
  let userId = userStore.user_id;
  if (userId) {
    // 使用 name 跳转到失物信息编辑视图
    router.push({ name: 'jiajiaoEditView' });
  } else {
    message.warn('请先登录！');
  }
};
// 跳转到发布招领信息页面
const foundhandel = () => {
  let userId = userStore.user_id;
  if (userId) {
    // 使用 name 跳转到拾物信息编辑视图
    router.push({ name: 'founditemView' });
  } else {
    message.warn('请先登录！');
  }
};
const handlemap = () => {
  let userId = userStore.user_id;
  if (userId) {
    router.push({ name: 'ditu' });
  } else {
    message.warn('请先登录！');
  }
};
</script>

<style scoped lang="less">
.main-bar-view {
  position: fixed;
  top: 0;
  left: 0;
  height: 56px;
  width: 100%;
  background: #f2a4a4;
  border-bottom: 1px solid #cedce4;
  padding-left: 48px;
  z-index: 16;
  display: flex;
  flex-direction: row;
  //justify-content: center; /*水平居中*/
  align-items: center;
  /*垂直居中*/
}

.header-title {
  margin-left: 0px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #bd6940;
  margin-top: 8px;
}
.header-title-english{
  font-size: 20px;
  text-align: center;
  margin-top: 8px;
  margin-left: 20px;
  color: #e1df66;
  font-weight: bold;
}


.logo {
  margin-right: 24px;

  img {
    width: 67px;
    height: 73px;
    cursor: pointer;
  }
}

.search-entry {
  position: relative;
  width: 400px;
  min-width: 200px;
  height: 32px;
  background: #ecf3fc;
  padding: 0 12px;
  border-radius: 16px;
  font-size: 0;
  cursor: pointer;

  img {
    max-width: 100%;
    height: auto;
  }

  .search-icon {
    width: 18px;
    margin: 7px 8px 0 0;
  }

  input {
    position: absolute;
    top: 4px;
    width: 85%;
    height: 24px;
    border: 0px;
    outline: none;
    color: #000;
    background: #ecf3fc;
    font-size: 14px;
  }
}

.right-view {
  padding-right: 36px;
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: flex-end;
  /* 内容右对齐 */

  .username {
    height: 32px;
    line-height: 32px;
    text-align: center;
  }

  button {
    outline: none;
    border: none;
    cursor: pointer;
  }

  img {
    cursor: pointer;
  }

  .right-icon {
    position: relative;
    width: 24px;
    margin: 4px 0 0 4px;
    cursor: pointer;
    display: inline-block;
    font-size: 0;

    span {
      position: absolute;
      right: -15px;
      top: -3px;
      font-size: 12px;
      color: #fff;
      background: #4684e2;
      border-radius: 8px;
      padding: 0 4px;
      height: 16px;
      line-height: 16px;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }

    .msg-point {
      position: absolute;
      right: -4px;
      top: 0;
      min-width: 8px;
      width: 8px;
      height: 8px;
      background: #4684e2;
      border-radius: 50%;
    }
  }

  .self-img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    vertical-align: middle;
    cursor: pointer;
    object-fit: cover; // 确保头像不变形
  }

  .btn {
    background: #4684e2;
    font-size: 14px;
    color: #fff;
    border-radius: 32px;
    text-align: center;
    width: 66px;
    height: 32px;
    line-height: 32px;
    vertical-align: middle;
    margin-left: 32px;
  }
}

.content-list {
  flex: 1;

  .list-title {
    color: #152844;
    font-weight: 600;
    font-size: 18px;
    //line-height: 24px;
    height: 48px;
    margin-bottom: 4px;
    border-bottom: 1px solid #cedce4;
  }
}

.notification-item {
  padding-top: 16px;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .content-box {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    border-bottom: 1px dashed #e9e9e9;
    padding: 4px 0 16px;
  }

  .header {
    margin-bottom: 12px;
  }

  .title-txt {
    color: #315c9e;
    font-weight: 500;
    font-size: 14px;
  }

  .time {
    color: #a1adc5;
    font-size: 14px;
  }

  .head-text {
    color: #152844;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;

    .name {
      margin-right: 8px;
    }
  }

  .content {
    margin-top: 4px;
    color: #484848;
    font-size: 14px;
    line-height: 22px;
  }
  .el-table__row {
    transition: all 0.3s ease;
  }
  .highlight-user {
    background: rgba(255,0,0,0.1) !important;
    transform: scale(1.02);
  }
}

.message-drawer {
  .drawer-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .drawer-header {
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    text-align: right;
  }
  .notification-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px; // 防止滚动条遮挡内容
  }
}

.notification-item {
  padding-top: 12px; // 减小间距
  position: relative;
  transition: background-color 0.2s ease;

  &.is-chat {
    cursor: pointer;
    &:hover {
      background-color: #f9f9f9;
    }
  }

  .unread-dot {
    position: absolute;
    top: 16px; // 调整
    left: 0px; // 调整
    width: 8px;
    height: 8px;
    background-color: #ff4d4f;
    border-radius: 50%;
  }

  .avatar {
    width: 36px; // 减小头像
    height: 36px;
    margin-right: 10px;
    object-fit: contain;
    border-radius: 4px;

    &.chat-avatar {
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .content-box {
    flex: 1;
    border-bottom: 1px dashed #e9e9e9;
    padding: 0 0 12px; // 调整内边距
    overflow: hidden; // 防止内容溢出
  }

  .header-line { // 修改：使用 header-line 避免与父组件 header 冲突
    margin-bottom: 8px; // 减小间距
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-txt {
    color: #315c9e;
    font-weight: 500;
    font-size: 14px;
    transition: font-weight 0.2s ease;
    white-space: nowrap; // 防止标题换行
    overflow: hidden;
    text-overflow: ellipsis; // 标题过长显示省略号
    max-width: 200px; // 限制标题最大宽度

    &.unread-title {
      font-weight: 600;
    }
  }

  .time {
    color: #a1adc5;
    font-size: 12px;
    margin-left: 8px;
    white-space: nowrap;
  }

  .content {
    color: #484848;
    font-size: 13px; // 减小字体
    line-height: 1.5; // 调整行高

    p {
      margin-bottom: 0;
      white-space: nowrap; // 内容也单行显示
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .view-chat-prompt {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #999;
    }
  }
}

:deep(.ant-badge-count) {
  box-shadow: 0 0 0 1px #fff; // 给徽标添加白色边框
}
:deep(.ant-drawer-body) {
  padding: 16px; // 调整抽屉 body 内边距
}
</style>
