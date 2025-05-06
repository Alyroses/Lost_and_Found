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
import { listApi, noticebyidApi, markNoticeReadApi, noticeUnreadCountApi } from '/@/api/index/notice';
import { useUserStore } from "/@/store";
// 修改：导入 Tabs
import { message, Spin as ASpin, Empty as AEmpty, Button as AButton, Modal, Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';
// 导入默认图标或不同类型的图标
import defaultNoticeIcon from 'data:image/png;base64,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';
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

// --- 新增：计算属性，筛选互动通知 (点赞和回复) ---
const interactiveNotifications = computed(() => {
  return msgData.value.filter(item => item.notice_type === 'like' || item.notice_type === 'reply');
});

const hasUnreadMessages = computed(() => {
  return msgData.value.some(item => !item.is_read);
});

onMounted(() => {
  if (noticeId) {
    getMessageByid();
  } else {
    message.error("无法获取用户信息，请重新登录");
  }
});

// 获取消息列表
const getMessageByid = () => {
  loading.value = true;
  noticebyidApi({ user: noticeId })
    .then(res => {
      if (res.code === 0 && Array.isArray(res.data)) {
        // 后端已按时间排序，直接赋值
        msgData.value = res.data;
        console.log("Fetched notices:", msgData.value);
      } else {
        message.error(res.msg || '获取消息列表失败');
        msgData.value = [];
      }
      loading.value = false;
    })
    .catch(err => {
      console.error("Error fetching notices:", err);
      message.error('获取消息列表时出错');
      loading.value = false;
      msgData.value = [];
    });
};

// --- 修改：根据消息类型获取图标或头像 ---
const getNoticeIconOrAvatar = (item) => {
  if (item.notice_type === 'chat_message') {
    // 聊天消息显示发送者头像，如果没有则显示默认头像
    return item.sender?.avatar || defaultAvatar;
  }
  // 互动消息显示对应图标
  switch (item.notice_type) {
    case 'like': return likeIcon;
    case 'reply': return replyIcon;
    default: return defaultNoticeIcon;
  }
};

// --- 修改：根据消息类型和内容生成标题 ---
const getNoticeTitle = (item) => {
  switch (item.notice_type) {
    case 'chat_message':
      // 聊天消息标题显示 "来自 xxx 的消息"
      return `来自 ${item.sender?.nickname || item.sender?.username || '未知用户'} 的消息`;
    case 'like':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 点赞了你的评论`;
    case 'reply':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 回复了你的评论`;
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
    // 其他类型通知，如果有关联物品，则跳转到物品详情页并标记已读
    goToDetailAndMarkRead(item);
  }
  // 对于没有关联物品的系统通知等，点击可能不执行任何操作或只标记已读
  else if (!item.is_read) {
     markSingleNoticeAsRead(item);
  }
};

// --- 标记单个通知为已读 (辅助函数) ---
const markSingleNoticeAsRead = async (item: any) => {
   if (!item.is_read) {
     try {
       console.log(`Marking single notice ${item.id} as read...`);
       await markNoticeReadApi({ notice_id: item.id }); // 使用导入的 markNoticeReadApi
       console.log(`Notice ${item.id} marked as read successfully.`);
       item.is_read = true; // 更新本地状态
       // 可选：如果需要更新 header 中的未读数，可以触发事件或调用 store action
     } catch (error) {
       console.error(`Failed to mark notice ${item.id} as read:`, error);
       message.error("标记已读失败");
     }
   }
}

// --- 修改：跳转到聊天页面并标记已读 ---
const goToChatAndMarkRead = async (item) => {
  // 检查是否是聊天消息且有发送者信息，以及物品信息
  // 修改：检查 item.frontend_thing_type
  if (item.notice_type !== 'chat_message' || !item.sender || !item.thing_id || !item.frontend_thing_type) {
    console.warn("无法跳转到聊天，缺少必要信息:", item);
    message.warn("无法跳转到聊天，缺少必要信息");
    return;
  }

  // 1. 如果未读，则调用 API 标记为已读
  await markSingleNoticeAsRead(item); // 调用辅助函数

  // 2. 跳转到聊天页面
  const recipientIdForChat = item.sender.id; // 聊天的对方是通知的发送者
  const thingId = item.thing_id;
  // 修改：使用 item.frontend_thing_type
  const thingType = item.frontend_thing_type;

  console.log(`Navigating to chat with recipientId: ${recipientIdForChat}, thingId: ${thingId}, thingType: ${thingType}`);
  // --- 修改跳转方式：使用 path 和 query ---
  router.push({
    path: `/index/chat/${recipientIdForChat}`, // 使用路径模板
    query: {
      thingId: thingId,
      // 修改：确保使用正确的字段名
      thingType: thingType,
    },
  });
  // --- 修改结束 ---
};

// --- 新增：跳转到详情页并标记已读 (示例) ---
const goToDetailAndMarkRead = async (item) => {
  if (!item.thing_id) return;

  // 1. 标记为已读 (如果未读)
  await markSingleNoticeAsRead(item);

  // 2. 跳转到物品详情页 (假设路由名称为 'detail')
  console.log(`Navigating to detail page for thingId: ${item.thing_id}`);
  router.push({
      name: 'detail', // 物品详情页的路由名称
      query: { id: item.thing_id }
  });
}

// --- 新增：标记所有消息为已读 ---
const markAllAsRead = async () => {
  markAllLoading.value = true;
  try {
    const res = await markNoticeReadApi({ all: 'true' }); // 发送 all=true 参数
    message.success(res.msg || '已将所有消息标记为已读');
    // 更新本地所有消息状态为已读
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
