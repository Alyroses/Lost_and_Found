<template>
  <div class="chat-page-container"> <!-- 修改：最外层容器 -->
    <Header />
    <div class="chat-app-wrapper"> <!-- 新增：包裹聊天主体内容 -->
      <!-- 左侧栏：当前用户信息 -->
      <div class="sidebar left-sidebar">
        <div class="user-profile">
          <a-avatar :size="64" :src="userStore.user_avatar || AvatarIcon" />
          <div class="username">用户: {{ userStore.user_name || '我' }}</div>
          <!-- 可以添加在线状态指示灯 -->
          <span class="online-status" :class="{ 'online': userStore.user_login_status, 'offline': !userStore.user_login_status }"></span>
        </div>
      </div>

      <!-- 中间聊天区域 -->
      <div class="chat-main-content">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <span v-if="isFetchingRecipient">加载中...</span>
          <span v-else>正在和 {{recipientInfo.username || '用户' }} 聊天</span>
        </div>
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div v-if="isLoadingHistory" class="loading-history">加载历史消息...</div>
          <div
            v-for="msg in messages"
            :key="msg.id || msg.timestamp"
            :class="['message-item', msg.sender_id === userStore.user_id ? 'sent' : 'received']"
          >
            <a-avatar :src="msg.sender_avatar || AvatarIcon" class="message-avatar" />
            <div class="message-bubble">
              <div class="message-content">{{ msg.content }}</div>
              <!-- 时间可以放在气泡下方或悬停显示，简化气泡 -->
              <!-- <div class="message-time">{{ formatTimestamp(msg.timestamp) }}</div> -->
            </div>
             <!-- 显示时间戳 -->
             <div class="message-timestamp">{{ formatTimestamp(msg.timestamp) }}</div>
          </div>
        </div>
        <!-- 输入区域 -->
        <div class="message-input-section"> <!-- 新增包裹层 -->
          <!-- 新增：物品信息卡片 -->
          <div v-if="isFetchingItem" class="item-info-card loading">
            正在加载物品信息...
          </div>
          <div v-else-if="itemInfo.id" class="item-info-card">
            <a-avatar shape="square" :size="40" :src="itemInfo.cover || AvatarIcon" class="item-cover" />
            <div class="item-details">
              <div class="item-title" :title="itemInfo.title">{{ itemInfo.title }}</div>
              <!-- 可以添加其他信息，如类型 -->
              <a-tag size="small" :color="itemInfo.type === 'found' ? 'orange' : 'green'">
                {{ itemInfo.type === 'found' ? '拾物' : '失物' }}
              </a-tag>
            </div>
            <!-- 可选：添加关闭按钮或链接 -->
             <a :href="`/index/detail?id=${itemInfo.id}&type=${itemInfo.type}`" target="_blank" class="view-detail-link">
               <link-outlined />
             </a>
          </div>
          <!-- 新增结束 -->

          <div class="message-input-area">
            <a-textarea
              v-model:value="newMessage"
              placeholder="输入消息..."
              :rows="4"
              @pressEnter.prevent="sendMessage"
              class="message-input"
              :disabled="isSending"  
            /> <!-- 将注释移到标签外部 -->
            <!-- 增加行数 -->
            <a-button type="primary" @click="sendMessage" :loading="isSending" :disabled="isSending || !newMessage.trim()" class="send-button">
              发送
            </a-button>
          </div>
        </div> <!-- 包裹层结束 -->
      </div>

      <!-- 右侧栏：好友列表和系统广播 -->
      <div class="sidebar right-sidebar">
        <div class="friend-list section">
          <h4 class="section-title">当前聊天</h4>
          <ul>
            <!-- 示例好友 -->
            <li class="friend-item" :class="{ 'online': recipientInfo.login_status, 'offline': !recipientInfo.login_status }">
              <a-avatar :size="64" :src="isFetchingRecipient ? AvatarIcon : (recipientInfo.avatar || AvatarIcon)" />
              <span v-if="isFetchingRecipient">加载中...</span>
              <span v-else>{{recipientInfo.username || '用户' }}</span>
              <span class="online-status" :class="{ 'online': recipientInfo.login_status, 'offline': !recipientInfo.login_status }"></span>
            </li>
            <!-- 可以从API获取好友列表并循环 -->
          </ul>
        </div>
        <div class="system-broadcast section">
          <h4 class="section-title">系统广播</h4>
          <ul>
            <!-- 示例广播 -->
            <li class="broadcast-item">您的好友 {{ recipientInfo.nickname || recipientInfo.username }} 已上线</li>
            <!-- 可以从WebSocket或API获取系统消息 -->
          </ul>
        </div>
      </div>
    </div>
    <!-- Footer 可以移除，或者放在 chat-page-container 的最底部 -->
    <!-- <Footer /> -->
  </div>
