<template>
  <div class="content-list">
    <div class="list-title-wrapper">
      <div class="list-title">我的消息</div>
      <a-button
        type="link"
        size="small"
        @click="markAllAsRead"
        :loading="markAllLoading"
        v-if="hasUnreadMessages"
        class="mark-all-read-btn"
      >
        全部标记为已读
      </a-button>
    </div>
    <a-spin :spinning="loading" style="min-height: 200px;">
      <!-- 新增：Tabs 用于分类消息 -->
      <a-tabs v-model:activeKey="activeTabKey" class="message-tabs">
        <a-tab-pane key="chat" tab="聊天消息">
          <div class="list-content notification-view">
            <div class="list">
              <div
                class="notification-item flex-view"
                v-for="item in chatMessages"
                :key="item.id"
                :class="{ 'unread': !item.is_read, 'is-chat': true }"
                @click="handleNoticeClick(item)"
              >
                <div class="unread-dot" v-if="!item.is_read"></div>
                <img
                  :src="getNoticeIconOrAvatar(item)"
                  class="avatar chat-avatar"
                />
                <div class="content-box">
                  <div class="header">
                    <span class="title-txt" :class="{ 'unread-title': !item.is_read }">
                      {{ getNoticeTitle(item) }}
                    </span>
                    <span class="time">{{ formatTime(item.create_time) }}</span>
                  </div>
                  <div class="content">
                    <p>{{ item.content }}</p>
                    <span class="view-chat-prompt">点击查看对话</span>
                  </div>
                </div>
              </div>
              <a-empty v-if="!loading && chatMessages.length === 0" description="暂无聊天消息" />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="interactive" tab="互动通知">
          <div class="list-content notification-view">
            <div class="list">
              <div
                class="notification-item flex-view"
                v-for="item in interactiveNotifications"
                :key="item.id"
                :class="{ 'unread': !item.is_read }"
                @click="handleNoticeClick(item)"
              >
                <div class="unread-dot" v-if="!item.is_read"></div>
                <img
                  :src="getNoticeIconOrAvatar(item)"
                  class="avatar"
                />
                <div class="content-box">
                  <div class="header">
                    <span class="title-txt" :class="{ 'unread-title': !item.is_read }">
                      {{ getNoticeTitle(item) }}
                    </span>
                    <span class="time">{{ formatTime(item.create_time) }}</span>
                  </div>
                  <div class="head-text" v-if="item.sender">
                    <span class="name">来自: {{ item.sender.nickname || item.sender.username }}</span>
                  </div>
                  <div class="content">
                    <p>{{ item.content }}</p>
                    <span class="view-chat-prompt">点击查看相应评论</span>
                  </div>
                </div>
              </div>
              <a-empty v-if="!loading && interactiveNotifications.length === 0" description="暂无互动通知" />
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
      <a-empty v-if="!loading && msgData.length === 0 && activeTabKey === ''" description="暂无新消息" />
    </a-spin>
  </div>
</template>

