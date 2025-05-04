<template>
  <div class="detail">
    <Header />

    <!-- 修改：优化 detail-content 结构和样式 -->
    <div class="detail-content">
      <!-- 顶部信息区域 -->
      <div class="detail-content-top">
        <!-- 左侧图片 -->
        <div class="thing-img-container"> <!-- 修改 class -->
          <img :src="detailData.cover" :alt="detailData.title" />
        </div>
        <!-- 中间核心信息 -->
        <div class="thing-info-main"> <!-- 修改 class -->
          <div class="thing-state">
            <span class="state">状态:</span>
            <span class="status-text">有效</span> <!-- 可以根据实际状态动态改变 -->
          </div>
          <h1 class="thing-name">{{ detailData.title }}</h1>
          <div class="thing-meta">
            <span><tag-outlined /> {{ detailData.classification_title }}</span>
            <span><environment-outlined /> {{ detailData.location }}</span>
          </div>
          <div v-if="thingType === 'lost'" class="thing-points"> <!-- 修改：使用 v-if 和新 class -->
            <gift-outlined /> 积分奖励：<span class="points-value">{{ detailData.points }}</span> 积分
          </div>
          <a-button type="primary" shape="round" size="large" @click="handleAdd()" class="claim-button">
            <template #icon><form-outlined /></template>
            认领此物
          </a-button>
        </div>
        <!-- 右侧操作/统计 -->
        <div class="thing-actions-stats"> <!-- 修改 class -->
          <div class="action-item" @click="addToWish()">
            <heart-outlined />
            <span>加入寻找 ({{ detailData.wish_count }})</span>
          </div>
          <div class="action-item" @click="collect()">
            <star-outlined />
            <span>收藏 ({{ detailData.collect_count }})</span>
          </div>
          <div class="action-item" @click="share()">
            <share-alt-outlined />
            <span>分享</span>
          </div>
        </div>
      </div>

      <!-- 底部详情/评论/推荐区域 -->
      <div class="detail-content-bottom">
        <div class="main-content-wrapper"> <!-- 新增 wrapper -->
          <!-- 左侧主内容：描述和评论 -->
          <div class="main-content">
            <div class="content-tabs"> <!-- 修改 class -->
              <span
                class="tab"
                :class="{ 'tab-select': selectTabIndex === index }"
                v-for="(item, index) in tabData"
                :key="index"
                @click="selectTab(index)"
              >
                {{ item }}
              </span>
              <span class="tab-underline" :style="{ left: tabUnderLeft + 'px' }"></span>
            </div>

            <!-- 详细描述 -->
            <div class="thing-description" v-show="selectTabIndex === 0"> <!-- 修改 class 和 v-show -->
              <p class="text">{{ detailData.description || '暂无详细描述...' }}</p>
            </div>

            <!-- 评论区 -->
            <div class="thing-comment" v-show="selectTabIndex === 1"> <!-- 修改 v-show -->
              <!-- ... 评论区现有代码保持不变 ... -->
              <div class="title">发表新的评论</div>
              <div class="publish flex-view">
                <img :src="AvatarIcon" class="mine-img" />
                <input placeholder="说点什么..." class="content-input" ref="commentRef" />
                <button class="send-btn" @click="sendComment()">发送</button>
              </div>
              <div class="tab-view flex-view">
                <div class="count-text">共有{{ commentData.length }}条评论</div>
                <div class="tab-box flex-view" v-if="commentData.length > 0">
                  <span :class="sortIndex === 0 ? 'tab-select' : ''" @click="sortCommentList('recent')">最新</span>
                  <div class="line"></div>
                  <span :class="sortIndex === 1 ? 'tab-select' : ''" @click="sortCommentList('hot')">热门</span>
                </div>
              </div>
              <div class="comments-list">
                <div class="comment-item" v-for="item in commentData" :key="item.id">
                  <div class="flex-item flex-view">
                    <img :src="AvatarIcon" class="avator" />
                    <div class="person">
                      <div class="name">{{ item.nickname }}</div> <!-- 修改为显示 nickname -->
                      <div class="time">{{ item.comment_time }}</div>
                      <span @click="showReplyInput(item)">回复</span>
                    </div>
                    <!-- 回复输入框 -->
                    <div v-if="item.showReply" class="reply-input">
                      <input v-model="item.replyText" placeholder="回复 @{{ item.nickname }}"/>
                      <button @click="submitReply(item)">发送</button>
                    </div>
                    <!-- 嵌套显示子评论 -->
                    <div class="replies" v-for="reply in item.replies" :key="reply.id">
                      <p>@{{ reply.parent.nickname }} {{ reply.content }}</p>
                    </div>
                    <div class="float-right">
                      <span @click="like(item.id)">推荐</span>
                      <span class="num">{{ item.like_count }}</span>
                      <img src="/src/assets/icons/svg/delete.svg" @click="deleteComment(item.id)" class="delete-icon" /> <!-- 添加删除图标 -->
                    </div>
                  </div>
                  <p class="comment-content">{{ item.content }}</p>
                </div>
                <div class="infinite-loading-container">
                  <div class="infinite-status-prompt" style="">
                    <div slot="no-results" class="no-results">
                      <div></div>
                      <p>没有更多了</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧推荐 -->
          <div class="recommend-section"> <!-- 修改 class -->
            <div class="title">相关推荐</div>
            <div class="recommend-list"> <!-- 修改 class -->
              <div class="recommend-item" v-for="item in recommendData" :key="item.id" @click="handleDetail(item)">
                <div class="img-view"> <img :src="item.cover" :alt="item.title"/></div>
                <div class="info-view">
                  <h3 class="thing-name">{{ item.title.substring(0, 12) }}</h3>
                  <span class="location"><environment-outlined /> {{ item.location }}</span>
                  <span class="points" v-if="item.points"><gift-outlined /> {{ item.points }} 积分</span>
                </div>
              </div>
              <div v-if="!recommendData || recommendData.length === 0" class="no-recommend">
                暂无相关推荐
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--弹窗区域-->
    <div>
      <a-modal :visible="modal.visile" :forceRender="true" :title="modal.title" ok-text="确认" cancel-text="取消"
        @cancel="handleCancel" @ok="handleOk(detailData)">
        <div>
          <a-form ref="myform" :label-col="{ style: { width: '80px' } }" :model="modal.form" :rules="modal.rules">
            <a-row :gutter="24">
              <a-col span="24">
                <a-form-item label="标题" name="title">
                  <a-input placeholder="请输入标题" v-model:value="modal.form.title" />
                </a-form-item>
              </a-col>
              <a-col span="24">
                <a-form-item label="通知内容" name="content">
                  <a-textarea placeholder="请输入内容" :rows="4" v-model:value="modal.form.content" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-modal>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { FormInstance, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router/dist/vue-router';
import { createApi, updateApi } from '/@/api/admin/notice';
import { createApi as createCommentApi, likeApi, listThingCommentsApi, deleteCommentsApi } from '/@/api/index/comment';
import { createApi as orderCreat } from '/@/api/index/order';
import { addCollectUserApi, addScoreApi, addWishUserApi, detailApi, listApi as listThingList } from '/@/api/index/thing';
import AvatarIcon from '/@/assets/images/avatar.jpg';
import RecommendIcon from '/@/assets/images/recommend-hover.svg';
import ShareIcon from '/@/assets/images/share-icon.svg';
import WantIcon from '/@/assets/images/want-read-hover.svg';
import WeiboShareIcon from '/@/assets/images/wb-share.svg';
import { useUserStore } from '/@/store';
import { BASE_URL } from '/@/store/constants';
import Footer from '/@/views/index/components/footer.vue';
import Header from '/@/views/index/components/header.vue';
import {
  TagOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  FormOutlined,
  HeartOutlined,
  StarOutlined,
  ShareAltOutlined
} from '@ant-design/icons-vue'; // 导入所需图标

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

let thingId = ref('');
interface DetailData {
  cover: string;
  title: string;
  points: number; // *** 修改：price -> points ***
  classification_title: string;
  location: string;
  description: string;
  wish_count: number;
  collect_count: number;
  user: string;
  id: string;
}

let detailData = ref<DetailData>({
  cover: '',
  title: '',
  points: 0, // *** 修改：price -> points ***
  classification_title: '',
  location: '',
  description: '',
  wish_count: 0,
  collect_count: 0,
  user: '',
  id: '',
});
let tabUnderLeft = ref(6);
let tabData = ref(['详细描述', '评论区']);
let selectTabIndex = ref(0);

interface Comment {
  id: string;
  nickname: string;
  comment_time: string;
  like_count: number;
  content: string;
}

let commentData = ref<Comment[]>([]);
interface RecommendItem {
  cover: string;
  title: string;
  location: string;
  price: number;
}

let recommendData = ref<RecommendItem[]>([]);
let sortIndex = ref(0);
let order = ref('recent'); // 默认排序最新

let commentRef = ref();

const myform = ref<FormInstance>();

// 弹窗数据源
const modal = reactive({
  visile: false,
  editFlag: false,
  title: '',
  form: {
    id: undefined,
    title: undefined,
    content: undefined,
    user: undefined,
    thing:undefined,
  },
  rules: {
    title: [{ required: true, message: '请输入', trigger: 'change' }],
  },
});

const handleAdd = () => {
  resetModal();
  modal.visile = true;
  modal.editFlag = false;
  modal.title = '发送消息';
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
};
const handleOk = (detailData) => {
  myform.value
    ?.validate()
    .then(() => {
      if (modal.editFlag) {
        updateApi(
          {
            id: modal.form.id,
          },
          modal.form,
        )
          .then((res) => {
            hideModal();
            
          })
          .catch((err) => {
            console.log(err);
            message.error(err.msg || '操作失败');
          });
      } else {
        console.log(detailData);
        let Touserid = detailData.user;
        let thingid = detailData.id;
        console.log(Touserid)
        modal.form.user = Touserid;
        modal.form.thing = thingid;
        console.log(modal.form)
        createApi(modal.form)
          .then((res) => {
            hideModal();
            message.success('认领成功！');
           
            handleOrder(detailData);

          })
          .catch((err) => {
            console.log(err);
            message.error(err.msg || '操作失败');
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleCancel = () => {
  hideModal();
};

// 恢复表单初始状态
const resetModal = () => {
  myform.value?.resetFields();
};

// 关闭弹窗
const hideModal = () => {
  modal.visile = false;
};

let thingType = ref(''); // 新增：用于存储物品类型

onMounted(() => {
  thingId.value = route.query.id?.toString() || ''; // 确保是字符串
  thingType.value = route.query.type?.toString() || ''; // *** 获取 type 参数 ***

  if (!thingId.value || !thingType.value) { // 检查 id 和 type 是否都存在
      message.error('无效的物品信息');
      router.push({ name: 'portal' }); // 跳转回首页或错误页
      return;
  }

  getThingDetail();
  getRecommendThing();
  getCommentList();
});

// 获取评论列表
const getCommentList = () => {
  listThingCommentsApi({ thingId: thingId.value, order: order.value })
    .then((res) => {
      commentData.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

// 发送回复逻辑
const submitReply = (parentComment) => {
  createCommentApi({
    content: parentComment.replyText,
    thing_id: thingId.value,
    parent_id: parentComment.id  // 关联父评论
  }).then(() => {
    getCommentList();
    // 触发回复通知
  });
};

const selectTab = (index) => {
  selectTabIndex.value = index;
  tabUnderLeft.value = 6 + 54 * index;
};

const getThingDetail = () => {
  // *** 在调用 API 时传递 id 和 type ***
  detailApi({ id: thingId.value, type: thingType.value })
    .then((res) => {
      detailData.value = res.data; // *** 确保后端返回的数据包含 points 字段 ***
      // detailData.value.cover = detailData.value.cover; // 这行似乎多余，如果 cover 已经是完整 URL
    })
    .catch((err) => {
      message.error('获取详情失败');
    });
};
const addToWish = () => {
  let username = userStore.user_name;
  if (username) {
    addWishUserApi({ thingId: thingId.value, username: username })
      .then((res) => {
        message.success(res.msg);
        getThingDetail();
      })
      .catch((err) => {
        console.log('操作失败');
      });
  } else {
    message.warn('请先登录');
  }
};

const share = () => {
  message.info('分享功能暂未实现');
};
const collect = () => {
  let username = userStore.user_name;
  if (username) {
    addCollectUserApi({ thingId: thingId.value, username: username })
      .then((res) => {
        message.success(res.msg);
        getThingDetail();
      })
      .catch((err) => {
        console.log('收藏失败');
      });
  } else {
    message.warn('请先登录');
  }
};

const handleOrder = (detailData) => {
  console.log(detailData);
  const userId = userStore.user_id;
  let Touserid = detailData.user

  if (Touserid) {
    const formData = new FormData();
    formData.append('user', Touserid);
    formData.append('thing', thingId.value);
    formData.append('count', '1');
    console.log(formData);
    orderCreat(formData)
      .then((res) => {
        addSorce()
        router.push({ name: 'portal' })

      })
      .catch((err) => {
        message.error(err.msg || '失败');
      });
  } else {
    message.warn('请先登录！');
  }
};

const addSorce = () => {
  let userId = userStore.user_id;
  addScoreApi({id: userId}).then((res) =>{
      console.log(res.msg)
  }).catch((err) => {
    console.log(err)
  })

}

const getRecommendThing = () => {
  listThingList({ sort: 'recommend' })
    .then((res) => {
      // *** 修改：确保推荐数据也使用 points ***
      recommendData.value = res.data.slice(0, 6).map(item => ({
          ...item,
          points: item.points || item.price || 0 // 兼容后端可能返回 price 或 points
      }));
    })
    .catch((err) => {
      console.log(err);
    });
};
const handleDetail = (item) => {
  // 跳转新页面
  router.push({ name: 'detail', query: { id: item.id } });
};
const sendComment = () => {
  console.log(commentRef.value);
  let text = commentRef.value.value.trim();
  console.log(text);
  if (text.length <= 0) {
    return;
  }
  commentRef.value.value = '';
  let userId = userStore.user_id;
  if (userId) {
    createCommentApi({ content: text, thing: thingId.value, user: userId })
      .then((res) => {
        getCommentList();
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    message.warn('请先登录！');
    router.push({ name: 'login' });
  }
};

const like = (commentId) => {
  likeApi({ commentId: commentId })
    .then((res) => {
      getCommentList();
    })
    .catch((err) => {
      console.log(err);
    });
};

// const deleteComment = (commentId) => {
//   deleteCommentApi({ commentId: commentId })
//     .then((res) => {
//       message.success('删除成功');
//       getCommentList();
//     })
//     .catch((err) => {
//       console.log(err);
//       message.error('删除失败');
//     });
// };

const sortCommentList = (sortType) => {
  if (sortType === 'recent') {
    sortIndex.value = 0;
  } else {
    sortIndex.value = 1;
  }
  order.value = sortType;
  getCommentList();
};

const showReplyInput = (item) => {
  // 实现显示回复框的逻辑
  item.showReply = !item.showReply;
  if (item.showReply) {
    item.replyText = ''; // 清空之前的输入
  }
};
</script>

<style scoped lang="less">
// @import '/src/assets/css/variables.less'; // 假设有一个变量文件
@primary-color: #873692; // 主题色 (与 jiajiao-edit-view 一致)
// 定义一个备用颜色或直接替换
@fallback-secondary-color: #6a8ee6; // 定义一个备用颜色
@error-color: #ff4d4f;

.detail {
  // background-color: #f8f9fa; // 可以注释掉或移除纯色背景
  background-image: url('/bg_main.jpg'); // 添加背景图片路径
  background-size: cover; // 使图片覆盖整个区域
  background-position: center center; // 居中图片
  background-repeat: no-repeat; // 防止图片重复
  background-attachment: fixed; // 固定背景，产生视差效果
  min-height: 100vh; // 确保容器至少和视口一样高
}

.detail-content {
  width: 1100px;
  max-width: 90%; // 响应式调整
  margin: 46px auto; // 上下边距调整
  padding: 20px;
  // background-color: #eee3e3; // 移除或注释掉旧颜色
  background-color: rgba(255, 255, 255, 0.9); // 修改：使用半透明白色背景
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(5px); // 可选：添加模糊效果，增强玻璃感
  -webkit-backdrop-filter: blur(5px); // 兼容 Safari
}

.detail-content-top {
  display: flex;
  gap: 30px; // 增加元素间距
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

.thing-img-container {
  flex: 0 0 300px; // 固定图片容器宽度
  height: 300px; // 固定高度
  position: relative;
  border-radius: 24px;
  overflow: hidden; // 隐藏伪元素超出部分
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  // 渐变边框
  &::before {
    content: '';
    position: absolute;
    inset: -3px; // 边框宽度
    background: linear-gradient(45deg, @primary-color, @fallback-secondary-color, #ff7e5f); // 使用备用颜色
    z-index: -1;
    border-radius: inherit;
    transition: filter 0.3s ease;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit; // 继承容器圆角
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); // 平滑过渡
  }

  &:hover {
    &::before {
      filter: brightness(1.1) blur(2px); // 边框发光效果
    }
    img {
      transform: scale(1.08); // 悬停放大
    }
  }
}

.thing-info-main {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;

  .thing-state {
    margin-bottom: 10px;
    font-size: 14px;
    color: #666;
    .state {
      font-weight: 500;
      margin-right: 8px;
    }
    .status-text {
      color: #52c41a; // 绿色表示有效
      font-weight: bold;
    }
  }

  .thing-name {
    font-size: 26px; // 增大标题字号
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
    line-height: 1.3;
  }

  .thing-meta {
    display: flex;
    gap: 15px;
    color: #555;
    margin-bottom: 15px;
    font-size: 15px;
    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  }

  .thing-points {
    font-size: 18px;
    color: @error-color; // 红色突出显示
    margin-bottom: 25px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    .points-value {
      font-weight: bold;
      font-size: 20px;
    }
  }

  .claim-button {
    margin-top: auto; // 将按钮推到底部
    align-self: flex-start; // 左对齐
    background: linear-gradient(135deg, @primary-color, @fallback-secondary-color); // 使用备用颜色
    border: none;
    &:hover {
      opacity: 0.9;
      box-shadow: 0 4px 10px fade(@primary-color, 30%);
    }
  }
}

.thing-actions-stats {
  flex: 0 0 180px; // 固定右侧宽度
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-left: 20px;
  border-left: 1px solid #eee;

  .action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #555;
    font-size: 14px;
    transition: color 0.3s, transform 0.2s;

    .anticon {
      font-size: 18px;
    }

    &:hover {
      color: @primary-color;
      transform: translateX(3px);
    }
  }
}

.detail-content-bottom {
  margin-top: 20px; // 与顶部区域分隔
}

.main-content-wrapper {
  display: flex;
  gap: 30px;
}

.main-content {
  flex: 1; // 主内容区域占据更多空间
  min-width: 0; // 防止 flex item 溢出
}

.content-tabs { // 替换 .order-view
  position: relative;
  display: flex;
  gap: 25px;
  border-bottom: 1px solid #eee;
  margin-bottom: 25px;

  .tab {
    padding: 10px 5px;
    font-size: 17px; // 调整字号
    color: #666;
    cursor: pointer;
    position: relative;
    transition: color 0.3s;

    &:hover {
      color: @primary-color;
    }
  }

  .tab-select {
    color: @primary-color;
    font-weight: 600;
  }

  .tab-underline {
    position: absolute;
    bottom: -1px; // 贴在边框上
    height: 3px;
    width: 30px; // 下划线宽度
    background-color: @primary-color;
    border-radius: 1.5px;
    transition: left 0.3s cubic-bezier(0.65, 0, 0.35, 1);
  }
}

.thing-description { // 替换 .thing-intro
  .text {
    font-size: 15px;
    line-height: 1.8;
    color: #444;
    white-space: pre-wrap; // 保留换行和空格
    padding: 10px;
    background-color: #fdfdff; // 非常浅的背景色
    border-radius: 6px;
    border: 1px solid #f0f0f0;
  }
}

.thing-comment {
  // 评论区样式微调
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
  }
  .publish {
    margin-bottom: 25px;
    .content-input {
      border-radius: 6px;
      height: 40px;
    }
    .send-btn {
      border-radius: 6px;
      height: 40px;
    }
  }
  .tab-view {
    margin-bottom: 20px;
  }
  .comments-list {
    .comment-item {
      border-bottom: 1px dashed #eee; // 分隔线改细
      padding-bottom: 15px;
      margin-bottom: 15px;
      &:last-child {
        border-bottom: none;
      }
    }
    .comment-content {
      border-bottom: none; // 移除内部多余的边框
      padding-bottom: 0;
      margin-top: 5px;
      font-size: 14px;
      color: #555;
    }
    .reply-input { // 回复输入框样式
      margin-top: 8px;
      margin-left: 52px;
      display: flex;
      gap: 8px;
      input {
        flex: 1;
        height: 32px;
        padding: 0 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
      }
      button {
        height: 32px;
        padding: 0 12px;
        background-color: @primary-color;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        &:hover {
          opacity: 0.9;
        }
      }
    }
    .replies { // 子评论样式
      margin-top: 8px;
      margin-left: 62px; // 增加缩进
      padding-left: 10px;
      border-left: 2px solid #eee;
      p {
        font-size: 13px;
        color: #666;
        margin-bottom: 4px;
      }
    }
  }
}

.recommend-section { // 替换 .recommend
  flex: 0 0 250px; // 固定推荐区域宽度
  padding-left: 25px;
  border-left: 1px solid #eee;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
  }

  .recommend-list { // 替换 .things
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .recommend-item {
    display: flex;
    gap: 12px;
    cursor: pointer;
    padding-bottom: 15px;
    border-bottom: 1px dashed #eee;
    transition: background-color 0.2s;
    border-radius: 4px;
    padding: 8px;

    &:last-child {
      border-bottom: none;
      padding-bottom: 8px;
    }
    &:hover {
       background-color: #f8f8f8;
    }

    .img-view {
      flex: 0 0 80px;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .info-view {
      flex: 1;
      min-width: 0;
      .thing-name {
        font-size: 14px;
        font-weight: 500;
        color: #444;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .location, .points {
        font-size: 12px;
        color: #777;
        display: block; // 换行显示
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        .anticon {
          margin-right: 4px;
        }
      }
      .points {
        color: @error-color;
      }
    }
  }
  .no-recommend {
    color: #999;
    font-size: 14px;
    text-align: center;
    padding: 20px 0;
  }
}

// 响应式调整
@media (max-width: 992px) {
  .detail-content-top {
    flex-direction: column;
    align-items: center; // 居中对齐
    gap: 20px;
  }
  .thing-img-container {
    flex-basis: auto; // 移除固定宽度
    width: 80%; // 调整宽度
    max-width: 400px;
    height: auto; // 高度自适应
    aspect-ratio: 1 / 1; // 保持方形
  }
  .thing-info-main {
    align-items: center; // 居中对齐
    text-align: center;
    .claim-button {
      align-self: center; // 按钮居中
    }
  }
  .thing-actions-stats {
    flex-direction: row; // 水平排列
    flex-basis: auto;
    width: 100%;
    justify-content: space-around; // 均匀分布
    border-left: none;
    padding-left: 0;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
  .main-content-wrapper {
    flex-direction: column;
  }
  .recommend-section {
    flex-basis: auto;
    border-left: none;
    padding-left: 0;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
}


</style>
