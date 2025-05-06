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
            :class="['message-item', msg.isOwn ? 'sent' : 'received']"
          >
            <a-avatar :src="msg.sender_avatar || AvatarIcon" class="message-avatar" />
            <div class="message-bubble">
              <div class="message-content">{{ msg.content }}</div>

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
            <!--  移除好友列表占位符 -->
          </ul>
        </div>
        <div class="system-broadcast section">
          <h4 class="section-title">系统广播</h4>
          <ul>
            <!-- 示例广播 -->
            <!-- <li class="broadcast-item">您的好友 {{ recipientInfo.nickname || recipientInfo.username }} 已上线</li> -->
            <li class="broadcast-item">系统通知会在这里显示。</li>
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

import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
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


const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loggedInUserId = computed(() => Number(userStore.user_id)); // Ensure it's a number

const recipientId = ref<number | null>(null); // Store as number
const recipientInfo = reactive({ id: 0, username: '', nickname: '', avatar: '', login_status: false }); // 修改 id 为 number 类型
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
      const receivedMsg = JSON.parse(event.data as string); 
      console.log('收到消息:', receivedMsg);

      if (receivedMsg.type === 'presence_update') {
        if (receivedMsg.userId && Number(receivedMsg.userId) === recipientInfo.id) { // Compare as numbers
          recipientInfo.login_status = receivedMsg.status;
          console.log(`Recipient ${recipientInfo.id} presence updated to: ${receivedMsg.status}`);
        }
      } else if (receivedMsg.type === 'chat_message' || typeof receivedMsg.type === 'undefined') { 
        const senderIdNum = Number(receivedMsg.sender_id);
        const messageIsOwn = senderIdNum === loggedInUserId.value;
        
        // --- 修改：如果消息是自己发送的（服务器回显），则不重复添加 ---
        if (messageIsOwn) {
          console.log('Received echoed message from self, ignoring. ID:', receivedMsg.id);
          return; // 不再将回显消息添加到 messages 数组
        }
        // --- 修改结束 ---
        
        messages.value.push({
          id: receivedMsg.id || Date.now(), 
          sender_id: senderIdNum,
          content: receivedMsg.content,
          timestamp: receivedMsg.timestamp || new Date().toISOString(),
          // 此处的 messageIsOwn 实际上会是 false，因为 true 的情况已经 return
          sender_avatar: receivedMsg.sender_avatar || 
                         (messageIsOwn /*始终为false*/ ? userStore.user_avatar : recipientInfo.avatar) || 
                         AvatarIcon,
          isOwn: messageIsOwn, // 此处 isOwn 始终为 false
          sender_username: receivedMsg.sender_username 
        });
        scrollToBottom();
      } else {
        console.warn('Received unhandled WebSocket message type:', receivedMsg.type);
      }
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
  const currentUserIdNum = loggedInUserId.value; // Use computed number version
  const messageToSend = {
    content: newMessage.value.trim(),
    recipient_id: recipientId.value, // recipientId is already a number
    sender_id: currentUserIdNum, 
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
        sender_avatar: userStore.user_avatar, // 使用当前用户头像
        isOwn: true // Explicitly set isOwn to true for sent messages
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
  if (!recipientId.value) { // recipientId is now a number
    console.error('Cannot fetch history: recipientId is missing.');
    return;
  }
  try {
    isLoadingHistory.value = true; // Set loading true
    console.log('Calling getChatHistoryApi...');
    const params: any = { recipientId: recipientId.value };
    if (thingId.value) params.thingId = thingId.value;
    if (thingType.value) params.thingType = thingType.value;

    const res = await getHistoryApi(params);
    console.log('Chat history response:', res);

    if (res.code === 0 && Array.isArray(res.data)) {
      const currentUserIdNum = loggedInUserId.value; // Use computed number version
      const historyMessages = res.data.map(msg => {
        const senderIdNum = Number(msg.sender.id); // Ensure sender ID from history is a number
        return {
          id: msg.id,
          sender: msg.sender, 
          recipient: msg.recipient, 
          content: msg.content,
          timestamp: msg.create_time || new Date().toISOString(),
          isOwn: senderIdNum === currentUserIdNum, // Calculate isOwn based on numeric comparison
          sender_id: senderIdNum, 
          sender_avatar: msg.sender.avatar || AvatarIcon, 
          sender_username: msg.sender.username // Keep username if available
        };
      });
      messages.value = [...historyMessages.reverse(), ...messages.value]; // reverse to show oldest first if API returns newest first

      await nextTick();
      scrollToBottom(true); // Force scroll after loading history

    } else {
      console.error('Failed to fetch chat history:', res.msg);
      antMessage.error('加载历史消息失败: ' + (res.msg || '未知错误'));
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    antMessage.error('加载历史消息时发生网络或服务器错误');
  } finally {
    isLoadingHistory.value = false; // Set loading false
  }
};

// --- 获取对方用户信息 ---
const fetchRecipientInfo = async () => {
    if (!recipientId.value) return; // recipientId is now a number
    isFetchingRecipient.value = true; // 开始加载
    try {
        // --- 调用 API 获取用户信息 ---
        const res = await getUserProfileByIdApi({ id: recipientId.value }); // Pass number
        if (res.data) {
            recipientInfo.id = res.data.id; // Assign directly as number
            recipientInfo.username = res.data.username;
            recipientInfo.avatar = res.data.avatar ;
            // --- 保存 login_status ---
            recipientInfo.login_status = res.data.login_status === 1 || res.data.login_status === true;
            // --- 保存结束 ---
            console.log("Fetched recipient info:", recipientInfo);
        } else {
             antMessage.error('无法加载对方用户信息: 未找到数据');
             // 可以设置默认值或显示错误状态
             recipientInfo.username = `用户${recipientId.value}`;
             recipientInfo.avatar = AvatarIcon;
             recipientInfo.login_status = false; // 获取失败时设为离线
        }
        // --- API 调用结束 ---

    } catch (error) {
        console.error('获取对方用户信息失败:', error);
        const errorMessage = (error as { msg?: string }).msg || '请求失败';
        antMessage.error(`无法加载对方用户信息: ${errorMessage}`);
        // 出错时设置默认值
        recipientInfo.username = `用户${recipientId.value}`;
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
  const routeRecipientId = route.params.recipientId as string;
  recipientId.value = Number(routeRecipientId); // Convert to number
  
  thingId.value = route.query.thingId as string;
  thingType.value = route.query.thingType as string;

  const currentUserIdNum = loggedInUserId.value;

  // --- 检查是否尝试与自己聊天 ---
  if (recipientId.value && recipientId.value === currentUserIdNum) {
    antMessage.error('不能和自己聊天。');
    router.replace({ name: 'portal' }); // 或者其他合适的页面
    return;
  }
  // --- 检查结束 ---

  // --- 修改：检查所有必要参数 ---
  if (!recipientId.value || !thingId.value || !thingType.value) {
    antMessage.error('无效的聊天参数');
    router.push({ name: 'portal' });
    return;
  }
  // --- 修改结束 ---

  if (!userStore.user_id) { // Check original user_id from store for login status
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

  if (recipientInfo.id) { // Check if recipientInfo.id (which is a number) is populated
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

// --- 全局页面样式 ---
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  // --- 新增背景图片 ---
  background-image: url('/bg_main.jpg'); // 假设图片在 public 文件夹下
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  // --- 新增结束 ---
  overflow: hidden;
}

// --- 聊天应用主体包裹器 ---
.chat-app-wrapper {
  flex: 1;
  display: flex;
  max-width: 1200px;
  width: 90%;
  margin: 76px auto 20px auto; // 调整下边距
  // --- 修改背景为半透明，让背景图透出来一点 ---
  background-color: rgba(255, 255, 255, 0.9); // 轻微透明的白色背景
  // --- 修改结束 ---
  border-radius: 12px; // 增加圆角
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); // 调整阴影
  overflow: hidden;
}

// --- 侧边栏通用样式 ---
.sidebar {
  width: 220px; // 稍微加宽
  flex-shrink: 0;
  // --- 修改背景为半透明 ---
  background-color: rgba(247, 249, 250, 0.85); // 更透明一些
  // --- 修改结束 ---
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.left-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.08); // 边框颜色调淡
  align-items: center;

  .user-profile {
    text-align: center;
    margin-top: 20px;

    .username {
      margin-top: 12px;
      font-weight: bold;
      color: #434343; // 用户名颜色
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
  width: 260px; // 右侧栏稍宽
  border-left: 1px solid rgba(0, 0, 0, 0.08); // 边框颜色调淡
  border-right: none;

  .section {
    margin-bottom: 25px;
    .section-title {
      font-size: 14px;
      color: #777; // 标题颜色
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06); // 分割线颜色调淡
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        padding: 8px 5px; // 调整内边距
        font-size: 14px;
        color: #555;
        display: flex;
        align-items: center;
        gap: 10px; // 调整间距
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 6px; // 增加圆角
        &:hover {
          background-color: rgba(0, 0, 0, 0.04); // hover 背景色
        }
        &.online span:not(.online-status) { // 排除状态灯
          font-weight: 500;
          color: #333; // 在线好友文字颜色
        }
      }
    }
  }
  .broadcast-item {
    color: #666; // 广播文字颜色
    font-size: 13px;
  }
}

// --- 中间聊天区域 ---
.chat-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  // --- 修改背景为更透明或移除，依赖 chat-app-wrapper 的背景 ---
  background-color: transparent; // 或者 rgba(255, 255, 255, 0.8);
  // --- 修改结束 ---
  min-width: 0;
}

// --- 聊天头部 ---
.chat-header {
  padding: 18px 25px; // 调整内边距
  font-size: 17px; // 调整字号
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08); // 边框颜色调淡
  text-align: center;
  // --- 修改背景为半透明 ---
  background-color: rgba(253, 253, 253, 0.8);
  // --- 修改结束 ---
  color: #383838; // 头部文字颜色
  flex-shrink: 0;
}

