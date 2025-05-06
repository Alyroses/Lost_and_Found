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
      <el-popover placement="right" width="350" trigger="click">
        <el-table :data="data.rankingList" v-loading="data.loading" :default-sort="{prop: 'total_points', order: 'descending'}">
          <!-- 新增：头像列 -->
          <el-table-column label="头像" width="70" align="center">
            <template #default="{ row }">
              <img :src="row.avatar || AvatarIcon" alt="avatar" class="rank-avatar" style="width: 20px; height: 20px;"/>
            </template>
          </el-table-column>
          <!-- 用户昵称列 -->
          <el-table-column label="用户昵称" width="150">
            <template #default="{ row, $index }">
              <span :style="{ color: row.id === currentUserId ? 'red' : '#ccaf13' }">
                {{ $index + 1 }}. {{ row.nickname || row.username || '匿名用户' }}
              </span>
            </template>
          </el-table-column>
          <!-- 积分列 -->
          <el-table-column label="积分" width="80" prop="total_points" sortable>
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

      <!-- 修改：消息图标点击打开抽屉 -->
      <div class="right-icon" @click="openMessageDrawer">
        <img :src="MessageIcon" />
        <span class="msg-point" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>

      <!-- 恢复：消息抽屉 -->
      <div>
        <a-drawer title="消息通知" placement="right" :closable="true" :maskClosable="true" :visible="msgVisible" @close="onClose" width="380">
          <a-spin :spinning="loading" style="min-height: 200px">
            <div class="list-content">
              <div class="notification-view">
                <div class="list">
                  <!-- 修改 v-for 循环，并添加 key 和点击事件 -->
                  <div
                    class="notification-item flex-view"
                    v-for="item in msgData"
                    :key="item.id"
                    :class="{ 'unread': !item.is_read, 'is-chat': item.notice_type === 'chat_message' }"
                    @click="handleNoticeClick(item)"
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
                      <!-- 聊天消息不显示发送者信息在 head-text (已在标题显示) -->
                      <div class="head-text" v-if="item.notice_type !== 'chat_message' && item.sender">
                         <!-- 其他类型通知可显示发送者 -->
                         <span class="name">来自: {{ item.sender.nickname || item.sender.username }}</span>
                      </div>
                      <div class="content">
                        <!-- 显示内容 -->
                        <p>{{ item.content }}</p>
                        <!-- 聊天消息显示 "点击查看对话" 提示 -->
                         <span v-if="item.notice_type === 'chat_message'" class="view-chat-prompt">
                           点击查看对话
                         </span>
                      </div>
                    </div>
                  </div>
                  <!-- 添加空状态显示 -->
                  <a-empty v-if="!loading && msgData.length === 0" description="暂无新消息" style="margin-top: 20px;" />
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
// 修改：导入所需模块和 API
import { onMounted, ref, watch, reactive } from 'vue';
// 恢复：Ant Design Drawer 相关组件
import { message, Spin as ASpin, Drawer as ADrawer, Empty as AEmpty } from 'ant-design-vue';
import LogoIcon from '/public/lost_found_logo.png';
// 修改：导入 listApi
import { listApi, unreadCountApi, markAsReadApi } from '/@/api/index/notice'; // 确保导入 markAsReadApi
import { listApi as UserListApi } from '/@/api/admin/user';
import { getUserRankingApi } from '/@/api/index/user';
import AvatarIcon from '/@/assets/images/avatar.jpg'; // 默认头像
import logoImage from '/@/assets/images/k-logo.png';
import MessageIcon from '/@/assets/images/message-icon.svg';
import SearchIcon from '/@/assets/images/search-icon.svg';
// 恢复：聊天和其他通知类型图标
import likeIcon from '/@/assets/icons/svg/like.svg';
import replyIcon from '/@/assets/icons/svg/reply.svg';
import defaultNoticeIcon from '/@/assets/icons/svg/notice.svg'; // Add a default notice icon

import { useUserStore } from '/@/store';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const currentUserId = userStore.user_id;