</template>

<script setup lang="ts">
console.log('--- chat.vue script setup started ---'); // <-- 添加日志

import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '/@/store';
import { message as antMessage } from 'ant-design-vue';
import Header from '/@/views/index/components/header.vue';
import Footer from '/@/views/index/components/footer.vue';
import AvatarIcon from '/@/assets/images/avatar.jpg'; // 默认头像
import { getHistoryApi } from '/@/api/index/chat'; // 引入API
import { detailApi as getUserProfileByIdApi } from '/@/api/index/user'; // 使用别名导入，更清晰
// --- 导入物品详情 API ---
import { detailApi as getThingDetailApi } from '/@/api/index/thing';
import { BASE_URL } from '/@/store/constants'; // 确保导入 BASE_URL
// --- 导入图标 ---
import { LinkOutlined } from '@ant-design/icons-vue';
import defaultAvatar from '/@/assets/images/avatar.jpg'; // 引入默认头像
import { formatTimestamp } from '/@/utils/format'; // 假设有时间格式化工具

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const recipientId = ref<string | number | null>(null);
const recipientInfo = reactive({ id: '', username: '', nickname: '', avatar: '', login_status: false }); // 添加 id 和 login_status 字段
// --- 新增：存储物品信息 ---
const thingId = ref<string | null>(null);
const thingType = ref<string | null>(null);
// --- 新增：物品信息状态 ---
const itemInfo = reactive({ id: '', title: '', cover: '', type: '' });
const isFetchingItem = ref(false);
// --- 新增结束 ---
const messages = ref<any[]>([]); // 聊天消息列表
const newMessage = ref('');
const ws = ref<WebSocket | null>(null);
const isSending = ref(false);
const isLoadingHistory = ref(false);
const messageListRef = ref<HTMLElement | null>(null); // 用于滚动到底部
const isFetchingRecipient = ref(false); // 新增：对方信息加载状态

// --- WebSocket 相关 ---
const connectWebSocket = () => {
  if (!userStore.user_token || !recipientId.value || !thingId.value || !thingType.value) {
    antMessage.error('无法建立连接：缺少用户信息、接收者或物品信息');
    return;
  }

  // --- 修改 WebSocket URL ---
  // 直接使用指定的 WebSocket 服务器地址和端口
  const wsBaseUrl = 'ws://127.0.0.1:8001'; // *** 直接指定 WebSocket 基础 URL ***
  const wsPath = '/ws/chat'; // *** 请与后端确认此路径 ***
  // 拼接完整的 WebSocket URL，包含 token 和其他参数
  const wsUrl = `${wsBaseUrl}${wsPath}?token=${userStore.user_token}&recipientId=${recipientId.value}&thingId=${thingId.value}&thingType=${thingType.value}`;
  // --- 修改结束 ---

  console.log('Connecting to WebSocket:', wsUrl); // 添加日志方便调试

  ws.value = new WebSocket(wsUrl);

  ws.value.onopen = () => {
    console.log('WebSocket 连接已建立');
    // 连接建立后可以获取历史消息
    fetchHistoryMessages();
  };

  ws.value.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('收到消息:', msg);
      // 假设收到的消息结构包含 sender_id, content, timestamp 等
      // 需要补充发送者头像等信息 (如果后端没给，可能需要额外查询)
      messages.value.push({ ...msg, sender_avatar: msg.sender_id === recipientId.value ? recipientInfo.avatar : userStore.user_avatar });
      scrollToBottom();
    } catch (error) {
      console.error('处理接收到的消息时出错:', error);
    }
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket 错误:', error);
    antMessage.error('聊天连接发生错误');
  };

  ws.value.onclose = (event) => {
    console.log('WebSocket 连接已关闭:', event.code, event.reason);
    ws.value = null;
    // 可以根据需要实现重连逻辑
    if (event.code !== 1000) { // 1000 是正常关闭
      antMessage.warn('聊天连接已断开，请刷新页面重试');
    }
  };
};