<script setup>
// 修改：导入 Tabs 相关组件
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
// 修改：Corrected import - noticebyidApi and noticeUnreadCountApi are not exported from notice.ts
// Use listApi for fetching messages. markAsReadApi is correctly named.
import { listApi, markAsReadApi } from '/@/api/index/notice';
import { useUserStore } from "/@/store";
// 修改：导入 Tabs
import { message, Spin as ASpin, Empty as AEmpty, Button as AButton, Modal, Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';
// 导入默认图标或不同类型的图标
import defaultNoticeIcon from '/@/assets/icons/svg/notice.svg';
import chatIcon from '/@/assets/icons/svg/chat-bubble.svg';
import likeIcon from '/@/assets/icons/svg/like.svg';
import replyIcon from '/@/assets/icons/svg/reply.svg';
import defaultAvatar from '/@/assets/images/avatar.jpg';

const userStore = useUserStore();
const router = useRouter();

const noticeId = userStore.user_id;

const loading = ref(false);
const markAllLoading = ref(false);
const msgData = ref<any[]>([]);
const activeTabKey = ref('chat'); // 新增：当前激活的 Tab，默认为聊天

// --- 新增：计算属性，筛选聊天消息 ---
const chatMessages = computed(() => {
  return msgData.value.filter(item => item.notice_type === 'chat_message');
});

// --- 新增：计算属性，筛选互动通知 (点赞、回复和评论) ---
const interactiveNotifications = computed(() => {
  return msgData.value.filter(item => 
    item.notice_type === 'like' || 
    item.notice_type === 'reply' ||
    item.notice_type === 'comment' // Added 'comment'
  );
});

const hasUnreadMessages = computed(() => {
  return msgData.value.some(item => !item.is_read);
});

onMounted(() => {
  if (noticeId) {
    getMessageList(); // Changed function name for clarity
  } else {
    message.error("无法获取用户信息，请重新登录");
  }
});

// 获取消息列表
const getMessageList = async () => { // Changed to async
  loading.value = true;
  try {
    // Changed to use listApi instead of noticebyidApi
    const res = await listApi({ user: noticeId }); 
    if (res.code === 0 && Array.isArray(res.data)) {
      msgData.value = res.data;
      console.log("Fetched notices:", msgData.value);
    } else {
      message.error(res.msg || '获取消息列表失败');
      msgData.value = [];
    }
  } catch (err) {
    console.error("Error fetching notices:", err);
    message.error('获取消息列表时出错');
    msgData.value = [];
  } finally {
    loading.value = false; // Ensure loading is always set to false
  }
};

// --- 修改：根据消息类型获取图标或头像 ---
const getNoticeIconOrAvatar = (item) => {
  switch (item.notice_type) {
    case 'chat_message':
      return item.sender?.avatar || defaultAvatar;
    case 'like':
    case 'comment':
      return item.sender?.avatar || defaultAvatar; // Show sender's avatar for likes and comments
    case 'reply':
      return replyIcon; // Or sender's avatar if preferred: item.sender?.avatar || defaultAvatar;
    default:
      return defaultNoticeIcon; // Fallback to a generic notice icon
  }
};

// --- 修改：根据消息类型和内容生成标题 ---
const getNoticeTitle = (item) => {
  const senderName = item.sender?.nickname || item.sender?.username || '有人';
  switch (item.notice_type) {
    case 'chat_message':
      return `来自 ${senderName} 的消息`;
    case 'like':
      // Assuming 'like' notifications are for items if thing_id is present
      return `${senderName} 点赞了您的${item.thing_id ? '物品' : '动态'}`;
    case 'comment':
      return `${senderName} 评论了您的物品`;
    case 'reply':
      return `${senderName} 回复了您的评论`;
    default:
      return item.title || '系统通知';
  }
};

// --- 格式化时间函数 (保持不变) ---
const formatTime = (timeStr) => {
  // ... (保持之前的实现) ...
   if (!timeStr) return '';
   try {
     const date = new Date(timeStr);
     return date.toLocaleString();
   } catch (e) {
     return timeStr;
   }
};

// --- 新增：统一处理通知点击 ---
const handleNoticeClick = (item: any) => {
  if (item.notice_type === 'chat_message') {
    goToChatAndMarkRead(item);
  } else if (item.thing_id) {
    goToDetailAndMarkRead(item);
  }
  else if (!item.is_read) {
     markSingleNoticeAsRead(item);
  }
};

// --- 标记单个通知为已读 (辅助函数) ---
const markSingleNoticeAsRead = async (item: any) => {
   if (!item.is_read) {
     try {
       console.log(`Marking single notice ${item.id} as read...`);
       await markAsReadApi({ notice_id: item.id }); // Corrected API function name
       console.log(`Notice ${item.id} marked as read successfully.`);
       item.is_read = true; 
     } catch (error) {
       console.error(`Failed to mark notice ${item.id} as read:`, error);
       message.error("标记已读失败");
     }
   }
}

// --- 修改：跳转到聊天页面并标记已读 ---
const goToChatAndMarkRead = async (item) => {
  // Log the full notification item when trying to go to chat
  console.log('[MessageView goToChatAndMarkRead] Clicked chat notification item:', JSON.parse(JSON.stringify(item)));

  if (item.notice_type !== 'chat_message' || !item.sender || !item.thing_id || !item.frontend_thing_type) {
    console.warn("[MessageView goToChatAndMarkRead] 无法跳转到聊天，缺少必要信息:", 
        'notice_type:', item.notice_type, 
        'sender:', item.sender ? 'present' : 'missing', 
        'thing_id:', item.thing_id, 
        'frontend_thing_type:', item.frontend_thing_type
    );
    message.warn("无法跳转到聊天，缺少必要信息");
    return;
  }

  await markSingleNoticeAsRead(item); 

  const recipientIdForChat = item.sender.id; 
  const thingIdForNav = item.thing_id; // Use a new variable for clarity
  const thingTypeForNav = item.frontend_thing_type; // Use a new variable for clarity

  console.log(`[MessageView goToChatAndMarkRead] Navigating to chat with recipientId: ${recipientIdForChat}, thingId: ${thingIdForNav}, thingType: ${thingTypeForNav}`);
  router.push({
    path: `/index/chat/${recipientIdForChat}`, 
    query: {
      thingId: thingIdForNav,
      thingType: thingTypeForNav,
    },
  });
};

// --- 新增：跳转到详情页并标记已读 (示例) ---
const goToDetailAndMarkRead = async (item) => {
    return;
  }

  await markSingleNoticeAsRead(item);

  const thingIdForNav = item.thing_id;
  const thingTypeForNav = item.frontend_thing_type;

  // Log the specific values and their types being used for navigation
  console.log(
    `Preparing to navigate to detail page. Actual values being used:`,
    `thingId: ${thingIdForNav} (type: ${typeof thingIdForNav}),`,
    `frontend_thing_type: ${thingTypeForNav} (type: ${typeof thingTypeForNav})`
  );

  // Ensure frontend_thing_type is present, otherwise detail page might not work correctly
  if (thingTypeForNav === null || thingTypeForNav === undefined) {
    console.warn(
      `frontend_thing_type is null or undefined for thing_id ${thingIdForNav} in notification ${item.id}.` +
      ` The 'type' query parameter might be omitted by Vue Router or set to an empty value.`
    );
    // Navigation will proceed, but the detail page must handle a missing/null type.
  }

  router.push({
      name: 'detail', 
      query: { id: thingIdForNav, type: thingTypeForNav } 
  });
}