interface RankingItem {
  id: number;
  username: string;
  nickname?: string;
  total_points: number;
  avatar?: string; // 新增 avatar 属性
}
// 页面数据
const data = reactive({
  rankingList: [] as RankingItem[],
  loading: false, // loading for ranking
  keyword: '',
});

const keywordRef = ref();
// --- 消息相关状态 ---
const unreadCount = ref(0);
// 恢复：抽屉相关状态
const msgVisible = ref(false);
const loading = ref(false); // 这个 loading 用于抽屉
const msgData = ref<any[]>([]);

onMounted(() => {
  getUserRanking(); // 获取排名
  getUnreadCount(); // 获取未读消息数
  console.log('Header mounted. Avatar URL from store:', userStore.user_avatar);
});

// --- 监听用户登录状态 ---
watch(() => userStore.user_token, (newToken) => {
  if (newToken) {
    getUnreadCount(); // 登录后获取未读数
  } else {
    unreadCount.value = 0; // 登出后清零
    // 恢复：清空消息和关闭抽屉
    msgData.value = [];
    msgVisible.value = false;
  }
});

// --- 恢复：消息抽屉方法 ---
const openMessageDrawer = () => {
  if (!userStore.user_token) {
    message.warn('请先登录');
    return;
  }
  msgVisible.value = true;
  getMessageList(); // 打开时获取最新消息
  markAllAsRead(); // 打开时标记所有为已读 (更新红点)
};

const onClose = () => {
  msgVisible.value = false;
};

// 获取消息列表 (抽屉内)
const getMessageList = () => {
  loading.value = true;
  listApi({}) // 调用获取当前用户消息的 API
    .then((res) => {
      if (res.code === 0 && Array.isArray(res.data)) {
        msgData.value = res.data;
        console.log("Drawer notices fetched:", msgData.value);
      } else {
        message.error(res.msg || '获取消息列表失败');
        msgData.value = [];
      }
      loading.value = false;
    })
    .catch((err) => {
      console.error("Error fetching drawer notices:", err);
      message.error('获取消息列表时出错');
      loading.value = false;
      msgData.value = [];
    });
};

// 获取未读消息数 (右上角红点) - 保持不变
const getUnreadCount = () => {
  if (userStore.user_token && userStore.user_id) {
    unreadCountApi({ user: userStore.user_id }).then(res => {
      if (res.code === 0 && res.data && typeof res.data.count === 'number') {
        unreadCount.value = res.data.count;
        console.log('Unread count fetched:', unreadCount.value);
      } else {
        unreadCount.value = 0;
      }
    }).catch(err => {
      console.error('Error fetching unread count:', err);
      unreadCount.value = 0;
    });
  } else {
    unreadCount.value = 0;
  }
};

// 标记所有为已读 (打开抽屉时调用) - 恢复
const markAllAsRead = async () => {
  // 只有在有未读消息时才调用 API
  if (unreadCount.value > 0 && userStore.user_token) {
    try {
      // 使用从 notice.ts 导入的 markAsReadApi
      const res = await markAsReadApi({ all: 'true' });
      if (res.code === 0) {
        console.log('Marked all as read successfully via drawer open.');
        unreadCount.value = 0; // 更新红点计数
        // 可选：立即更新抽屉内所有项的已读状态，避免延迟
        msgData.value.forEach(item => item.is_read = true);
      } else {
        console.warn('Failed to mark all as read on drawer open:', res.msg);
      }
    } catch (err) {
      console.error('Error marking all as read on drawer open:', err);
    }
  }
};

// --- 恢复：处理通知点击和相关辅助函数 ---
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
       // 使用从 notice.ts 导入的 markAsReadApi
       await markAsReadApi({ notice_id: item.id });
       console.log(`Notice ${item.id} marked as read successfully.`);
       item.is_read = true; // 更新本地状态
       // 只有在实际减少了未读数时才递减
       if (unreadCount.value > 0) {
           // 谨慎递减，因为 markAllAsRead 可能已经清零
           // 最好在 markAllAsRead 成功后重新获取未读数
           // 或者，如果 markAllAsRead 只是更新本地状态，这里可以递减
           unreadCount.value--;
       }
     } catch (error) {
       console.error(`Failed to mark notice ${item.id} as read:`, error);
       message.error("标记已读失败");
     }
   }
}

