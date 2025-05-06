<template>
  <div class="content-list">
    <div class="list-title-wrapper">
      <div class="list-title">我的消息</div>
      <!-- 新增：标记全部已读按钮 -->
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
      <div class="list-content">
        <div class="notification-view">
          <div class="list">
            <!-- 修改 v-for 循环，并添加 key 和点击事件 -->
            <div
              class="notification-item flex-view"
              v-for="item in msgData"
              :key="item.id"
              :class="{ 'unread': !item.is_read, 'is-chat': item.notice_type === 'chat_message' }"
              @click="item.notice_type === 'chat_message' ? goToChatAndMarkRead(item) : null"
            >
              <!-- 未读标记 -->
              <div class="unread-dot" v-if="!item.is_read"></div>

              <!-- 根据类型显示不同图标或头像 -->
              <img
                :src="getNoticeIconOrAvatar(item)"
                class="avatar"
                :class="{ 'chat-avatar': item.notice_type === 'chat_message' }"
              />
              <div class="content-box">
                <div class="header">
                  <!-- 根据类型显示标题 -->
                  <span class="title-txt" :class="{ 'unread-title': !item.is_read }">
                    {{ getNoticeTitle(item) }}
                  </span>
                  <span class="time">{{ formatTime(item.create_time) }}</span>
                </div>
                <!-- 聊天消息显示发送者信息 -->
                <div class="head-text" v-if="item.notice_type !== 'chat_message' && item.sender">
                  <span class="name">来自: {{ item.sender.nickname || item.sender.username }}</span>
                </div>
                <div class="content">
                  <!-- 显示内容 -->
                  <p>{{ item.content }}</p>
                  <!-- 聊天消息显示 "查看对话" 提示 (通过点击整个项跳转) -->
                   <span v-if="item.notice_type === 'chat_message'" class="view-chat-prompt">
                     点击查看对话
                   </span>
                </div>
              </div>
            </div>
            <!-- 添加空状态显示 -->
            <a-empty v-if="!loading && msgData.length === 0" description="暂无新消息" />
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'; // 导入 computed
import { useRouter } from 'vue-router';
// 修改：导入 markNoticeReadApi 和 noticeUnreadCountApi (如果需要实时更新未读数)
import { listApi, noticebyidApi, markNoticeReadApi, noticeUnreadCountApi } from '/@/api/index/notice';
import { useUserStore } from "/@/store";
import { message, Spin as ASpin, Empty as AEmpty, Button as AButton, Modal } from 'ant-design-vue';
// 导入默认图标或不同类型的图标
import defaultNoticeIcon from 'data:image/png;base64,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';
import chatIcon from '/@/assets/icons/svg/chat-bubble.svg';
import likeIcon from '/@/assets/icons/svg/like.svg';
import replyIcon from '/@/assets/icons/svg/reply.svg';
import defaultAvatar from '/@/assets/images/avatar.jpg'; // 默认头像

const userStore = useUserStore();
const router = useRouter();

const noticeId = userStore.user_id;

const loading = ref(false);
const markAllLoading = ref(false); // 新增：标记全部已读加载状态
const msgData = ref<any[]>([]);

// --- 新增：计算属性，判断是否有未读消息 ---
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
const getNoticeIconOrAvatar = (item: any) => {
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
const getNoticeTitle = (item: any) => {
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
const formatTime = (timeStr: string | null | undefined) => {
  // ... (保持之前的实现) ...
   if (!timeStr) return '';
   try {
     const date = new Date(timeStr);
     return date.toLocaleString();
   } catch (e) {
     return timeStr;
   }
};

// --- 修改：跳转到聊天页面并标记已读 ---
const goToChatAndMarkRead = async (item: any) => {
  // 检查是否是聊天消息且有发送者信息
  if (item.notice_type !== 'chat_message' || !item.sender || !item.thing_id || !item.thing_type) {
    console.warn("无法跳转到聊天，缺少必要信息:", item);
    message.warn("无法跳转到聊天，缺少必要信息");
    return;
  }

  // 1. 如果未读，则调用 API 标记为已读
  if (!item.is_read) {
    try {
      console.log(`Marking notice ${item.id} as read...`);
      await markNoticeReadApi({ notice_id: item.id });
      console.log(`Notice ${item.id} marked as read successfully.`);
      // 更新本地状态
      item.is_read = true;
    } catch (error) {
      console.error(`Failed to mark notice ${item.id} as read:`, error);
      // 即使标记失败，也继续跳转，但可以给用户提示
      message.error("标记已读失败，但仍将跳转到聊天");
    }
  }

  // 2. 跳转到聊天页面
  const recipientIdForChat = item.sender.id; // 聊天的对方是通知的发送者
  const thingId = item.thing_id;
  const thingType = item.thing_type;

  console.log(`Navigating to chat with recipientId: ${recipientIdForChat}, thingId: ${thingId}, thingType: ${thingType}`);
  router.push({
    name: 'chat', // 确认聊天路由名称
    params: { recipientId: recipientIdForChat },
    query: {
      thingId: thingId,
      thingType: thingType,
    },
  });
};

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
    border-bottom: 1px solid #cedce4;
    margin-bottom: 4px;
    height: 48px;

    .list-title {
      color: #152844;
      font-weight: 600;
      font-size: 18px;
      border-bottom: none; /* 移除单独的下边框 */
      margin-bottom: 0; /* 移除边距 */
    }

    .mark-all-read-btn {
      padding: 0; // 移除按钮内边距使其更紧凑
    }
  }
}

.notification-item {
  padding-top: 16px;
  position: relative; // 为了未读标记定位
  transition: background-color 0.2s ease; // 添加背景色过渡

  &.is-chat {
    cursor: pointer; // 聊天消息显示手型光标
    &:hover {
      background-color: #f9f9f9; // 鼠标悬停时背景变灰
    }
  }

  .unread-dot {
    position: absolute;
    top: 20px; // 调整位置
    left: 4px; // 调整位置
    width: 8px;
    height: 8px;
    background-color: #ff4d4f; // 红色
    border-radius: 50%;
  }

  .avatar {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    object-fit: contain; // 互动图标可能需要 contain
    border-radius: 4px; // 给互动图标也加点圆角

    &.chat-avatar {
      border-radius: 50%; // 聊天头像保持圆形
      object-fit: cover; // 头像使用 cover
    }
  }

  .content-box {
    flex: 1;
    border-bottom: 1px dashed #e9e9e9;
    padding: 4px 0 16px;
  }

  .header {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between; // 让标题和时间分开
    align-items: center; // 垂直居中
  }

  .title-txt {
    color: #315c9e;
    font-weight: 500;
    font-size: 14px;
    transition: font-weight 0.2s ease; // 添加过渡

    &.unread-title {
      font-weight: 600; // 未读标题加粗
    }
  }

  .time {
    color: #a1adc5;
    font-size: 12px; // 调小时间字体
    margin-left: 16px;
    white-space: nowrap; // 防止时间换行
  }

  .head-text {
    color: #152844;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 4px; // 增加一点间距

    .name {
      margin-right: 8px;
    }
  }

  .content {
    color: #484848;
    font-size: 14px;
    line-height: 22px;

    p {
      margin-bottom: 0; // 移除段落默认下边距
    }

    .view-chat-prompt {
      display: block; // 独占一行
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }
  }
}

// 空状态样式
:deep(.ant-empty-description) {
  color: #999;
}
</style>
