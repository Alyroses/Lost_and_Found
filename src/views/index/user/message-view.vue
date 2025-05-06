<template>
  <div class="content-list">
    <div class="list-title">我的消息</div>
    <a-spin :spinning="loading" style="min-height: 200px;">
      <div class="list-content">
        <div class="notification-view">
          <div class="list">
            <!-- 修改 v-for 循环，并添加 key -->
            <div class="notification-item flex-view" v-for="item in msgData" :key="item.id">
              <!-- 可以根据 item.notice_type 显示不同图标或样式 -->
              <img
                :src="getNoticeIcon(item.notice_type)" <!-- 使用函数获取图标 -->
                class="avatar">
              <div class="content-box">
                <div class="header">
                  <!-- 根据类型显示标题 -->
                  <span class="title-txt">{{ getNoticeTitle(item) }}</span>
                  <span class="time">{{ formatTime(item.create_time) }}</span> <!-- 格式化时间 -->
                </div>
                <!-- 可以显示发送者信息 -->
                <div class="head-text" v-if="item.sender">
                  <span class="name">来自: {{ item.sender.nickname || item.sender.username }}</span>
                </div>
                <div class="content">
                  <!-- 显示内容 -->
                  <p>{{ item.content }}</p>
                  <!-- 可以添加跳转到聊天的链接 -->
                  <a-button
                    v-if="item.notice_type === 'chat_message' && item.sender"
                    type="link"
                    size="small"
                    @click="goToChat(item)"
                    style="padding-left: 0; margin-top: 5px;"
                  >
                    查看对话
                  </a-button>
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
import { ref, onMounted } from 'vue'; // 导入 ref, onMounted
import { useRouter } from 'vue-router'; // 导入 useRouter
import { listApi, noticebyidApi } from '/@/api/index/notice';
import { useUserStore } from "/@/store";
import { message, Spin as ASpin, Empty as AEmpty, Button as AButton } from 'ant-design-vue'; // 导入所需组件
// 导入默认图标或不同类型的图标
import defaultNoticeIcon from 'data:image/png;base64,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';
import chatIcon from '/@/assets/icons/svg/chat-bubble.svg'; // 假设你有聊天图标
import likeIcon from '/@/assets/icons/svg/like.svg'; // 假设有点赞图标
import replyIcon from '/@/assets/icons/svg/reply.svg'; // 假设有回复图标

const userStore = useUserStore();
const router = useRouter(); // 获取 router 实例

const noticeId = userStore.user_id; // 确保获取到当前用户 ID

const loading = ref(false);
const msgData = ref<any[]>([]); // 指定类型

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
  noticebyidApi({ user: noticeId }) // 传递 user ID
    .then(res => {
      if (res.code === 0 && Array.isArray(res.data)) {
        // 处理数据，例如添加 isChatMessage 标志
        msgData.value = res.data.map(item => ({
          ...item,
          isChatMessage: item.notice_type === 'chat_message'
        }));
        console.log("Fetched notices:", msgData.value);
      } else {
        message.error(res.msg || '获取消息列表失败');
        msgData.value = []; // 清空数据
      }
      loading.value = false;
    })
    .catch(err => {
      console.error("Error fetching notices:", err);
      message.error('获取消息列表时出错');
      loading.value = false;
      msgData.value = []; // 清空数据
    });
};

// --- 新增：根据消息类型获取图标 ---
const getNoticeIcon = (noticeType: string) => {
  switch (noticeType) {
    case 'chat_message': return chatIcon;
    case 'like': return likeIcon;
    case 'reply': return replyIcon;
    default: return defaultNoticeIcon;
  }
};

// --- 新增：根据消息类型和内容生成标题 ---
const getNoticeTitle = (item: any) => {
  switch (item.notice_type) {
    case 'chat_message':
      return `来自 ${item.sender?.nickname || item.sender?.username || '未知用户'} 的消息`;
    case 'like':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 点赞了你的评论`;
    case 'reply':
      return `${item.sender?.nickname || item.sender?.username || '有人'} 回复了你的评论`;
    default:
      return item.title || '系统通知'; // 默认标题
  }
};

// --- 新增：格式化时间函数 (示例) ---
const formatTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    // 简单的格式化，可以根据需要使用更复杂的库如 dayjs
    return date.toLocaleString();
  } catch (e) {
    return timeStr; // 格式化失败则返回原始字符串
  }
};

// --- 新增：跳转到聊天页面 ---
const goToChat = (item: any) => {
  if (item.sender && item.thing_id && item.thing_type) {
    router.push({
      name: 'chat', // 确认聊天路由的名称
      params: { recipientId: item.sender.id }, // 发送者是聊天的对方
      query: {
        thingId: item.thing_id,
        thingType: item.thing_type,
      },
    });
    // 可以在这里调用 API 将消息标记为已读
    // markNoticeAsRead(item.id);
  } else {
    message.warn("无法跳转到聊天，缺少必要信息");
  }
};

</script>

// --- 样式部分保持不变 ---
<style scoped lang="less">
progress {
  vertical-align: baseline;
}

.flex-view {
  display: flex;
}

input, textarea {
  outline: none;
  border-style: none;
}

button {
  padding: 0;
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
    width: 40px; // 稍微增大图标
    height: 40px;
    // border-radius: 50%; // 如果图标不是圆形的，可以移除
    margin-right: 12px; // 增大间距
    object-fit: contain; // 确保图标完整显示
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
    margin-left: 16px;
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

}

</style>