const sendMessage = () => {
  // --- 新增：检查是否正在发送 ---
  if (isSending.value) {
    console.log('Already sending, please wait...');
    return;
  }
  // --- 新增结束 ---

  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    antMessage.error('连接未建立，无法发送消息');
    return;
  }
  if (!newMessage.value.trim()) {
    antMessage.warn('不能发送空消息');
    return;
  }

  isSending.value = true;
  const messageToSend = {
    content: newMessage.value.trim(),
    recipient_id: recipientId.value,
    sender_id: userStore.user_id, // 确保发送者ID正确
    timestamp: Date.now(), // 前端生成时间戳，后端可能会覆盖
    // --- 新增：发送消息时也带上物品信息 ---
    thing_id: thingId.value,
    thing_type: thingType.value,
    
    // --- 新增结束 ---
  };

  // --- 新增：添加日志，检查函数调用次数 ---
  console.log('Calling sendMessage function. isSending:', isSending.value, 'Message:', messageToSend.content);

  try {
    ws.value.send(JSON.stringify(messageToSend));
    // 发送成功后，将消息添加到本地列表 (模拟实时)
    messages.value.push({
        ...messageToSend,
        sender_avatar: userStore.user_avatar // 使用当前用户头像
    });
    newMessage.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
    antMessage.error('发送消息失败');
  } finally {
     // --- 新增：无论成功或失败，最后都重置发送状态 ---
     // 可以加个小延迟给用户反馈时间
     setTimeout(() => {
        isSending.value = false;
        console.log('Reset isSending to false');
     }, 300); // 延迟 300 毫秒
     // --- 新增结束 ---
  }
};

// --- 获取历史消息 ---
const fetchHistoryMessages = async () => {
  if (!recipientId.value) {
    console.error('Cannot fetch history: recipientId is missing.');
    return;
  }
  try {
    console.log('Calling getChatHistoryApi...');
    const params: any = { recipientId: recipientId.value };
    if (thingId.value) params.thingId = thingId.value;
    if (thingType.value) params.thingType = thingType.value;
    // 如果需要分页，可以添加 page 和 pageSize
    // params.page = 1;
    // params.pageSize = 50; // 例如一次加载 50 条

    const res = await getHistoryApi(params); // <-- 调用 API
    console.log('Chat history response:', res); // 打印响应以供调试

    if (res.code === 0 && Array.isArray(res.data)) {
      // 假设后端返回的消息数组是按时间升序排列的
      const historyMessages = res.data.map(msg => ({
        id: msg.id, // 假设后端返回消息 ID
        sender: msg.sender, // 假设后端返回完整的 sender 对象 { id, username, avatar }
        recipient: msg.recipient, // 假设后端返回完整的 recipient 对象
        content: msg.content,
        timestamp: msg.create_time || new Date().toISOString(), // 使用后端时间戳
        isOwn: msg.sender.id === userStore.user_id, // 判断是否是自己发送的
      }));
      // 将历史消息添加到当前消息列表的开头
      messages.value = [...historyMessages, ...messages.value];

      // 加载历史后滚动到底部 (或者滚动到历史消息和新消息的分界处)
      await nextTick();
      scrollToBottom();

    } else {
      console.error('Failed to fetch chat history:', res.msg);
      antMessage.error('加载历史消息失败: ' + (res.msg || '未知错误'));
    }
  } catch (error) {
    console.error('Error fetching chat history:', error); // <-- 打印捕获到的错误
    antMessage.error('加载历史消息时发生网络或服务器错误');
  }
};

