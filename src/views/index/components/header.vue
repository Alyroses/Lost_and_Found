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
                <a @click="quit()">退出</a>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
      <template v-else>
        <button class="login btn hidden-sm" @click="goLogin()">登录</button>
      </template>

      <div class="right-icon" @click="msgVisible = true ; markAsRead()">
        <img :src="MessageIcon" />
        <span class="msg-point" v-if="unreadCount > 0">{{ unreadCount }}</span>
      </div>
      <div>
        <a-drawer title="消息" placement="right" :closable="true" :maskClosable="true" :visible="msgVisible"
          @close="onClose">
          <a-spin :spinning="loading" style="min-height: 200px">
            <div class="list-content">
              <div class="notification-view">
                <div class="list">
                  <div class="notification-item flex-view" v-for="item in msgData">
                    <!---->
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
      <a-input-search
        :placeholder="data.searchMode === 'username' ? '输入用户名搜索' : '输入昵称搜索'"
        enter-button="查询 🔍" 
        allowClear
        @search="onSearch"
        @input="handleSearchInput"
        v-model:value="keyword"
        class="custom-search-input"
        style="width: 300px"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import LogoIcon from '/public/lost_found_logo.png';
import { listApi as UserListApi } from '/@/api/admin/user';
import { listApi, noticebyidApi,noticeUnreadCountApi, markNoticeReadApi } from '/@/api/index/notice';
import { getUserRankingApi } from '/@/api/index/user';
import AvatarIcon from '/@/assets/images/avatar.jpg';
import logoImage from '/@/assets/images/k-logo.png';
import MessageIcon from '/@/assets/images/message-icon.svg';
import SearchIcon from '/@/assets/images/search-icon.svg';
import { useUserStore } from '/@/store';


const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const currentUserId = userStore.user_id;

import { watch } from 'vue';
import { useRoute } from 'vue-router';

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
  searchMode: 'username', // Default value for searchMode
});

const keywordRef = ref();
// 新增数据
let unreadCount = ref(0);
let loading = ref(false);
let msgVisible = ref(false);
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
  userStore.logout().then((res) => {
    router.push({ name: 'portal' });
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

/* 自定义 Input Search 样式 */
.custom-search-input {
  // ...existing styles for .ant-input...
  :deep(.ant-input-search-button) {
    border-radius: 0 16px 16px 0 !important; // 按钮右侧圆角
    background-color: #1890ff; // 按钮背景色
    border-color: #1890ff; // 按钮边框色
    color: #fff; // 按钮文字颜色
    height: 32px; // 保持与 radio 一致的高度
    transition: all 0.3s;
    // 可能需要调整 padding 以适应图标
    padding: 0 12px; // 调整按钮内边距

    &:hover {
      background-color: #40a9ff;
      border-color: #40a9ff;
    }
  }
  // ...existing styles for .ant-input-group-addon, .ant-input-affix-wrapper...
}
</style>