// --- 新增：标记所有消息为已读 ---
const markAllAsRead = async () => {
  markAllLoading.value = true;
  try {
    const res = await markAsReadApi({ all: 'true' }); // Corrected API function name
    message.success(res.msg || '已将所有消息标记为已读');
    msgData.value.forEach(item => item.is_read = true);
  } catch (error) {
    console.error("Failed to mark all notices as read:", error);
    message.error(error.msg || '标记全部已读失败');
  } finally {
    markAllLoading.value = false;
  }
};

</script>

<style scoped lang="less">
// --- 颜色和变量定义 ---
@theme-color: #4a90e2; // 更清新、现代的蓝色主题色
@theme-color-light: lighten(@theme-color, 35%);
@theme-color-dark: darken(@theme-color, 10%);

@background-color: #f4f7f9; // 页面整体背景色，更柔和
@container-bg-color: #ffffff; // 内容容器背景色

@text-color-primary: #333333; // 主要文字 - 深灰，提高可读性
@text-color-secondary: #5a6e82; // 次要文字 - 柔和的蓝灰色
@text-color-placeholder: #a8b6c5; // 占位文字或较浅提示

@border-color-base: #e8edf1; // 基础边框色 - 更柔和
@border-color-light: #f0f3f6; // 较浅边框色

@unread-dot-color: #ff6b6b; // 未读标记 - 鲜艳但不过于刺眼
@unread-title-color: @theme-color; // 未读标题 - 使用主题色强调

@hover-bg-color: #e9f2fc; // 列表项悬停背景 - 淡蓝色

// --- 整体布局与容器 ---
.content-list {
  flex: 1;
  background-color: @background-color;
  padding: 20px; // 给整个视图一些外边距感
  height: 100%; // 确保占满父容器高度
  display: flex;
  flex-direction: column;

  .list-title-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px 20px 10px; // 调整内边距
    margin-bottom: 0; // 移除与Tabs的间距，由Tabs自身控制

    .list-title {
      color: @text-color-primary;
      font-weight: 600;
      font-size: 22px;
    }

    .mark-all-read-btn {
      color: @theme-color;
      font-weight: 500;
      &:hover {
        color: @theme-color-dark;
      }
    }
  }
}

// --- Ant Design Spin 优化 ---
:deep(.ant-spin-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.ant-spin-nested-loading) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px; // 确保加载时有最小高度
}