// --- 获取对方用户信息 ---
const fetchRecipientInfo = async () => {
    if (!recipientId.value) return;
    isFetchingRecipient.value = true; // 开始加载
    try {
        // --- 调用 API 获取用户信息 ---
        const res = await getUserProfileByIdApi({ id: recipientId.value });
        if (res.data) {
            recipientInfo.id = res.data.id; // 保存 ID
            recipientInfo.username = res.data.username;
            recipientInfo.avatar = res.data.avatar ;
            // --- 保存 login_status ---
            recipientInfo.login_status = res.data.login_status === 1 || res.data.login_status === true;
            // --- 保存结束 ---
            console.log("Fetched recipient info:", recipientInfo);
        } else {
             antMessage.error('无法加载对方用户信息: 未找到数据');
             // 可以设置默认值或显示错误状态
             recipientInfo.nickname = `用户${recipientId.value}`;
             recipientInfo.avatar = AvatarIcon;
             recipientInfo.login_status = false; // 获取失败时设为离线
        }
        // --- API 调用结束 ---

    } catch (error) {
        console.error('获取对方用户信息失败:', error);
        const errorMessage = (error as { msg?: string }).msg || '请求失败';
        antMessage.error(`无法加载对方用户信息: ${errorMessage}`);
        // 出错时设置默认值
        recipientInfo.nickname = `用户${recipientId.value}`;
        recipientInfo.avatar = AvatarIcon;
        recipientInfo.login_status = false; // 获取失败时设为离线
    } finally {
        isFetchingRecipient.value = false; // 结束加载
    }
};

// --- 新增：获取物品信息函数 ---
const fetchItemInfo = async () => {
  if (!thingId.value || !thingType.value) return;
  isFetchingItem.value = true;
  try {
    const res = await getThingDetailApi({ id: thingId.value, type: thingType.value });
    if (res.data) {
      itemInfo.id = res.data.id;
      itemInfo.title = res.data.title;
      itemInfo.cover = res.data.cover ? `${BASE_URL}${res.data.cover}` : ''; // 拼接基础 URL
      itemInfo.type = thingType.value; // 直接使用路由中的 type
      console.log("Fetched item info:", itemInfo);
    } else {
      antMessage.error('无法加载物品信息: 未找到数据');
    }
  } catch (error) {
    console.error('获取物品信息失败:', error);
    const errorMessage = (error as { msg?: string }).msg || '请求失败';
    antMessage.error(`无法加载物品信息: ${errorMessage}`);
  } finally {
    isFetchingItem.value = false;
  }
};
// --- 新增结束 ---

// --- 滚动到底部 ---
const scrollToBottom = (force = false) => {
  nextTick(() => {
    const container = messageListRef.value;
    if (container) {
      // 只有在接近底部或强制滚动时才滚动
      const threshold = 100; // 距离底部的阈值
      const shouldScroll = force || (container.scrollHeight - container.scrollTop - container.clientHeight < threshold);
      if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }
  });
};

// --- 时间格式化 ---
const formatTimestamp = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString(); // 或者使用更复杂的日期格式化库
};

// --- 生命周期钩子 ---
onMounted(async () => {
  console.log('--- chat.vue onMounted hook ---'); // <-- 添加日志
  // --- 修改：从路由参数和查询参数获取信息 ---
  recipientId.value = route.params.recipientId as string; // 从路由参数获取对方ID
  thingId.value = route.query.thingId as string;
  thingType.value = route.query.thingType as string;
  // --- 修改结束 ---

  // --- 修改：检查所有必要参数 ---
  if (!recipientId.value || !thingId.value || !thingType.value) {
    antMessage.error('无效的聊天参数');
    router.push({ name: 'portal' });
    return;
  }
  // --- 修改结束 ---

  if (!userStore.user_id) {
      antMessage.warn('请先登录');
      router.push({ name: 'login', query: { redirect: route.fullPath } });
      return;
  }

  // --- 并行获取对方信息和物品信息 ---
  await Promise.all([
    fetchRecipientInfo(),
    fetchItemInfo() // 调用获取物品信息函数
  ]);
  // --- 修改结束 ---

  if (recipientInfo.id) {
      connectWebSocket();
  } else {
      antMessage.error("无法建立聊天连接，缺少对方用户信息");
  }
});

onUnmounted(() => {
  if (ws.value) {
    ws.value.close(1000, 'Component unmounted'); // 正常关闭
    ws.value = null;
  }
});