// --- 跳转到聊天并标记已读 ---
const goToChatAndMarkRead = async (item: any) => {
  // 修改：检查 item.frontend_thing_type
  // --- 修改这里的条件 ---
  if (!item.sender || !item.thing_id || !item.frontend_thing_type) {
  // --- 修改结束 ---
    console.warn("无法跳转到聊天，缺少必要信息:", item);
    message.warn("无法跳转到聊天，缺少必要信息");
    return;
  }

  // 1. 标记为已读 (如果未读)
  await markSingleNoticeAsRead(item);

  // 2. 跳转到聊天页面
  const recipientId = item.sender.id; // 聊天的对方是通知的发送者
  const thingId = item.thing_id;
  // 修改：使用 item.frontend_thing_type
  const thingType = item.frontend_thing_type;

  console.log(`Navigating to chat with recipientId: ${recipientId}, thingId: ${thingId}, thingType: ${thingType}`);
  router.push({
    path: `/index/chat/${recipientId}`, // 直接使用路径
    query: {
      thingId: thingId,
      thingType: thingType,
    },
  });
  onClose(); // 跳转后关闭抽屉
};

// --- 跳转到详情页并标记已读 (示例) ---
const goToDetailAndMarkRead = async (item: any) => {
  if (!item.thing_id) {
    if (!item.is_read) await markSingleNoticeAsRead(item);
    console.warn(`Notification type ${item.notice_type} with ID ${item.id} has no thing_id for navigation.`);
    return;
  }

  await markSingleNoticeAsRead(item);

  // Ensure frontend_thing_type is present
  if (!item.frontend_thing_type) {
    console.warn(`Missing frontend_thing_type for thing_id ${item.thing_id} in notification ${item.id}. Navigation might be incomplete.`);
  }

  console.log(`Navigating to detail page for thingId: ${item.thing_id}, type: ${item.frontend_thing_type}`);
  router.push({
      name: 'detail', 
      query: { id: item.thing_id, type: item.frontend_thing_type } // Pass type
  });
  onClose(); // 跳转后关闭抽屉
}


// --- 抽屉内显示辅助函数 ---
const getNoticeIconOrAvatar = (item: any) => {
  switch (item.notice_type) {
    case 'chat_message':
      return item.sender?.avatar || AvatarIcon; // Local default avatar
    case 'like':
    case 'comment':
      return item.sender?.avatar || AvatarIcon; // Show sender's avatar
    case 'reply':
      return replyIcon; // Or sender's avatar: item.sender?.avatar || AvatarIcon;
    default:
      return defaultNoticeIcon; // Fallback to a generic notice icon
  }
};

const getNoticeTitle = (item: any) => {
  const senderName = item.sender?.nickname || item.sender?.username || '有人';
  switch (item.notice_type) {
    case 'chat_message':
      return `来自 ${senderName} 的消息`;
    case 'like':
      return `${senderName} 点赞了您的${item.thing_id ? '物品' : '动态'}`;
    case 'comment':
      return `${senderName} 评论了您的物品`;
    case 'reply':
      return `${senderName} 回复了您的评论`;
    default:
      return item.title || '系统通知';
  }
};

// 恢复 formatTime 的完整实现
const formatTime = (timeStr: string | null | undefined) => {
   if (!timeStr) return '';
   try {
     // 可以使用更友好的时间格式化库，如 dayjs
     const date = new Date(timeStr);
     const now = new Date();
     const diff = now.getTime() - date.getTime();
     const diffMinutes = Math.floor(diff / (1000 * 60));
     const diffHours = Math.floor(diff / (1000 * 60 * 60));
     const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

     if (diffMinutes < 1) return '刚刚';
     if (diffMinutes < 60) return `${diffMinutes}分钟前`;
     if (diffHours < 24) return `${diffHours}小时前`;
     if (diffDays === 1) return '昨天';
     // 更早的显示日期
     return date.toLocaleDateString();
   } catch (e) {
     return timeStr; // 出错时返回原始字符串
   }
};