// --- 消息列表 ---
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 25px; // 增加内边距
  // --- 修改背景为更透明或移除 ---
  background-color: transparent; // 或者 rgba(245, 245, 245, 0.75);
  // --- 修改结束 ---

  .loading-history {
    text-align: center;
    color: #999; // 加载文字颜色
    padding: 10px 0;
    font-size: 12px;
  }
}

// --- 消息项 ---
.message-item {
  display: flex;
  margin-bottom: 22px; // 增加消息间距
  align-items: flex-start;

  .message-avatar {
    flex-shrink: 0;
    margin-top: 0;
  }

  .message-bubble {
    padding: 12px 18px; // 调整气泡内边距
    border-radius: 10px; // 调整圆角
    max-width: calc(100% - 120px); // 调整最大宽度
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); // 调整阴影
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.6; // 调整行高
    font-size: 14px; // 消息文字大小
  }

  .message-timestamp {
    font-size: 11px;
    color: #888; // 时间戳颜色
    margin: 0 12px;
    align-self: center;
    flex-shrink: 0;
  }

  // 发送的消息 (靠右)
  &.sent {
    flex-direction: row-reverse;

    .message-bubble {
      // --- 修改发送气泡颜色，使其更柔和或匹配背景 ---
      background-color: #DCF8C6; // 示例：类似微信的淡绿色
      color: #333; // 文字颜色
      // --- 修改结束 ---
      margin-right: 12px;
      border-radius: 10px 0 10px 10px;
    }
    .message-avatar {
      margin-left: 0;
    }
     .message-timestamp {
       order: -1;
     }
  }

  // 接收的消息 (靠左)
  &.received {
    flex-direction: row;

    .message-bubble {
      // --- 修改接收气泡颜色 ---
      background-color: #FFFFFF; // 保持白色或浅灰色
      color: #333; // 文字颜色
      // --- 修改结束 ---
      margin-left: 12px;
      border-radius: 0 10px 10px 10px;
    }
     .message-avatar {
      margin-right: 0;
    }
     .message-timestamp {
       order: 1;
     }
  }
}

