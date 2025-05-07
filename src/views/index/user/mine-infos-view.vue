<template>
  <div class="mine-infos-view">
    <div class="info-box flex-view">
      <!-- 修改：使用本地 avatarUrl ref -->
      <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
      <img v-else :src="AvatarImg" class="avatar-img" />
      <div class="name-box">
        <h2 class="nick">{{ userStore.user_name }}</h2>
        <div class="age">
          <span>活跃1天</span>
          <span class="give-point"></span>
        </div>
      </div>
    </div>
    <div class="counts-view">
      <div class="counts flex-view">
        <div class="fans-box flex-item" @click="clickMenu('collectThingView')">
          <div class="text">收藏</div>
          <div class="num">{{ collectCount }}</div> <!-- 动态显示收藏数 -->
        </div>
        <div class="split-line"> </div>
        <div class="follow-box flex-item" @click="clickMenu('wishThingView')">
          <div class="text">心愿单</div>
          <div class="num">{{ wishCount }}</div>
        </div>
      </div>
    </div>
    <div class="setting-box">
      <div class="title">个人设置</div>
      <div class="list">
        <div class="mine-item flex-view" @click="clickMenu('userInfoEditView')">
          <img :src="SettingIconImage" alt="编辑资料" />
          <span>编辑资料</span>
        </div>
        <div class="mine-item flex-view" @click="clickMenu('thingEditView')">
          <img :src="SettingIconImage" alt="我的发布" />
          <span>我的发布</span>
        </div>
        <div class="mine-item flex-view" @click="clickMenu('orderView')">
          <img :src="SettingIconImage" alt="我的积分详情" />
          <span>积分详情</span>
        </div>
        <div class="mine-item flex-view" @click="clickMenu('skimView')">
          <img :src="SettingIconImage" alt="我的浏览" />
          <span>我的浏览</span>
        </div>
        
        <div class="mine-item flex-view" @click="clickMenu('securityView')">
          <img :src="SafeIconImage" alt="账号安全" />
          <span>账号安全</span>
        </div>
        <div class="mine-item flex-view" @click="clickMenu('pushView')">
          <img :src="PushIconImage" alt="推送设置" />
          <span>推送设置</span>
        </div>
        <div class="mine-item flex-view" @click="clickMenu('messageView')">
          <img :src="MessageIconImage" alt="消息管理" />
          <span>消息管理</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarImg from '/@/assets/images/avatar.jpg'; // 默认头像
import SettingIconImage from '/@/assets/images/setting-icon.svg';
import MessageIconImage from '/@/assets/images/setting-msg-icon.svg';
import PushIconImage from '/@/assets/images/setting-push-icon.svg';
import SafeIconImage from '/@/assets/images/setting-safe-icon.svg';

import { getCollectThingListApi, getWishThingListApi } from '/@/api/index/thing';
import { useUserStore } from '/@/store'; // 确保导入用户详情接口
import { detailApi } from '/@/api/index/user';
import { ref, onMounted } from 'vue'; // 确保引入 ref 和 onMounted

const userStore = useUserStore();
const router = useRouter();

let collectCount = ref(0);
let wishCount = ref(0);
// 新增：用于存储从后端获取的头像 URL 的 ref
const avatarUrl = ref<string | undefined>(undefined);

const getUserInfo = () => {
  const userId = userStore.user_id;
  if (!userId) {
    // 如果没有用户ID，尝试从 localStorage 获取头像（如果之前存过）
    avatarUrl.value = localStorage.getItem('user_avatar') || undefined;
    if (!avatarUrl.value) {
      avatarUrl.value = AvatarImg; // 最终回退到默认头像
    }
    return;
  }
  detailApi({ id: userId })
    .then((res) => {
      collectCount.value = res.data.collect_count || 0;
      // 将从后端获取的头像 URL 存储到本地 ref
      avatarUrl.value = res.data.avatar;
      console.log("Fetched avatar URL:", avatarUrl.value);

      // (可选但推荐) 同时更新 userStore，保持数据同步
      // 这需要确保 userStore.setUserInfo 方法存在且工作正常
      try {
        userStore.setUserInfo(res.data);
        console.log("User store updated with fetched info.");
      } catch (storeError) {
        console.error("Failed to update user store:", storeError);
      }

    })
    .catch((err) => {
      console.error('获取用户信息失败', err);
      // 获取失败时也尝试从 localStorage 或使用默认头像
      avatarUrl.value = localStorage.getItem('user_avatar') || AvatarImg;
    });
};

onMounted(() => {
  // 移除之前的日志
  // console.log('mine-infos-view mounted. Avatar URL from store:', userStore.user_avatar);
  // console.log('Avatar URL from localStorage:', localStorage.getItem('user_avatar'));

  getUserInfo(); // 调用修改后的函数
  getWishThingList();
});