// 监听消息变化，自动滚动
watch(messages, () => {
    scrollToBottom();
}, { deep: true });

console.log('--- chat.vue setup code executing ---'); // <-- 添加日志

</script>

<style scoped lang="less">
 @primary-color: #1890ff; // 主题色
// 修改导入路径，使用 @ 别名指向 src 目录
// @import '/@/assets/css/variables.less'; // 或者尝试 @import '@/assets/css/variables.less';

// --- 全局页面样式 ---
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  // background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); // 参考图片的蓝紫色渐变
  background-color: #eef1f5; // 或者使用柔和的背景色
  overflow: hidden; // 防止内部元素溢出导致滚动条
}

// --- 聊天应用主体包裹器 ---
.chat-app-wrapper {
  flex: 1; // 占据剩余空间
  display: flex;
  max-width: 1200px; // 限制最大宽度
  width: 90%; // 响应式宽度
  margin: 76px auto; // 上下边距，左右居中
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden; // 内部元素不溢出
}

// --- 侧边栏通用样式 ---
.sidebar {
  width: 200px; // 固定宽度
  flex-shrink: 0; // 防止被压缩
  background-color: #f7f9fa; // 侧边栏背景色
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.left-sidebar {
  border-right: 1px solid #e8e8e8;
  align-items: center; // 居中内容

  .user-profile {
    text-align: center;
    margin-top: 20px;

    .username {
      margin-top: 12px;
      font-weight: bold;
      color: #333;
    }

    .online-status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-left: 5px;
      &.online { background-color: #52c41a; }
      &.offline { background-color: #bfbfbf; }
    }
  }
}

.right-sidebar {
  width: 240px; // 右侧栏稍宽
  border-left: 1px solid #e8e8e8;
  border-right: none; // 移除右边框

  .section {
    margin-bottom: 25px;
    .section-title {
      font-size: 14px;
      color: #888;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        padding: 6px 0;
        font-size: 14px;
        color: #555;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 4px;
        &:hover {
          background-color: #eee;
        }
        &.online span {
          font-weight: 500; // 在线好友加粗
        }
      }
    }
  }
  .broadcast-item {
    color: #777;
    font-size: 13px;
  }
}

// --- 中间聊天区域 ---
.chat-main-content {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;
  background-color: #fff; // 中间区域背景
  min-width: 0; // 防止 flex item 溢出
}

// --- 聊天头部 ---
.chat-header {
  padding: 15px 20px;
  font-size: 16px;
  font-weight: 500; // 调整字重
  border-bottom: 1px solid #e8e8e8;
  text-align: center;
  background-color: #fdfdfd; // 头部背景色
  color: #333;
  flex-shrink: 0; // 防止被压缩
}

// --- 消息列表 ---
.message-list {
  flex: 1; // 占据剩余空间
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5; // 消息列表背景色

  .loading-history {
    text-align: center;
    color: #aaa;
    padding: 10px 0;
    font-size: 12px;
  }
}

// --- 消息项 ---
.message-item {
  display: flex;
  margin-bottom: 20px; // 增加消息间距
  align-items: flex-start; // 头像和气泡顶部对齐

  .message-avatar {
    flex-shrink: 0;
    margin-top: 0; // 确保头像顶部对齐
  }

  .message-bubble {
    padding: 10px 15px;
    border-radius: 8px; // 调整圆角
    max-width: calc(100% - 100px); // 限制最大宽度
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    position: relative; // 用于可能的伪元素角标
    word-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .message-timestamp {
    font-size: 11px;
    color: #aaa;
    margin: 0 10px; // 时间戳与气泡的间距
    align-self: center; // 垂直居中时间戳
    flex-shrink: 0;
  }

  // 发送的消息 (靠右)
  &.sent {
    flex-direction: row-reverse;

    .message-bubble {
      background-color: #95ec69; // 绿色气泡
      margin-right: 12px;
      border-radius: 8px 0 8px 8px; // 调整圆角方向
    }
    .message-avatar {
      margin-left: 0; // 移除左边距
    }
     .message-timestamp {
       order: -1; // 将时间戳放在气泡左侧
     }
  }

  // 接收的消息 (靠左)
  &.received {
    flex-direction: row;

    .message-bubble {
      background-color: #ffffff; // 白色气泡
      margin-left: 12px;
      border-radius: 0 8px 8px 8px; // 调整圆角方向
    }
     .message-avatar {
      margin-right: 0; // 移除右边距
    }
     .message-timestamp {
       order: 1; // 将时间戳放在气泡右侧
     }
  }
}

// --- 输入区域 ---
.message-input-area {
  display: flex;
  padding: 15px 20px;
  border-top: 1px solid #e8e8e8;
  background-color: #fdfdfd; // 输入区域背景色
  align-items: flex-end; // 底部对齐
  flex-shrink: 0; // 防止被压缩

  .message-input {
    flex: 1;
    margin-right: 15px;
    resize: none;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 8px 12px;
    &:focus {
      border-color: @primary-color;
      box-shadow: 0 0 0 2px fade(@primary-color, 20%);
    }
  }

  .send-button {
    // height: auto; // 移除固定高度
    // min-height: 74px; // 移除最小高度
    padding: 10px 20px; // 调整内边距
    height: 40px; // 固定按钮高度
    align-self: center; // 按钮垂直居中
  }
}

// 响应式调整 (可选)
@media (max-width: 992px) {
  .chat-app-wrapper {
    width: 95%;
    margin: 10px auto;
  }
  .sidebar {
    display: none; // 在较小屏幕上隐藏侧边栏
  }
}

// --- 新增：输入区域包裹层和物品卡片样式 ---
.message-input-section {
  border-top: 1px solid #e8e8e8;
  background-color: #fdfdfd; // 与输入区域背景色一致或稍有区别
  flex-shrink: 0; // 防止被压缩
}

.item-info-card {
  display: flex;
  align-items: center;
  padding: 8px 20px; // 内边距
  background-color: #f0f2f5; // 卡片背景色
  border-bottom: 1px solid #e8e8e8; // 分隔线

  &.loading {
    color: #999;
    font-size: 13px;
  }

  .item-cover {
    margin-right: 12px;
    flex-shrink: 0;
  }

  .item-details {
    flex: 1; // 占据剩余空间
    min-width: 0; // 防止文本溢出

    .item-title {
      font-size: 14px;
      color: #333;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px; // 与标签间距
    }
  }

  .view-detail-link {
    margin-left: 12px;
    color: #888;
    font-size: 16px;
    &:hover {
      color: @primary-color;
    }
  }
}

.message-input-area {
  // 移除 border-top 和 background-color，移到 .message-input-section
  border-top: none;
  background-color: transparent;
  padding: 15px 20px; // 保持原内边距
  // ... 其他现有样式 ...
}
// --- 新增样式结束 ---

.online-status {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 8px;
  vertical-align: middle;

  &.online {
    background-color: #52c41a; // 绿色表示在线
    box-shadow: 0 0 5px #52c41a;
  }

  // --- 新增：离线状态样式 ---
  &.offline {
    background-color: #bfbfbf; // 灰色表示离线
  }
  // --- 新增结束 ---
}

// 调整右侧边栏列表项样式以容纳指示灯
.right-sidebar .friend-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f2f5;
  }

  .ant-avatar {
    margin-right: 10px;
    flex-shrink: 0;
  }

  span:not(.online-status) { // 排除状态灯，让用户名占据剩余空间
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 8px; // 与状态灯保持间距
  }

  .online-status {
    flex-shrink: 0; // 防止状态灯被压缩
  }
}

// 左侧边栏用户 profile 内的状态灯位置微调 (如果需要)
.left-sidebar .user-profile {
  position: relative; // 使得状态灯可以相对于它定位 (如果需要绝对定位)
  // ... 其他样式 ...
 
}

/* 新增：调整 a-avatar 内部 img 的样式 */
:deep(.ant-avatar > img) {
  display: block; /* 确保是块级元素 */
  height: 60px;   /* 让图片高度填充 Avatar 高度 */
  width: 60px;    /* 让图片宽度填充 Avatar 宽度 */
  object-fit: cover; /* 裁剪并覆盖整个区域，保持比例 */
  /* 移除固定的 60px，让其自适应 Avatar 的 size 属性 */
  /* height: 60px; */
  /* width: 60px; */
}

</style>