// --- 输入区域 ---
.message-input-section {
  border-top: 1px solid rgba(0, 0, 0, 0.08); // 边框颜色调淡
  // --- 修改背景为半透明 ---
  background-color: rgba(253, 253, 253, 0.85);
  // --- 修改结束 ---
  flex-shrink: 0;
}

.item-info-card {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  // --- 修改背景为半透明 ---
  background-color: rgba(240, 242, 245, 0.8);
  // --- 修改结束 ---
  border-bottom: 1px solid rgba(0, 0, 0, 0.07); // 边框颜色调淡

  &.loading {
    color: #888; // 加载文字颜色
    font-size: 13px;
  }

  .item-cover {
    margin-right: 12px;
    flex-shrink: 0;
  }

  .item-details {
    flex: 1;
    min-width: 0;

    .item-title {
      font-size: 14px;
      color: #434343; // 物品标题颜色
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
  }

  .view-detail-link {
    margin-left: 12px;
    color: #777; // 链接颜色
    font-size: 16px;
    &:hover {
      color: @primary-color;
    }
  }
}

.message-input-area {
  display: flex;
  padding: 15px 20px;
  background-color: transparent; // 因为父级已有背景
  align-items: flex-end;
  flex-shrink: 0;

  .message-input {
    flex: 1;
    margin-right: 15px;
    resize: none;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 10px 15px; // 调整内边距
    background-color: rgba(255, 255, 255, 0.9); // 输入框背景
    color: #333; // 输入文字颜色
    &:focus {
      border-color: @primary-color;
      box-shadow: 0 0 0 2px fade(@primary-color, 20%);
      background-color: #fff; // 聚焦时更不透明
    }
  }

  .send-button {
    padding: 10px 20px;
    height: 44px; // 调整按钮高度以匹配输入框
    align-self: center;
  }
}

// 响应式调整 (可选)
@media (max-width: 992px) {
  .chat-app-wrapper {
    width: 95%;
    margin: 70px auto 10px auto; // 调整边距
  }
  .sidebar {
    display: none; 
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
  height: 100%;   /* 修改为100%以适应Avatar的size */
  width: 100%;    /* 修改为100%以适应Avatar的size */
  object-fit: cover; /* 裁剪并覆盖整个区域，保持比例 */
  /* 移除固定的 60px，让其自适应 Avatar 的 size 属性 */
  /* height: 60px; */
  /* width: 60px; */
}

</style>
