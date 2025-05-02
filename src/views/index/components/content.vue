<template>
  <div class="content">
    <div class="content-left">
      <div class="left-search-item">
        <h4>物品分类</h4>
        <div class="tree-container">
          <a-tree :tree-data="contentData.cData" :selected-keys="contentData.selectedKeys" @select="onSelect"
            style="min-height: 220px" />
        </div>
      </div>
      <div class="left-search-item">
        <h4>标签分类</h4>
        <div class="tag-view tag-flex-view">
          <span class="tag" :class="{ 'tag-select': contentData.selectTagId === item.id }"
            v-for="item in contentData.tagData" :key="item.id" @click="clickTag(item.id)">{{ item.title }}</span>
        </div>
      </div>
      <div class="left-search-item">
        <h4>位置联级查询</h4>
        <el-cascader 
          :options="regionOptions" 
          v-model="selectedRegion" 
          placeholder="请选择"
          @change="handleRegionChange"
          class="region-select"
        ></el-cascader>
      </div>
    </div>
    <div class="content-right">
      <div class="top-select-view flex-view">
        <div class="order-view">
          <span
            class="tab tab-all"
            :class="{ 'tab-select': contentData.selectTabIndex === 0 }"
            @click="selectTab(0)"
            :ref="el => tabRefs[0] = el"
          >
            <AppstoreOutlined /> 全部
          </span>
          <span
            class="tab tab-lost"
            :class="{ 'tab-select': contentData.selectTabIndex === 1 }"
            @click="selectTab(1)"
            :ref="el => tabRefs[1] = el"
          >
            <QuestionCircleOutlined /> 失物
          </span>
          <span
            class="tab tab-found"
            :class="{ 'tab-select': contentData.selectTabIndex === 2 }"
            @click="selectTab(2)"
            :ref="el => tabRefs[2] = el"
          >
            <BulbOutlined /> 招领
          </span>
          <span
            class="tab tab-hot"
            :class="{ 'tab-select': contentData.selectTabIndex === 3 }"
            @click="selectTab(3)"
            :ref="el => tabRefs[3] = el"
          >
            <FireOutlined /> 最热
          </span>
          <span
            class="tab tab-latest"
            :class="{ 'tab-select': contentData.selectTabIndex === 4 }"
            @click="selectTab(4)"
            :ref="el => tabRefs[4] = el"
          >
            <ClockCircleOutlined /> 最新
          </span>
          <span
            class="tab-underline"
            :style="{ left: contentData.tabUnderLeft + 'px', width: contentData.tabUnderWidth + 'px' }"
          ></span>
        </div>
      </div>
      <a-spin :spinning="contentData.loading" style="min-height: 200px">
        <div class="pc-thing-list flex-view">
          <div v-for="item in contentData.pageData" :key="item.id" @click="handleDetail(item)"
            class="thing-item item-column-3">
            <div class="img-view">
              <img :src="item.cover" :alt="item.title" />
            </div>
            <div class="info-view">
              <h3 class="thing-name">{{ item.title.substring(0, 12) }}</h3>
              <span>
                <span class="a-price-symbol"></span>
                <span class="a-price">地点：{{ item.location }}</span><br>
                <span class="a-price">发布者：{{ item.user?.username || '匿名' }}</span>
              </span>
            </div>
          </div>
          <div v-if="contentData.pageData.length <= 0 && !contentData.loading" class="no-data" style="">暂无数据</div>
        </div>
      </a-spin>
      <div class="page-view" style="">
        <a-pagination v-model="contentData.page" size="small" @change="changePage" :hideOnSinglePage="true"
          :defaultPageSize="contentData.pageSize" :total="contentData.total" :showSizeChanger="false" />
      </div>
    </div>
    <div class="content-notice">
      <h4>通知公告栏</h4>
      <div class="notice-item" v-for="(notice, index) in notices" :key="index">
        <h5>{{ notice.title }}</h5>
        <p>{{ notice.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { listApi as listClassificationList } from '/@/api/index/classification';
import { listApi as listTagList } from '/@/api/index/tag';
import { createSkimApi, listApi as listThingList } from '/@/api/index/thing';
import { useUserStore } from '/@/store';
import { BASE_URL } from '/@/store/constants';
import { regionData } from 'element-china-area-data'; // 导入地区数据
import { ref, reactive, onMounted, nextTick } from 'vue'; // 引入 ref 和 nextTick
import { AppstoreOutlined, QuestionCircleOutlined, BulbOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router'; // 确保导入 useRouter

const userStore = useUserStore();
const router = useRouter();

const contentData = reactive({
  selectX: 0,
  selectTagId: -1,
  cData: [],
  selectedKeys: [],
  tagData: [],
  loading: false,
  form: {
    user: undefined,
    thing:undefined,
  },

  tabData: ['全部', '失物', '招领', '最热', '最新'],
  selectTabIndex: 0,
  tabUnderLeft: 0, // 初始值设为 0
  tabUnderWidth: 0, // 新增：下划线宽度

  thingData: [],
  pageData: [],

  page: 1,
  total: 0,
  pageSize: 12,
});

// 新增：用于存储 tab 元素的引用
const tabRefs = ref([]);

const notices = reactive([
  { title: '公告1', content: '这是公告内容1' },
  { title: '公告2', content: '这是公告内容2' },
  // 可以添加更多公告
]);

const selectedRegion = ref([]); // 选中的地区

const regionOptions = ref([
  { value: 'all', label: '全部' },
  ...regionData
]);

onMounted(async () => {
  initSider();
  await getThingList({}); // 等待初始列表加载完成
  // 使用 nextTick 确保 DOM 更新后再计算下划线位置
  nextTick(() => {
    calculateUnderlinePosition(contentData.selectTabIndex);
  });
});

const initSider = () => {
  contentData.cData.push({ key: '-1', title: '全部' });
  listClassificationList().then((res) => {
    res.data.forEach((item) => {
      item.key = item.id;
      contentData.cData.push(item);
    });
  });
  listTagList().then((res) => {
    contentData.tagData = res.data;
  });
};

const getSelectedKey = () => {
  if (contentData.selectedKeys.length > 0) {
    return contentData.selectedKeys[0];
  } else {
    return -1;
  }
};
const onSelect = (selectedKeys) => {
  contentData.selectedKeys = selectedKeys;
  console.log(contentData.selectedKeys[0]);
  if (contentData.selectedKeys.length > 0) {
    getThingList({ c: getSelectedKey() });
  }
  contentData.selectTagId = -1;
};
const clickTag = (index) => {
  contentData.selectedKeys = [];
  contentData.selectTagId = index;
  getThingList({ tag: contentData.selectTagId });
};

// 新增：计算下划线位置和宽度的函数
const calculateUnderlinePosition = (index) => {
  const selectedTabElement = tabRefs.value[index];
  if (selectedTabElement) {
    // offsetLeft 是相对于父元素 .order-view 的左偏移量
    // clientWidth 是元素的实际宽度
    contentData.tabUnderLeft = selectedTabElement.offsetLeft;
    contentData.tabUnderWidth = selectedTabElement.clientWidth;
  }
};

// 最新|最热|推荐 -> 修改为处理新 tab 逻辑
const selectTab = (index) => {
  contentData.selectTabIndex = index;
  // contentData.tabUnderLeft = 12 + 50 * index; // 移除旧的固定计算方式
  calculateUnderlinePosition(index); // 调用新函数计算位置

  console.log('Selected Tab Index:', contentData.selectTabIndex);

  let params = {};

  switch (index) {
    case 0: // 全部
      // 不需要额外的 sort 或 type 参数
      break;
    case 1: // 失物
      params['type'] = 'lost'; // 假设后端用 type='lost' 筛选失物
      break;
    case 2: // 拾物
      params['type'] = 'found'; // 假设后端用 type='found' 筛选拾物
      break;
    case 3: // 最热
      params.sort = 'hot';
      break;
    case 4: // 最新
      params.sort = 'recent';
      break;
  }

  // 如果需要保留分类或标签筛选，在这里重新添加
  if (contentData.selectedKeys.length > 0 && getSelectedKey() !== '-1') {
      params['c'] = getSelectedKey();
  }
  if (contentData.selectTagId !== -1) {
      params['tag'] = contentData.selectTagId;
  }
  // 如果选择了地区，也添加地区参数
  if (selectedRegion.value.length > 0 && !selectedRegion.value.includes('all')) {
      params['region'] = selectedRegion.value.join('/');
  }


  getThingList(params);
};

const handleDetail = (item) => {
  // 跳转新页面
  let userid = userStore.user_id;
  let thingid = item.id;
  let thingType = item.type; // *** 获取物品类型 ***

  contentData.form.user = userid;
  contentData.form.thing = thingid;

  createSkimApi(contentData.form).then((res) => {
    console.log("Skim record created");
  }).catch((err) => {
    console.error("Failed to create skim record:", err);
  });

  // *** 在路由查询中添加 type 参数 ***
  router.push({ name: 'detail', query: { id: item.id, type: thingType } });
};

// 分页事件
const changePage = (page) => {
  contentData.page = page;
  let start = (contentData.page - 1) * contentData.pageSize;
  contentData.pageData = contentData.thingData.slice(start, start + contentData.pageSize);
  console.log('第' + contentData.page + '页');
};
const getThingList = (data) => {
  contentData.loading = true;
  // 确保 data 包含 type 参数（如果需要）
  console.log("Requesting thing list with params:", data);
  listThingList(data)
    .then((res) => {
      contentData.loading = false;
      console.log(res); // 确认 res.data 中包含 user.username 和 type
      contentData.thingData = res.data.map(item => ({ // *** 确保每个 item 包含 type ***
        ...item,
        type: item.type || (data.type || 'unknown') // 如果后端没返回 type，尝试从请求参数推断
      }));
      contentData.total = contentData.thingData.length;
      changePage(1);
    })
    .catch((err) => {
      console.log(err);
      contentData.loading = false;
    });
};

const handleRegionChange = (value) => {
  if (value.includes('all')) {
    getThingList({});
  } else {
    // 根据选中的地区进行筛选
    const regionString = value.join('/'); // 将数组转为 "省/市/区" 格式
    getThingList({ region: regionString });
  }
};
</script>

<style scoped lang="less">
.content {
  display: flex;
  flex-direction: row;
  width: 93%;
  margin: 56px auto;
  // background-image: url('/bg_main.jpg'); // 使用根路径引用 public 目录中的文件
  // background-size: cover;
  // background-position: center;
  // opacity: 0.8; // 设置透明度
}

.content-left {
  width: 220px;
  margin-right: 32px;
}

.left-search-item {
  overflow: hidden;
  border-bottom: 1px solid #cedce4;
  margin-top: 24px;
  padding-bottom: 24px;
}

.tree-container {
  background-color: #12e3ee; // 设置背景颜色
  padding: 10px;
  border-radius: 4px;
}

h4 {
  color: #4d4d4d;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  height: 24px;
}

.category-item {
  cursor: pointer;
  color: #333;
  margin: 12px 0 0;
  padding-left: 16px;
}

ul {
  margin: 0;
  padding: 0;
}

ul {
  list-style-type: none;
}

li {
  margin: 4px 0 0;
  display: list-item;
  text-align: -webkit-match-parent;
}

.child {
  color: #333;
  padding-left: 16px;
}

.child:hover {
  color: #4684e2;
}

.select {
  color: #4684e2;
}

.flex-view {
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  //justify-content: space-between;
  display: flex;
}

.name {
  font-size: 14px;
}

.name:hover {
  color: #4684e2;
}

.count {
  font-size: 14px;
  color: #999;
}

.check-item {
  font-size: 0;
  height: 18px;
  line-height: 12px;
  margin: 12px 0 0;
  color: #333;
  cursor: pointer;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}

.check-item input {
  cursor: pointer;
}

.check-item label {
  font-size: 14px;
  margin-left: 12px;
  cursor: pointer;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

.tag-view {
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tag-flex-view {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.tag {
  background: #fff;
  border: 1px solid #a1adc6;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-radius: 16px;
  height: 20px;
  line-height: 18px;
  padding: 0 8px;
  margin: 8px 8px 0 0;
  cursor: pointer;
  font-size: 12px;
  color: #152833;
}

.tag:hover {
  background: #4684e3;
  color: #fff;
  border: 1px solid #4684e3;
}

.tag-select {
  background: #4684e3;
  color: #fff;
  border: 1px solid #4684e3;
}

.content-right {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  padding-top: 12px;

  .pc-search-view {
    margin: 0 0 24px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;

    .search-icon {
      width: 20px;
      height: 20px;
      -webkit-box-flex: 0;
      -ms-flex: 0 0 20px;
      flex: 0 0 20px;
      margin-right: 16px;
    }

    input {
      outline: none;
      border: 0px;
      -webkit-box-flex: 1;
      -ms-flex: 1;
      flex: 1;
      border-bottom: 1px solid #cedce4;
      color: #152844;
      font-size: 14px;
      height: 22px;
      line-height: 22px;
      -ms-flex-item-align: end;
      align-self: flex-end;
      padding-bottom: 8px;
    }

    .clear-search-icon {
      position: relative;
      left: -20px;
      cursor: pointer;
    }

    button {
      outline: none;
      border: none;
      font-size: 14px;
      color: #fff;
      background: #288dda;
      border-radius: 32px;
      width: 88px;
      height: 32px;
      line-height: 32px;
      margin-left: 2px;
      cursor: pointer;
    }

    .float-count {
      color: #999;
      margin-left: 24px;
    }
  }

  .flex-view {
    display: flex;
  }

  .top-select-view {
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    height: 40px;
    line-height: 27px;
    margin-top: 30px;
    .type-view {
      position: relative;
      font-weight: 400;
      font-size: 18px;
      color: #5f77a6;

      .type-tab {
        margin-right: 32px;
        cursor: pointer;
      }

      .type-tab-select {
        color: #152844;
        font-weight: 600;
        font-size: 20px;
      }

      .tab-underline {
        position: absolute;
        bottom: 0;
        //left: 22px;
        width: 16px;
        height: 4px;
        background: #4684e2;
        -webkit-transition: left 0.3s;
        transition: left 0.3s;
      }
    }

    .order-view {
      position: relative;
      color: #6c6c6c;
      font-size: 14px;
      display: flex; // 改为 flex 布局方便处理间距和对齐
      align-items: center; // 垂直居中
      padding-bottom: 8px; // 增加下划线空间

      .tab {
        color: #666; // 默认文字颜色
        margin-right: 20px; // 调整标签间距
        padding: 10px 15px; // 增大内边距
        cursor: pointer;
        font-size: 18px; // 增大字体
        font-weight: 500;
        position: relative;
        transition: all 0.3s ease; // 平滑过渡
        border-radius: 8px; // 添加圆角
        display: inline-flex; // 使图标和文字对齐
        align-items: center; // 垂直居中
        gap: 6px; // 图标和文字间距

        .anticon {
          font-size: 1.1em; // 图标稍大一点
          transition: transform 0.3s ease;
        }

        &:last-child {
          margin-right: 0;
        }

        &:hover {
          transform: translateY(-3px) scale(1.05); // 悬停时上移并轻微放大
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); // 添加阴影

          .anticon {
             transform: rotate(15deg); // 悬停时图标轻微旋转
          }
        }

        // --- 特色样式 ---
        &.tab-all {
          &:hover, &.tab-select { color: #1890ff; background-color: #e6f7ff; } // 蓝色系
        }
        &.tab-lost {
          &:hover, &.tab-select { color: #faad14; background-color: #fffbe6; } // 黄色系
        }
        &.tab-found {
          &:hover, &.tab-select { color: #52c41a; background-color: #f6ffed; } // 绿色系
        }
        &.tab-hot {
          &:hover, &.tab-select { color: #ff4d4f; background-color: #fff1f0; } // 红色系
        }
        &.tab-latest {
          &:hover, &.tab-select { color: #722ed1; background-color: #f9f0ff; } // 紫色系
        }
        // --- 特色样式结束 ---
      }

      .tab-select {
        font-weight: 600; // 选中时加粗
        transform: translateY(0) scale(1); // 选中时恢复原位和大小
        box-shadow: none; // 移除悬停阴影
        // 使用上面定义的特色样式背景色和颜色
      }

      .tab-underline {
        position: absolute;
        bottom: 0;
        height: 4px; // 调整下划线高度
        // 使用更鲜艳的渐变色或单色
        background: linear-gradient(to right, #ebff5f, #feb47b, #2ade79); // 主题渐变色
        background-size: 200% 100%; // 用于动画
        border-radius: 2px;
        transition: left 0.4s cubic-bezier(0.65, 0, 0.35, 1), width 0.4s cubic-bezier(0.65, 0, 0.35, 1);
        animation: underline-flow 3s linear infinite; // 添加流动动画
      }

      // 下划线流动动画
      @keyframes underline-flow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    }
  }

  .pc-thing-list {
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;

    .thing-item {
      min-width: 255px;
      max-width: 255px;
      position: relative;
      flex: 1;
      margin-right: 20px;
      height: fit-content;
      overflow: hidden;
      margin-top: 26px;
      margin-bottom: 36px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease; // 为整个卡片添加过渡效果

      &:hover {
         // 可选：整个卡片轻微上移和更明显的阴影
         transform: translateY(-5px);
         box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }

      .img-view {
        height: 200px;
        width: 200px; // 保持宽度与 img 一致或稍大以容纳边框
        border-radius: 8px; // 添加圆角
        overflow: hidden; // 隐藏放大的图片超出部分
        border: 2px solid #cff4e3; // 添加细边框
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08); // 添加轻微阴影
        transition: box-shadow 0.3s ease; // 为阴影添加过渡

        img {
          height: 100%; // 改为 100% 以填充容器
          width: 100%;  // 改为 100% 以填充容器
          // margin: 0 auto; // 不再需要 margin
          background-size: cover;
          object-fit: cover;
          display: block; // 确保 img 是块级元素，避免底部空隙
          transition: transform 0.3s ease; // 为放大效果添加平滑过渡
        }
      }

      // 鼠标悬停在 thing-item 上时，放大 img-view 里的 img
      &:hover .img-view img {
        transform: scale(1.1); // 放大 10%
      }

      .info-view {
        //background: #f6f9fb;
        overflow: hidden;
        padding: 0 0px;

        .thing-name {
          line-height: 32px;
          margin-top: 12px;
          font-size: 18px;
          color: #0f1111 !important;
          font-style: normal !important;
          text-transform: none !important;
          text-decoration: none !important;
        }

        .price {
          color: #ff7b31;
          font-size: 16px;
          line-height: 20px;
          margin-top: 4px;
          overflow: hidden;
          white-space: nowrap;
        }

        .translators {
          color: #6f6f6f;
          font-size: 12px;
          line-height: 14px;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .no-data {
      height: 200px;
      line-height: 200px;
      text-align: center;
      width: 100%;
      font-size: 16px;
      color: #152844;
    }
  }

  .page-view {
    width: 100%;
    text-align: center;
    margin-top: 48px;
  }
}

.content-notice {
  width: 220px;
  margin-left: 32px;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.notice-item {
  margin-bottom: 16px;
}

.notice-item h5 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
}

.notice-item p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.a-price-symbol {
  top: -0.5em;
  font-size: 12px;
}

.a-price {
  color: #0f1111;
  font-size: 14px;
}
</style>