// --- Tabs 样式深度定制 ---
.message-tabs {
  flex: 1; // 让 Tabs 占据剩余空间
  display: flex;
  flex-direction: column;
  background-color: @container-bg-color;
  border-radius: 12px; // 给Tabs容器圆角
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); // 更柔和的阴影
  overflow: hidden; // 配合圆角

  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
    padding: 8px 20px 0 20px; // 导航区域内边距
    background-color: lighten(@theme-color-light, 12%); // Tabs导航背景色 - 非常淡的蓝色
    border-bottom: 1px solid @border-color-base;

    &::before { // 移除导航条下方的默认横线
      display: none;
    }
  }

  :deep(.ant-tabs-tab) {
    padding: 12px 20px; // Tab 内边距
    margin: 0 8px 0 0 !important; // 调整Tab间距，并覆盖ant默认important
    font-size: 15px;
    color: @text-color-secondary;
    border-radius: 8px 8px 0 0 !important; // 给Tab顶部圆角
    border: 1px solid transparent !important; // 预留边框位置
    border-bottom: none !important; // 移除底部边框
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    position: relative;
    top: 1px; // 轻微上移，与内容区域边框融合

    &:hover {
      color: @theme-color;
      background-color: @theme-color-light;
    }
  }

  :deep(.ant-tabs-tab-active) {
    .ant-tabs-tab-btn {
      color: @theme-color-dark !important;
      font-weight: 600;
    }
    background-color: @container-bg-color !important; // 活动Tab背景与内容区一致
    border-color: @border-color-base @border-color-base transparent @border-color-base !important; // 活动Tab边框
    box-shadow: 0 -2px 5px rgba(0,0,0,0.04); // 活动Tab轻微上浮感
  }

  :deep(.ant-tabs-ink-bar) {
    display: none; // 不再使用下划线指示器，通过Tab背景和边框区分
  }

  :deep(.ant-tabs-content-holder) {
    flex: 1; // 内容区域占据剩余空间
    overflow-y: auto; // 内容超出时滚动
    padding: 20px; // 内容区域内边距
  }
}

// --- 列表内容区域 ---
.list-content.notification-view { // 确保选择器特异性
  padding: 0; // Tabs内容区域已有padding，这里重置
}

// --- 通知项样式 ---
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 15px; // 通知项内边距
  margin-bottom: 12px; // 通知项间距
  border-radius: 8px; // 通知项圆角
  background-color: @container-bg-color; // 默认背景
  border: 1px solid @border-color-light;
  transition: all 0.25s ease-in-out;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background-color: @hover-bg-color;
    border-color: darken(@border-color-light, 5%);
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1); // 悬停时主题色阴影
  }

  &.unread {
    border-left: 4px solid @unread-dot-color; // 未读项左侧突出显示
    background-color: lighten(@unread-dot-color, 38%); // 未读项淡背景色
     &:hover {
       background-color: lighten(@unread-dot-color, 35%);
     }
  }

  .unread-dot { // 未读小圆点，现在通过父级.unread的border-left实现，这个可以隐藏或用于其他目的
    display: none; 
  }

  .avatar {
    width: 48px;
    height: 48px;
    margin-right: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid @container-bg-color; // 头像描边，使其与背景分离
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .content-box {
    flex: 1;
    min-width: 0;
    padding: 0; // 移除旧的padding和border
    border-bottom: none;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .title-txt {
    color: @text-color-primary;
    font-weight: 500;
    font-size: 16px; // 标题字号增大
    line-height: 1.4;
    // 多行省略
    display: -webkit-box;
    -webkit-line-clamp: 1; // 标题只显示一行，更长内容在content
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;

    &.unread-title {
      color: @unread-title-color; // 未读标题使用主题色
      font-weight: 600;
    }
  }

  .time {
    color: @text-color-placeholder;
    font-size: 12px;
    white-space: nowrap;
    margin-left: 15px;
    flex-shrink: 0;
  }

  .head-text { // "来自: xxx"
    color: @text-color-secondary;
    font-size: 13px;
    margin-bottom: 10px;
    .name {
      font-weight: 500;
    }
  }

  .content {
    color: @text-color-secondary;
    font-size: 14px;
    line-height: 1.7; // 增加内容行高
    
    p {
      margin-bottom: 0;
      // 多行省略
      display: -webkit-box;
      -webkit-line-clamp: 2; // 内容最多显示两行
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
    }

    .view-chat-prompt { // "点击查看对话/评论"
      display: block;
      margin-top: 10px;
      font-size: 13px;
      font-weight: 500;
      color: @theme-color;
      opacity: 0.9;
      &:hover {
        opacity: 1;
        text-decoration: underline;
      }
    }
  }
}

// 聊天消息的特殊内容行数处理
.notification-item.is-chat {
  .content p {
    -webkit-line-clamp: 3; // 聊天内容可以显示更多行
  }
}

// --- 空状态 ---
:deep(.ant-empty) {
  margin-top: 40px; // 与列表项保持一定距离
  .ant-empty-description {
    color: @text-color-placeholder;
    font-size: 15px;
  }
  .ant-empty-image svg { // 如果是SVG图标，可以调整颜色
    // fill: @text-color-placeholder;
  }
}
</style>