// --- 其他现有方法 (保持不变) ---
const getUserRanking = () => {
  data.loading = true;
  // 注意：getUserRankingApi 在 user.ts 中定义时没有 data 参数，这里移除
  getUserRankingApi({}) // 确保 API 调用与定义一致
    .then(res => {
      if (res.code === 0 && Array.isArray(res.data)) { // 确保 res.data 是数组
        data.rankingList = res.data.map(item => ({
          ...item,
          avatar: item.avatar ? (item.avatar.startsWith('http') ? item.avatar : `${BASE_URL}${item.avatar}`) : AvatarIcon, // 处理头像 URL
          nickname: item.nickname?.trim() || null,
          username: item.username || `用户_${item.id.slice(0,6)}`
        }));
      } else {
        data.rankingList = []; // 获取失败或数据格式不正确时清空
        message.error(res.msg || '获取排名数据失败');
      }
      
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
const handleJoin = () => {
  let userId = userStore.user_id;
  if (userId) {
    // 使用 name 跳转到失物信息编辑视图
    router.push({ name: 'jiajiaoEditView' });
  } else {
    message.warn('请先登录！');
  }
};
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
  gap: 15px; // 稍微调整按钮间距
  justify-content: flex-end;
  /* 内容右对齐 */
  align-items: center; // 垂直居中对齐所有右侧元素

  .rank-avatar { // 新增头像样式
    width: 32px; // 减小宽度
    height: 32px; // 减小高度
    border-radius: 50%;
    object-fit: cover;
    vertical-align: middle;
  }

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
    margin: 4px 0 0 4px; // 调整外边距以适应布局
    cursor: pointer;
    display: inline-block;
    font-size: 0; // 移除以允许文本显示

    img { // 图标本身的样式
        vertical-align: middle; // 垂直居中对齐
    }

    .msg-point {
      position: absolute;
      // 修改：调整位置以适应数字显示
      right: -10px; // 向右移动一点
      top: -6px;   // 向上移动一点
      font-size: 10px; // 稍小的字体
      color: #fff;
      background: #ff4d4f; // 使用更醒目的红色
      border-radius: 8px; // 圆角
      padding: 1px 4px; // 内边距，让数字不贴边
      height: 16px; // 固定高度
      line-height: 14px; // 调整行高使数字垂直居中
      font-weight: 600;
      min-width: 16px; // 最小宽度，确保单个数字也能显示为圆形
      text-align: center;
      box-sizing: border-box; // 包含 padding 和 border
      z-index: 1; // 确保在图标之上
    }
  }

  .self-img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    vertical-align: middle;
    cursor: pointer;
    object-fit: cover; // 确保头像不变形
    transition: transform 0.3s ease, box-shadow 0.3s ease; // 添加过渡

    &:hover {
      transform: scale(1.1); // 悬停时放大
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); // 悬停时阴影
    }
  }

  // --- 为指定的 a-button 添加样式 ---
  .el-popover__reference-wrapper .el-button, // Target button inside el-popover
  > .ant-btn-link { // Target direct child a-button type="link"
    font-size: 16px; // 增大字体
    padding: 4px 12px; // 调整内边距以适应边框
    transition: all 0.3s ease; // 添加过渡效果
    color: #61480d; // 默认颜色，可以根据主题调整
    font-weight: 500; // 字体稍粗
    border: 2px solid transparent; // 预留边框空间，初始透明
    border-radius: 6px; // 圆角
    background-clip: padding-box; // 重要：确保背景不超出内边距
    position: relative; // 用于伪元素定位
    background-color: #8ce3e3f5;
    &::before { // 用于创建渐变边框的伪元素
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px; // 覆盖边框区域
      z-index: -1; // 置于按钮内容之下
      border-radius: inherit; // 继承父元素的圆角
      background: linear-gradient(to right, #6dd5ed, #2193b0); // 示例渐变色，请替换为你喜欢的颜色
      opacity: 0; // 默认隐藏渐变边框
      transition: opacity 0.3s ease;
    }

    &:hover {
      color: #1890ff; // 悬停时颜色变为 Ant Design 主色调
      transform: translateY(-2px); // 轻微上移效果
      text-shadow: 0 2px 4px rgba(0,0,0,0.1); // 轻微文字阴影
      
      &::before {
        opacity: 1; // 悬停时显示渐变边框
      }
    }

    &:active {
      transform: translateY(-1px); // 点击时效果
    }
  }
  // --- a-button 样式结束 ---

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

/* --- 抽屉内列表样式 --- */
.list-content {
  padding: 0 8px; /* 给列表内容一些内边距 */
}

.notification-view {
  .list {
    /* 列表容器 */
  }
}

.notification-item {
  display: flex; /* 使用 flex 布局 */
  align-items: flex-start; /* 顶部对齐 */
  padding: 12px 0; /* 上下边距 */
  position: relative;
  cursor: pointer; /* 默认可点击 */
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }

  &.unread {
    /* 未读项样式，可以通过加粗标题等方式 */
  }

  .unread-dot {
    position: absolute;
    top: 16px;
    left: -4px; /* 调整到头像左侧 */
    width: 8px;
    height: 8px;
    background-color: #ff4d4f;
    border-radius: 50%;
  }

  .avatar {
    width: 36px; /* 统一大小 */
    height: 36px;
    margin-right: 12px;
    flex-shrink: 0; /* 防止头像被压缩 */
    object-fit: cover; /* Changed to cover for avatars */
    border-radius: 50%; /* Make all avatars round by default */

    /* &.chat-avatar can be removed or kept if specific styling for chat is still needed */
    /* &.chat-avatar {
      // specific chat avatar styles if any, otherwise covered by .avatar
    } */
  }

  .content-box {
    flex: 1; /* 占据剩余空间 */
    border-bottom: 1px dashed #e9e9e9;
    padding-bottom: 12px;
    min-width: 0; /* 防止 flex item 内容溢出 */
  }

  /* 移除最后一项的下划线 */
  &:last-child .content-box {
    border-bottom: none;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px; /* 减小间距 */
  }

  .title-txt {
    color: #333; /* 深色标题 */
    font-weight: 500;
    font-size: 14px;
    white-space: nowrap; /* 防止标题换行 */
    overflow: hidden; /* 溢出隐藏 */
    text-overflow: ellipsis; /* 显示省略号 */
    margin-right: 8px; /* 与时间保持距离 */

    &.unread-title {
      font-weight: 600; /* 未读标题加粗 */
      color: #111;
    }
  }

  .time {
    color: #a1adc5;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0; /* 防止时间被压缩 */
  }

  .head-text {
    /* 这个可以移除或用于显示其他信息 */
     display: none; /* 暂时隐藏 */
  }

  .content {
    color: #666; /* 内容颜色稍浅 */
    font-size: 13px; /* 内容字体稍小 */
    line-height: 1.5;
    margin-top: 4px;
    /* 多行文本溢出显示省略号 (可选) */
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 显示两行 */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;


    p {
      margin-bottom: 0;
    }

    .view-chat-prompt {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #999;
    }
  }
}

/* 抽屉内 Empty 状态样式 */
:deep(.ant-drawer-body) .ant-empty-description {
  color: #999;
}

/* 确保 Spin 覆盖整个抽屉内容区域 */
:deep(.ant-drawer-body) {
  padding: 0; /* 移除默认内边距，让 Spin 全覆盖 */
}
:deep(.ant-spin-container) {
  padding: 16px; /* 给 Spin 容器添加内边距 */
}

/* 移除旧的 .content-list, .notification-item (header 内部) 样式 */
// .content-list { ... }
// .notification-item { ... } // header 内的旧样式移除

/* 保留 el-table 相关样式 */
.el-table__row {
  transition: all 0.3s ease;
}
.highlight-user {
  background: rgba(255,0,0,0.1) !important;
  transform: scale(1.02);
}
</style>
