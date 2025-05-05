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
          <a-button type="primary" shape="round" size="large" @click="navigateToChat" class="claim-button">
            <template #icon><MessageOutlined /></template>
            {{ thingType === 'found' ? '联系拾物者' : '联系失主' }}
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
              <!-- <span class="tab-underline" :style="{ left: tabUnderLeft + 'px' }"></span> -->
            </div>

            <!-- 详细描述 -->
            <div class="thing-description" v-show="selectTabIndex === 0"> <!-- 修改 class 和 v-show -->
              <!-- 新增：发布者信息 -->
              <div class="description-publisher">
                <a-avatar :src="detailData.user?.avatar || AvatarIcon" :size="40" />
                <div class="publisher-name-time">
                  <span class="name">{{detailData.user?.username || '匿名用户' }}</span>
                  <!-- 可以考虑添加发布时间 -->
                  <!-- <span class="time">{{ detailData.publish_time }}</span> -->
                </div>
              </div>
              <!-- 描述文本 -->
              <p class="text">{{ detailData.description || '暂无详细描述...' }}</p>
            </div>

            <!-- 评论区 -->
            <div class="thing-comment" v-show="selectTabIndex === 1"> <!-- 修改 v-show -->
              <div class="title">发表新的评论</div>
              <!-- 评论发布区域 -->
              <div class="publish flex-view">
                <!-- 使用登录用户的头像，如果未登录则显示默认 -->
                <a-avatar :src="userStore.user_avatar || AvatarIcon" class="mine-img" />
                <a-textarea
                  placeholder="说点什么..."
                  class="content-input"
                  ref="commentRef"
                  :rows="3"
                  v-model:value="newCommentContent"
                />
                <button class="send-btn" @click="sendComment()">发送</button>
              </div>
              <!-- 评论列表区域 -->
              <div class="tab-view flex-view">
                <div class="count-text">共有 {{ commentTotal }} 条评论</div> <!-- 修改：显示总数 -->
                <div class="tab-box flex-view" v-if="commentData.length > 0">
                  <span :class="sortIndex === 0 ? 'tab-select' : ''" @click="sortCommentList('recent')">最新</span>
                  <div class="line"></div>
                  <span :class="sortIndex === 1 ? 'tab-select' : ''" @click="sortCommentList('hot')">热门</span>
                </div>
              </div>
              <div class="comments-list">
                <!-- 遍历顶级评论 -->
                <div class="comment-item" v-for="item in commentData" :key="item.id">
                  <div class="flex-item flex-view">
                    <a-avatar :src="item.user?.avatar || AvatarIcon" class="avator" />
                    <div class="person">
                      <div class="name">
                        {{ item.user?.username || '匿名用户' }}
                        <!-- 新增：发布者标识 -->
                        <a-tag v-if="item.user?.id === detailData.user?.id" color="volcano" class="publisher-tag">发布者</a-tag>
                      </div>
                      <div class="time">{{ item.comment_time }}</div>
                    </div>
                    <div class="actions">
                      <!-- 修改：回复按钮 -->
                      <span class="action-btn reply-btn" @click="toggleReplyInput(item)">
                        <message-outlined /> {{ item.showReply ? '取消回复' : '回复' }}
                      </span>
                      <!-- 修改：点赞按钮 -->
                      <span class="action-btn like-btn" @click="like(item.id)">
                        <like-outlined /> {{ item.like_count }}
                      </span>
                      <!-- 新增：删除按钮 (仅自己的评论) -->
                      <a-popconfirm
                        v-if="item.user?.id === userStore.user_id"
                        title="确定删除这条评论吗？"
                        ok-text="是"
                        cancel-text="否"
                        @confirm="deleteCommentOrReply(item.id)"
                      >
                        <span class="action-btn delete-btn">
                          <delete-outlined /> 删除
                        </span>
                      </a-popconfirm>
                    </div>
                  </div>
                  <p class="comment-content">{{ item.content }}</p>

                  <!-- 回复输入框 -->
                  <div v-if="item.showReply" class="reply-input-area flex-view">
                     <a-avatar :src="userStore.avatar || AvatarIcon" class="mine-img reply-avatar" />
                     <a-textarea
                       v-model:value="item.replyText"
                       :placeholder="'回复 @' + (item.user?.nickname || '匿名用户')"
                       :rows="2"
                       class="reply-textarea"
                     />
                     <button class="send-btn reply-send-btn" @click="submitReply(item)">发送</button>
                  </div>

                  <!-- 嵌套显示子评论 (回复) -->
                  <div class="replies-list" v-if="item.replies && item.replies.length > 0">
                    <div class="reply-item" v-for="reply in item.replies" :key="reply.id">
                      <div class="flex-item flex-view">
                        <a-avatar :src="reply.user?.avatar || AvatarIcon" class="avator reply-avatar-small" />
                        <div class="person">
                          <div class="name">
                            {{ reply.user?.username || '匿名用户' }}
                            <!-- 新增：发布者标识 -->
                            <a-tag v-if="reply.user?.id === detailData.user?.id" color="volcano" class="publisher-tag">发布者</a-tag>
                            <!-- 显示回复目标 -->
                            <span v-if="reply.parent_comment_user" class="reply-target">
                               回复 @{{ reply.parent_comment_user.nickname || '匿名用户' }}
                            </span>
                          </div>
                          <div class="time">{{ reply.comment_time }}</div>
                        </div>
                         <div class="actions">
                           <!-- 修改：回复按钮 (回复二级评论) -->
                           <span class="action-btn reply-btn" @click="toggleReplyInput(reply, item)"> <!-- 传入父评论 item -->
                             <message-outlined /> {{ reply.showReply ? '取消回复' : '回复' }}
                           </span>
                           <!-- 修改：点赞按钮 -->
                           <span class="action-btn like-btn" @click="like(reply.id)">
                             <like-outlined /> {{ reply.like_count }}
                           </span>
                           <!-- 新增：删除按钮 (仅自己的回复) -->
                           <a-popconfirm
                             v-if="reply.user?.id === userStore.user_id"
                             title="确定删除这条回复吗？"
                             ok-text="是"
                             cancel-text="否"
                             @confirm="deleteCommentOrReply(reply.id)"
                           >
                             <span class="action-btn delete-btn">
                               <delete-outlined /> 删除
                             </span>
                           </a-popconfirm>
                         </div>
                      </div>
                      <p class="comment-content reply-content">{{ reply.content }}</p>

                      <!-- 二级回复输入框 -->
                      <div v-if="reply.showReply" class="reply-input-area flex-view">
                         <a-avatar :src="userStore.avatar || AvatarIcon" class="mine-img reply-avatar" />
                         <a-textarea
                           v-model:value="reply.replyText"
                           :placeholder="'回复 @' + (reply.user?.nickname || '匿名用户')"
                           :rows="2"
                           class="reply-textarea"
                         />
                         <button class="send-btn reply-send-btn" @click="submitReply(reply, item)">发送</button> <!-- 传入父评论 item -->
                      </div>

                    </div>
                  </div>
                </div>
                <!-- 加载更多或无数据提示 -->
                <div class="infinite-loading-container">
                  <div class="infinite-status-prompt" style="">
                    <div v-if="!commentData.length" class="no-results">
                      <p>暂无评论，快来抢沙发吧~</p>
                    </div>
                    <div v-else class="no-more-results">
                      <p>没有更多评论了</p>
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

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { FormInstance, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router/dist/vue-router';
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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'; // 导入 computed, nextTick
// 导入新图标
import { MessageOutlined, LikeOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

let thingId = ref('');
interface UserInfo {
  id: string | number; // 确保 ID 类型匹配
  username?: string;
  nickname?: string;
  avatar?: string;
}
interface DetailData {
  cover: string;
  title: string;
  points: number; // *** 修改：price -> points ***
  classification_title: string;
  location: string;
  description: string;
  wish_count: number;
  collect_count: number;
  user: UserInfo; // 使用 UserInfo 接口
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
  user: { id: '' }, // 初始化 user 对象
  id: '',
});
let tabUnderLeft = ref(6);
let tabData = ref(['详细描述', '评论区']);
let selectTabIndex = ref(0);

interface Comment {
  id: string | number;
  content: string;
  user: UserInfo; // 使用 UserInfo 接口
  comment_time: string;
  like_count: number;
  replies?: Comment[]; // 嵌套回复
  parent_comment?: string | number | null; // 父评论 ID
  parent_comment_user?: UserInfo | null; // 父评论用户信息 (用于显示 @目标)
  // --- UI 状态 ---
  showReply?: boolean;
  replyText?: string;
}

let commentData = ref<Comment[]>([]);
let commentTotal = ref(0); // 新增：评论总数
let newCommentContent = ref(''); // 新增：用于绑定新评论输入框
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

const selectTab = (index) => {
  selectTabIndex.value = index;
  tabUnderLeft.value = 6 + 54 * index;
};

const getThingDetail = () => {
  // *** 在调用 API 时传递 id 和 type ***
  detailApi({ id: thingId.value, type: thingType.value })
    .then((res) => {
      detailData.value = res.data; // 假设数据在 res.data
      // --- 新增日志：打印物品发布者 ID ---
      console.log(`[Debug] Item Publisher ID (detailData.user?.id): ${detailData.value.user?.id}`);
      // ... 其他处理 ...
    })
    .catch((err) => {
      message.error('获取详情失败');
      console.error('获取物品详情失败:', err);
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

const showReplyInput = (item) => {
  // 实现显示回复框的逻辑
  item.showReply = !item.showReply;
  if (item.showReply) {
    item.replyText = ''; // 清空之前的输入
  }
};

// --- 修改：获取评论列表 ---
const getCommentList = () => {
  // data.loading = true; // 假设 data 对象中有 loading 状态
  console.log('Fetching comments for thingId:', thingId.value, 'type:', thingType.value, 'order:', order.value);
  listThingCommentsApi({
      thingId: thingId.value,
      type: thingType.value,
      order: order.value
    })
    .then((res) => {
      console.log('API response for listThingCommentsApi:', res);

      const commentList = res.data?.list || res.data || [];
      const totalComments = res.data?.total || commentList.length;

      console.log('Received comments:', commentList);
      console.log('Total comments:', totalComments);

      // 初始化 UI 状态，并检查 replies
      commentList.forEach((comment: Comment) => {
        comment.showReply = false;
        comment.replyText = '';
        console.log(`Processing comment ID: ${comment.id}, Replies:`, comment.replies);
        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies.forEach((reply: Comment) => {
            reply.showReply = false;
            reply.replyText = '';
            console.log(`  - Processing reply ID: ${reply.id} for parent ${comment.id}`);

            // --- 新增日志：打印发布者标签判断所需信息 ---
            const replierId = reply.user?.id;
            const publisherId = detailData.value.user?.id; // 获取当前物品发布者 ID
            const isPublisher = replierId === publisherId;
            console.log(`    [Debug Publisher Tag] Reply ID: ${reply.id}, Replier ID: ${replierId}, Item Publisher ID: ${publisherId}, Is Publisher: ${isPublisher}`);
            // --- 日志结束 ---

          });
        } else {
           console.log(`  - Comment ID: ${comment.id} has no replies or replies is not an array.`);
           comment.replies = [];
        }
      });

      commentData.value = commentList;
      commentTotal.value = totalComments;

      console.log('Updated commentData ref:', commentData.value);

    })
    .catch((err) => {
      console.error('获取评论列表失败:', err);
      message.error(err.msg || '获取评论列表失败');
    })
    .finally(() => {
      // data.loading = false; // 结束加载状态
    });
};

// --- 修改：发送评论/回复逻辑 ---
const sendComment = () => {
  const text = newCommentContent.value.trim();
  if (text.length <= 0) {
    message.warn('评论内容不能为空');
    return;
  }
  if (!userStore.user_id) {
    message.warn('请先登录！');
    router.push({ name: 'login' });
    return;
  }

  createCommentApi({
    content: text,
    thingId: thingId.value, // 修改：thing_id -> itemId
    itemType: thingType.value, // 修改：thing_type -> itemType
    user_id: userStore.user_id, // 新增：传递 user_id (如果后端需要)
    parentCommentId: null, // 修改：parent_comment_id -> parentCommentId (顶级评论为 null)
  })
    .then(() => {
      message.success('评论成功');
      newCommentContent.value = ''; // 清空输入框
      getCommentList(); // 刷新评论列表
    })
    .catch((err) => {
      console.log(err);
      message.error(err.msg || '评论失败');
    });
};

// --- 新增：切换回复输入框显示 ---
// targetComment: 要回复的评论或回复对象
// parentComment: 如果 targetComment 是一个回复，则需要传入它所属的顶级评论对象，以便知道回复的是谁
const toggleReplyInput = (targetComment: Comment, parentComment?: Comment) => {
  if (!userStore.user_id) {
    message.warn('请先登录！');
    router.push({ name: 'login' });
    return;
  }
  targetComment.showReply = !targetComment.showReply;
  if (targetComment.showReply) {
    targetComment.replyText = ''; // 清空之前的输入
  }
};

// --- 修改：提交回复 ---
// targetComment: 被回复的评论或回复对象
// topLevelComment: 如果 targetComment 是一个回复，则传入它所属的顶级评论对象
const submitReply = (targetComment: Comment, topLevelComment?: Comment) => {
  const text = targetComment.replyText?.trim();
  if (!text || text.length <= 0) {
    message.warn('回复内容不能为空');
    return;
  }
   if (!userStore.user_id) {
     message.warn('请先登录！');
     router.push({ name: 'login' });
     return;
   }

  const parentId = targetComment.id; // 直接将被回复的评论/回复 ID 作为 parent_id

  createCommentApi({
    content: text,
    thingId: thingId.value, // 修改：thing_id -> itemId
    itemType: thingType.value, // 修改：thing_type -> itemType
    user_id: userStore.user_id, // 新增：传递 user_id (如果后端需要)
    parentCommentId: parentId, // 修改：parent_comment_id -> parentCommentId
  })
    .then(() => {
      message.success('回复成功');
      targetComment.replyText = ''; // 清空输入框
      targetComment.showReply = false; // 关闭输入框
      getCommentList(); // 刷新评论列表
    })
    .catch((err) => {
      console.log(err);
      message.error(err.msg || '回复失败');
    });
};

// --- 保留这个 like 定义 ---
// --- 修改：点赞 ---
const like = (commentId: string | number) => { // 注意：这里也有一个 like 函数，确保只保留一个有效的
   if (!userStore.user_id) {
     message.warn('请先登录！');
     router.push({ name: 'login' });
     return;
   }
  likeApi({ commentId: commentId })
    .then((res) => {
      // 局部更新点赞数，避免刷新整个列表闪烁
      const updateLikes = (comments: Comment[]) => {
        for (const comment of comments) {
          if (comment.id === commentId) {
            comment.like_count = res.data.like_count; // 假设后端返回最新的点赞数
            return true;
          }
          if (comment.replies && updateLikes(comment.replies)) {
            return true;
          }
        }
        return false;
      };
      if (!updateLikes(commentData.value)) {
         getCommentList(); // 如果局部更新失败，则刷新列表
      }
    })
    .catch((err) => {
      console.log(err);
      message.error(err.msg || '操作失败');
    });
};

// --- 新增：删除评论或回复 ---
const deleteCommentOrReply = (commentId: string | number) => {
  deleteCommentsApi({ id: commentId }) // 传递 ID
    .then((res) => {
      message.success('删除成功');
      getCommentList(); // 刷新列表
    })
    .catch((err) => {
      console.log(err);
      message.error(err.msg || '删除失败');
    });
};

// --- 修改：排序评论列表 ---
const sortCommentList = (sortType: 'recent' | 'hot') => { // 注意：这里也有一个 sortCommentList 函数，确保只保留一个有效的
  sortIndex.value = sortType === 'recent' ? 0 : 1;
  order.value = sortType;
  getCommentList(); // 重新获取列表
};

// --- 修改：导航到聊天页面的函数 ---
const navigateToChat = () => {
  console.log('navigateToChat function called.'); // <-- 日志 1: 函数开始

  // 检查是否已登录
  if (!userStore.user_id) {
    console.log('User not logged in.'); // <-- 日志 2: 未登录
    message.warn('请先登录再联系对方');
    router.push({ name: 'login' }); // 跳转到登录页
    return;
  }
  console.log('User is logged in. User ID:', userStore.user_id); // <-- 日志 3: 已登录

  const recipientUserId = detailData.value.user?.id;
  console.log('Recipient User ID:', recipientUserId); // <-- 日志 4: 获取到对方 ID

  // 检查是否是联系自己
  if (recipientUserId === userStore.user_id) {
    console.log('Attempting to chat with self.'); // <-- 日志 5: 联系自己
    message.info('这是您自己发布的物品');
    return;
  }

  if (!recipientUserId) {
    console.log('Recipient User ID is invalid or missing.'); // <-- 日志 6: 对方 ID 无效
    message.error('无法获取对方用户信息，无法发起聊天');
    return;
  }

  const routeParams = {
    name: 'chat', // 确认路由名称是否为 'chat'
    params: {
      recipientId: recipientUserId
    },
    query: {
      thingId: thingId.value,
      thingType: thingType.value
    }
  };
  console.log('Preparing to navigate with params:', routeParams); // <-- 日志 7: 准备跳转

  try {
    // 跳转到聊天页面
    router.push(routeParams);
    console.log('router.push called successfully.'); // <-- 日志 8: 跳转函数已调用
  } catch (error) {
    console.error('Error during router.push:', error); // <-- 日志 9: 跳转时发生错误
    message.error('页面跳转失败，请稍后重试');
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
    width: 100%; /* 按钮宽度占满 */
    max-width: 140px; /* 最大宽度 */
    align-self: flex-start; // 左对齐
    background: linear-gradient(135deg, @primary-color, @fallback-secondary-color); // 使用备用颜色
    border: none;
    transition: all 0.3s ease;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(106, 142, 230, 0.4);
      transform: translateY(-2px);
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
    transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.thing-description { // 替换 .thing-intro
  padding: 15px; // 增加内边距
  background-color: #fdfdff; // 非常浅的背景色
  border-radius: 8px; // 圆角
  border: 1px solid #f0f0f0;
  margin-top: 10px; // 与 Tab 分隔

  /* 新增：发布者信息样式 */
  .description-publisher {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px; // 与描述文本分隔

    .publisher-name-time {
      display: flex;
      flex-direction: column;

      .name {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
      .time { // 如果添加时间，可以取消注释
        font-size: 12px;
        color: #999;
      }
    }
  }

  .text {
    font-size: 15px;
    line-height: 1.8;
    color: #444;
    white-space: pre-wrap; // 保留换行和空格
    padding: 0; // 移除内边距，由父元素控制
    background-color: transparent; // 移除背景色
    border: none; // 移除边框
    border-radius: 0; // 移除圆角
  }
}

.thing-comment {
  margin-top: 30px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }

  .publish {
    display: flex;
    align-items: flex-start; // 顶部对齐
    gap: 15px;
    margin-bottom: 25px;

    .mine-img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      flex-shrink: 0; // 防止头像被压缩
    }

    .content-input { // 修改为 a-textarea
      flex-grow: 1;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      resize: vertical; // 允许垂直调整大小
      min-height: 60px; // 最小高度
      &:focus {
        border-color: @primary-color;
        box-shadow: 0 0 0 2px fade(@primary-color, 20%);
        outline: none;
      }
    }

    .send-btn {
      padding: 0 18px;
      height: 40px; // 与输入框大致对齐
      line-height: 40px;
      background: linear-gradient(135deg, @primary-color, @fallback-secondary-color);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.3s;
      align-self: flex-end; // 按钮底部对齐
      width: 71px;

      &:hover {
        opacity: 0.85;
      }
    }
  }

  .tab-view {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;

    .count-text {
      font-size: 14px;
      color: #666;
    }

    .tab-box {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #666;

      span {
        cursor: pointer;
        padding: 5px 0;
        transition: color 0.3s;
        &:hover {
          color: @primary-color;
        }
      }

      .tab-select {
        color: @primary-color;
        font-weight: 600;
        border-bottom: 2px solid @primary-color;
      }

      .line {
        width: 1px;
        height: 14px;
        background-color: #ccc;
      }
    }
  }

  .comments-list {
    .comment-item {
      padding: 15px 0;
      border-bottom: 1px dashed #eee; // 分隔线改为虚线

      &:last-child {
        border-bottom: none;
      }

      .flex-item {
        display: flex;
        align-items: flex-start; // 顶部对齐
        gap: 12px;

        .avator {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .person {
          flex-grow: 1; // 占据剩余空间
          .name {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 3px;
            display: flex; // 用于放置 Tag
            align-items: center;
            gap: 6px;
          }
          .time {
            font-size: 12px;
            color: #999;
          }
          .publisher-tag {
             margin-left: 5px; // 与昵称的间距
             height: 18px;
             line-height: 16px;
             font-size: 10px;
             padding: 0 4px;
          }
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 15px; // 增加操作按钮间距
          font-size: 13px;
          color: #888;
          margin-top: 2px; // 微调位置

          .action-btn {
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px; // 图标和文字间距
            transition: color 0.3s;

            &:hover {
              color: @primary-color;
            }
          }
          .delete-btn:hover {
             color: @error-color; // 删除按钮悬停红色
          }
        }
      }

      .comment-content {
        margin-top: 8px;
        margin-left: 52px; // 与头像对齐
        font-size: 14px;
        color: #555;
        line-height: 1.7;
        white-space: pre-wrap; // 保留换行
      }

      .reply-input-area {
        margin-top: 10px;
        margin-left: 52px; // 与父评论内容对齐
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .reply-avatar {
          width: 30px;
          height: 30px;
        }

        .reply-textarea {
          flex-grow: 1;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 13px;
          resize: vertical;
          min-height: 40px;
           &:focus {
             border-color: @primary-color;
             box-shadow: 0 0 0 2px fade(@primary-color, 20%);
             outline: none;
           }
        }
        .reply-send-btn {
           padding: 0 15px;
           height: 32px; // 调整高度
           line-height: 32px;
           font-size: 13px;
           align-self: flex-end; // 按钮底部对齐
           background: linear-gradient(135deg, @primary-color, @fallback-secondary-color);
           color: #fff;
           border: none;
           border-radius: 4px;
           cursor: pointer;
           transition: opacity 0.3s;
           &:hover {
             opacity: 0.85;
           }
        }
      }

      .replies-list {
        margin-top: 15px;
        margin-left: 52px; // 嵌套回复缩进
        padding-left: 15px;
        border-left: 2px solid #eee; // 左侧指示线

        .reply-item {
          padding: 10px 0;
          border-bottom: 1px dashed #f0f0f0; // 回复之间的分隔线

          &:last-child {
            border-bottom: none;
          }

          .reply-avatar-small {
            width: 30px; // 回复头像小一点
            height: 30px;
          }
          .reply-content {
             margin-left: 42px; // 回复内容缩进
             font-size: 13px; // 回复内容字号小一点
          }
          .reply-target {
             color: #888;
             margin-left: 5px;
          }
        }
      }
    }

    .infinite-loading-container {
      text-align: center;
      color: #999;
      font-size: 13px;
      padding: 20px 0;
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