const clickMenu = (name: any) => {
  router.push({ name: name });
};
// const clickMenu = () => {
//   router.push({ name: 'jiajiaoEditView' });
// };
const getCollectThingList = () => {
  let username = userStore.user_name;
  getCollectThingListApi({ username: username })
    .then((res) => {
      collectCount.value = res.data.length;
    })
    .catch((err) => {
      console.log(err.msg);
    });
};

const getWishThingList = () => {
  let username = userStore.user_name;
  getWishThingListApi({ username: username })
    .then((res) => {
      wishCount.value = res.data.length;
    })
    .catch((err) => {
      console.log(err.msg);
    });
};
</script>

<style scoped lang="less">
.flex-view {
  display: flex;
}

.mine-infos-view {
  width: 200px; // 减小宽度，为 thing-edit-view 提供更多空间
  margin-right: 20px;
  border: 1px solid #cedce4;
  height: fit-content;
  // background: #fcbb9be8;

  .info-box {
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    padding: 16px 16px 0;
    overflow: hidden;
  }

  .avatar-img {
    width: 48px;
    height: 48px;
    margin-right: 16px;
    border-radius: 50%;
    object-fit: cover; // 确保图片不变形
  }

  .name-box {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    overflow: hidden;

    .nick {
      color: #152844;
      font-weight: 600;
      font-size: 18px;
      line-height: 24px;
      height: 24px;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 0;
      overflow: hidden;
    }

    .age {
      font-size: 12px;
      color: #6f6f6f;
      height: 16px;
      line-height: 16px;
      margin-top: 8px;
    }

    .give-point {
      color: #4684e2;
      cursor: pointer;
      float: right;
    }
  }

  .counts-view {
    border: none;
    padding: 16px;
  }

  .counts {
    margin-top: 12px;
    text-align: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;

    .flex-item {
      -webkit-box-flex: 1;
      -ms-flex: 1;
      flex: 1;
      cursor: pointer;
    }

    .text {
      height: 16px;
      line-height: 16px;
      color: #6f6f6f;
    }

    .num {
      height: 18px;
      line-height: 18px;
      color: #152844;
      font-weight: 600;
      font-size: 14px;
      margin-top: 4px;
    }

    .split-line {
      width: 1px;
      height: 24px;
      background: #dae6f9;
    }
  }

  .intro-box {
    border-top: 1px solid #cedce4;
    padding: 16px;

    .title {
      color: #6f6f6f;
      font-size: 12px;
      line-height: 16px;
    }

    .intro-content {
      color: #152844;
      font-size: 14px;
      line-height: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 8px 0;
    }
  }

  .create-box {
    cursor: pointer;
    border-top: 1px solid #cedce4;
    padding: 16px;

    .title {
      position: relative;
      color: #152844;
      font-weight: 600;
      font-size: 14px;
      line-height: 18px;
      height: 18px;
    }

    .counts {
      margin-top: 12px;
      text-align: center;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;

      .flex-item {
        -webkit-box-flex: 1;
        -ms-flex: 1;
        flex: 1;
        cursor: pointer;
      }

      .split-line {
        width: 1px;
        height: 24px;
        background: #dae6f9;
      }
    }
  }

  .order-box {
    border-top: 1px solid #cedce4;
    padding: 16px;

    .title {
      color: #152844;
      font-weight: 600;
      font-size: 14px;
      line-height: 18px;
      height: 18px;
      margin-bottom: 8px;
    }

    .list {
      padding-left: 16px;

      .mine-item {
        border-top: 1px dashed #cedce4;
        cursor: pointer;
        height: 48px;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;

        img {
          width: 24px;
          margin-right: 8px;
          height: 24px;
        }

        span {
          color: #152844;
          font-size: 14px;
        }
      }

      .mine-item:first-child {
        border: none;
      }
    }
  }

  .setting-box {
    border-top: 1px solid #cedce4;
    padding: 16px;

    .title {
      color: #152844;
      font-weight: 700; // 加粗
      font-size: 16px; // 增大字体
      line-height: 18px;
      height: 18px;
      margin-bottom: 12px; // 调整间距
    }

    .list {
      padding-left: 16px;
    }

    .mine-item {
      border-top: 1px dashed #cedce4;
      cursor: pointer;
      height: 48px;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;

      img {
        width: 24px;
        margin-right: 8px;
        height: 24px;
      }

      span {
        color: #152844;
        font-size: 15px; // 增大字体
        font-weight: 500; // 轻微加粗
      }
    }

    .mine-item:first-child {
      border: none;
    }
  }
}
</style>
