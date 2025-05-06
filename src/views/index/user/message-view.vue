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
.content-list {
  flex: 1;

  .list-title-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // border-bottom: 1px solid #cedce4; // 移动到 Tabs 组件外部或移除
    margin-bottom: 4px;
    height: 48px;
    padding: 0 16px; // 给标题区域一些内边距

    .list-title {
      color: #152844;
      font-weight: 600;
      font-size: 18px;
      border-bottom: none; 
      margin-bottom: 0; 
    }

    .mark-all-read-btn {
      padding: 0; 
    }
  }
}

// 新增：Tabs 样式
.message-tabs {
  // 可以根据需要调整 Tabs 的外边距等
  :deep(.ant-tabs-nav) {
    margin-bottom: 0; // 移除 Tabs 导航下方的默认边距
  }
  :deep(.ant-tabs-tab) {
    padding: 12px 16px; // 调整 Tab 内边距
  }
}

.list-content { // 这个类现在用于每个 TabPane 内部的列表容器
  padding: 0 16px 16px 16px; // 给列表内容一些内边距
}


.notification-item {
  padding-top: 16px;
  position: relative; 
  transition: background-color 0.2s ease; 
  cursor: pointer; 

  .unread-dot {
    position: absolute;
    top: 20px; 
    left: 4px; 
    width: 8px;
    height: 8px;
    background-color: #ff4d4f; 
    border-radius: 50%;
  }

  .avatar {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    object-fit: cover; /* Changed from contain to cover for avatars */
    border-radius: 50%; /* Make all avatars round by default for consistency */

    /* &.chat-avatar can be removed if all avatars are round, or kept for specific chat styling */
  }

  .content-box {
    flex: 1;
    border-bottom: 1px dashed #e9e9e9;
    padding: 4px 0 16px;
  }
  // 移除最后一个 notification-item 的下划线
  &:last-child .content-box {
    border-bottom: none;
  }


  .header {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between; 
    align-items: center; 
  }

  .title-txt {
    color: #315c9e;
    font-weight: 500;
    font-size: 14px;
    transition: font-weight 0.2s ease; 

    &.unread-title {
      font-weight: 600; 
    }
  }

  .time {
    color: #a1adc5;
    font-size: 12px; 
    margin-left: 16px;
    white-space: nowrap; 
  }

  .head-text {
    color: #152844;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 4px; 

    .name {
      margin-right: 8px;
    }
  }

  .content {
    color: #484848;
    font-size: 14px;
    line-height: 22px;

    p {
      margin-bottom: 0; 
    }

    .view-chat-prompt {
      display: block; 
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }
  }
}

:deep(.ant-empty-description) {
  color: #999;
}
</style>
