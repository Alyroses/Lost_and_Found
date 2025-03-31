<template>
  <div class="content-list">
    <div class="list-title">我的积分详情</div>
    <a-tabs default-active-key="1" @change="onTabChange">
      <a-tab-pane key="1" tab="积分总览" />
      <a-tab-pane key="2" tab="获取积分" />
      <a-tab-pane key="3" tab="积分支出" />
    </a-tabs>
    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="list-content">
        <div class="point-item-view" v-for="(item, index) in pointData" :key="index">
          <div class="header flex-view">
            <div class="left">
              <span class="text">积分类型</span>
              <span class="type">{{ item.type }}</span>
              <span class="time">{{ item.time }}</span>
            </div>
            <div class="right">
              <span class="text">积分变动</span>
              <span class="change" :class="{ positive: item.change > 0, negative: item.change < 0 }">
                {{ item.change > 0 ? '+' : '' }}{{ item.change }}
              </span>
            </div>
          </div>
          <div class="content flex-view">
            <div class="description">
              <span class="text">描述：</span>
              <span class="detail">{{ item.description }}</span>
            </div>
          </div>
        </div>
        <template v-if="!pointData || pointData.length <= 0">
          <a-empty style="width: 100%; margin-top: 200px" />
        </template>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue';
import { getUserPointsApi } from '/@/api/index/thing';
import { useUserStore } from '/@/store';

const userStore = useUserStore();
const loading = ref(false);
const pointData = ref([]);
const pointType = ref('');

onMounted(() => {
  getPointList();
});

const onTabChange = (key) => {
  console.log(key);
  if (key === '1') {
    pointType.value = ''; // 全部积分
  }
  if (key === '2') {
    pointType.value = 'income'; // 获取积分
  }
  if (key === '3') {
    pointType.value = 'expense'; // 积分支出
  }
  getPointList();
};

const getPointList = () => {
  loading.value = true;
  const params = {
    user_id: userStore.user_id, // 当前用户 ID
    username: userStore.user_name, // 当前用户名
  };
  getUserPointsApi(params)
    .then((res) => {
      if (res.code === 0) {
        pointData.value = res.data.map((item) => ({
          type: getActionType(item.action),
          change: item.points,
          time: item.created_time,
          description: item.content,
        }));
      } else {
        message.error('获取积分明细失败');
      }
    })
    .catch((err) => {
      console.error('API 请求错误：', err);
      message.error('服务器错误');
    })
    .finally(() => {
      loading.value = false;
    });
};

// 将 action 转换为中文
const getActionType = (action) => {
  const actionMap = {
    login: '每日登录',
    publish_found: '发布失物招领',
    publish_lost: '发布寻物启事',
    expire: '积分过期',
    deduct: '积分扣除',
  };
  return actionMap[action] || '未知类型';
};
</script>

<style scoped lang="less">
.flex-view {
  display: flex;
}

.content-list {
  flex: 1;

  .list-title {
    color: #152844;
    font-weight: 600;
    font-size: 18px;
    line-height: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
}

.point-item-view {
  background: #f7f9fb;
  border-radius: 4px;
  padding: 16px;
  margin-top: 12px;

  .header {
    border-bottom: 1px solid #cedce4;
    padding-bottom: 12px;
    justify-content: space-between;
    font-size: 14px;

    .text {
      color: #6f6f6f;
    }

    .type {
      font-weight: 500;
      color: #152844;
      margin-left: 8px;
    }

    .time {
      margin-left: 16px;
      color: #a1adc5;
    }

    .change {
      font-weight: 600;
      font-size: 16px;
      margin-left: 8px;

      &.positive {
        color: #52c41a;
      }

      &.negative {
        color: #ff4d4f;
      }
    }
  }

  .content {
    padding: 12px 0;

    .description {
      font-size: 14px;
      color: #6f6f6f;

      .text {
        font-weight: 600;
        color: #152844;
      }

      .detail {
        margin-left: 8px;
        color: #484848;
      }
    }
  }
}

.point-item-view:first-child {
  margin-top: 16px;
}
</style>
