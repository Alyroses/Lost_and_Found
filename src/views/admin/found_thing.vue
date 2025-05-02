<template>
  <div class="found-thing-management-container">
    <!-- 搜索和操作区域 -->
    <div class="table-operations">
      <a-space size="middle" align="center">
        <!-- 搜索标签 -->
        <div class="search-label">
          <span>物品名称</span>
          <span style="margin-left: 4px;">🔍</span>
        </div>
        <!-- 搜索输入框 -->
        <a-input-search
          placeholder="输入物品名称搜索"
          enter-button="查询"
          allowClear
          @search="onSearch"
          @input="handleSearchInput"
          v-model:value="keyword"
          class="custom-search-input"
          style="width: 300px"
        />
        <!-- 状态筛选框 (根据拾物状态调整) -->
        <a-select
          v-model:value="filterStatus"
          placeholder="筛选状态"
          style="width: 120px; margin-left: 8px;"
          @change="handleFilterChange"
          allowClear
        >
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="0">待认领</a-select-option>
          <a-select-option value="1">已认领</a-select-option>
          <a-select-option value="2">已过期/处理</a-select-option> <!-- 示例状态 -->
        </a-select>
        <!-- 刷新按钮 -->
        <a-button @click="getFoundThingList()" class="refresh-button">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
         <!-- 其他操作按钮，例如 新增拾物信息 (如果允许后台添加) -->
         <!-- <a-button type="primary" @click="handleAddFoundThing">新增拾物</a-button> -->
      </a-space>
    </div>

    <!-- 拾物信息表格 -->
    <a-table
      size="middle"
      rowKey="id"
      :loading="data.loading"
      :columns="columns"
      :data-source="data.foundThingList"
      :pagination="{
        size: 'default',
        current: data.page,
        pageSize: data.pageSize,
        onChange: (current) => (data.page = current),
        showSizeChanger: false,
        showTotal: (total) => `共${total}条数据`,
        style: { marginTop: '16px' }
      }"
      class="found-thing-table"
    >
      <template #bodyCell="{ text, record, index, column }">
        <!-- 图片列渲染 -->
        <template v-if="column.key === 'cover'">
          <a-avatar :src="record.cover" shape="square" :size="64">
            <!-- 可以添加默认图片 -->
            <template #icon><FileImageOutlined /></template>
          </a-avatar>
        </template>
        <!-- 状态列渲染 -->
        <template v-else-if="column.key === 'status'">
           <!-- 根据实际状态值调整 -->
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <!-- 操作列渲染 -->
        <template v-else-if="column.key === 'operation'">
           <!-- 根据需要添加操作，例如 查看详情、编辑、标记为已认领、删除等 -->
           <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
           <a-divider type="vertical" />
           <a-popconfirm
             title="确定删除该拾物信息?"
             ok-text="是"
             cancel-text="否"
             @confirm="deleteFoundThing(record)"
           >
             <a-button type="link" danger size="small">删除</a-button>
           </a-popconfirm>
           <!-- 更多操作... -->
        </template>
      </template>
    </a-table>
  </div>

  <!-- 可能需要的模态框，例如编辑/详情模态框 -->
  <!-- <a-modal ... /> -->

</template>

<script setup lang="ts">
// --- 导入必要的 API 和组件 ---
// import { listFoundApi, deleteFoundApi, updateFoundApi } from '/@/api/admin/found_thing'; // 假设有对应的 API
import { message, SelectProps } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { ref, reactive, onMounted } from 'vue';
import { debounce } from 'lodash-es';
import { ReloadOutlined, FileImageOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons-vue';

// --- 响应式数据 ---
const keyword = ref('');
const filterStatus = ref<string>('1'); // 默认筛选“已认领”

const data = reactive({
  foundThingList: [], // 存储拾物列表数据
  loading: false,
  pageSize: 10,
  page: 1,
  total: 0, // 总数，用于分页
});

// --- 表格列定义 (需要根据拾物信息调整) ---
const columns: ColumnType<any>[] = reactive([
  { title: '序号', dataIndex: 'index', key: 'index', align: 'center', width: 80 },
  { title: '图片', dataIndex: 'cover', key: 'cover', align: 'center', width: 100 },
  { title: '物品名称', dataIndex: 'title', key: 'title', align: 'center' },
  { title: '拾取地点', dataIndex: 'location', key: 'location', align: 'center' },
  { title: '拾取时间', dataIndex: 'found_time', key: 'found_time', align: 'center' }, // 假设有拾取时间字段
  { title: '发布者', dataIndex: ['user', 'username'], key: 'username', align: 'center' }, // 假设关联了用户
  { title: '状态', dataIndex: 'status', key: 'status', align: 'center', width: 100 },
  { title: '操作', key: 'operation', align: 'center', width: 180 },
]);

// --- 方法 ---

// 获取拾物列表 (需要实现 API 调用)
const getFoundThingList = (params: { keyword?: string; status?: string } = {}) => {
  data.loading = true;
  const apiParams: Record<string, any> = {
    page: data.page,
    pageSize: data.pageSize,
    keyword: params.keyword !== undefined ? params.keyword : keyword.value,
  };
  if (params.status !== undefined && params.status !== '') {
    apiParams.status = params.status;
  } else if (filterStatus.value !== '') {
     apiParams.status = filterStatus.value;
  }

  console.log("Fetching found things with params:", apiParams);
  // --- Placeholder for API call ---
  // listFoundApi(apiParams).then(res => {
  //   data.loading = false;
  //   if (res.code === 0) {
  //      data.foundThingList = res.data.list.map((item, index) => ({ ...item, index: (data.page - 1) * data.pageSize + index + 1 }));
  //      data.total = res.data.total;
  //   } else {
  //      message.error(res.msg || '获取拾物列表失败');
  //   }
  // }).catch(err => {
  //   data.loading = false;
  //   console.error(err);
  //   message.error('请求拾物列表出错');
  // });
  // --- End Placeholder ---

  // 模拟数据和结束 loading
  setTimeout(() => {
      data.loading = false;
      // 模拟分页数据
      const mockData = [
          { id: 1, index: 1, cover: 'https://via.placeholder.com/64?text=Found1', title: '拾到的钱包', location: '图书馆', found_time: '2023-10-27 10:00', user: { username: '张三' }, status: '1' },
          { id: 2, index: 2, cover: 'https://via.placeholder.com/64?text=Found2', title: '拾到的钥匙', location: '教学楼A', found_time: '2023-10-26 15:30', user: { username: '李四' }, status: '0' },
          { id: 3, index: 3, cover: 'https://via.placeholder.com/64?text=Found3', title: '拾到的雨伞', location: '食堂', found_time: '2023-10-28 12:00', user: { username: '王五' }, status: '1' },
      ];
      // 根据筛选条件模拟过滤
      let filteredData = mockData;
      if (apiParams.keyword) {
          filteredData = filteredData.filter(item => item.title.includes(apiParams.keyword));
      }
      if (apiParams.status) {
          filteredData = filteredData.filter(item => item.status === apiParams.status);
      }
      data.foundThingList = filteredData.map((item, index) => ({ ...item, index: (data.page - 1) * data.pageSize + index + 1 }));
      data.total = filteredData.length; // 模拟总数
      message.info("获取拾物列表功能待实现 (模拟数据)");
  }, 500);
};

// 搜索防抖
const handleSearchInput = debounce(() => {
  data.page = 1; // 重置到第一页
  onSearch();
}, 500);

// 执行搜索
const onSearch = () => {
  data.page = 1; // 重置到第一页
  getFoundThingList({ keyword: keyword.value, status: filterStatus.value });
};

// 筛选状态变化
const handleFilterChange = () => {
  data.page = 1; // 重置到第一页
  getFoundThingList({ keyword: keyword.value, status: filterStatus.value });
};

// 查看详情 (需要实现)
const viewDetail = (record: any) => {
  console.log("查看详情:", record);
  // 打开详情模态框或跳转详情页
  message.info("查看详情功能待实现");
};

// 删除拾物信息 (需要实现 API 调用)
const deleteFoundThing = (record: any) => {
  console.log("删除:", record);
  // --- Placeholder for API call ---
  // deleteFoundApi({ id: record.id }).then(res => {
  //   if (res.code === 0) {
  //     message.success('删除成功');
  //     getFoundThingList(); // 刷新列表
  //   } else {
  //     message.error(res.msg || '删除失败');
  //   }
  // }).catch(err => {
  //   console.error(err);
  //   message.error('请求删除出错');
  // });
  // --- End Placeholder ---
  message.info("删除功能待实现");
};

// 根据状态值返回 Tag 颜色 (示例)
const getStatusColor = (status: string) => {
  switch (status) {
    case '0': return 'processing'; // 待认领
    case '1': return 'success';    // 已认领
    case '2': return 'default';    // 已过期/处理
    default: return 'default';
  }
};

// 根据状态值返回 Tag 文本 (示例)
const getStatusText = (status: string) => {
  switch (status) {
    case '0': return '待认领';
    case '1': return '已认领';
    case '2': return '已处理';
    default: return '未知';
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  getFoundThingList({ status: filterStatus.value }); // 初始加载
});

</script>

<style scoped lang="less">
/* 复制 user.vue 的样式，并按需调整 */
.found-thing-management-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-operations {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.found-thing-table {
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  :deep(.ant-table-thead > tr > th) {
    background-color: #fafafa; // 可以用不同的表头颜色区分
    font-weight: 600;
    color: #333;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 12px 16px;
  }

  :deep(.ant-avatar) {
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
}

:deep(.ant-table-cell) {
  .ant-btn {
    margin: 0 4px;
    border-radius: 4px; /* 调整按钮圆角 */
  }
  .ant-divider-vertical {
    margin: 0; /* 移除分隔符的默认边距 */
  }
}

.search-label {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background-color: #1890ff; /* 示例颜色 */
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
  height: 32px;
  box-sizing: border-box;
}

.custom-search-input {
  border-radius: 18px;
  overflow: hidden;
  display: inline-flex;
  border: 1px solid #d9d9d9;

  &:hover, &:focus-within {
    border-color: #1890ff;
  }

  :deep(.ant-input-affix-wrapper),
  :deep(.ant-input-search-button) {
      border: none !important;
  }
  :deep(.ant-input-search-button) {
      background-color: #1890ff; /* 示例颜色 */
      border-color: #1890ff;
      color: #fff;
      height: 30px; /* 调整按钮高度以匹配边框 */
      &:hover {
        background-color: #40a9ff;
        border-color: #40a9ff;
      }
  }
   :deep(.ant-input-affix-wrapper) {
     height: 30px; /* 调整 wrapper 高度 */
     &:focus-within, &:hover {
        box-shadow: none;
     }
   }
}

.refresh-button {
  margin-left: 8px;
  border-radius: 6px;
  border: none;
  background-color: #52c41a; /* 示例颜色 */
  color: #fff;
  transition: background-color 0.3s;

  &:hover {
    background-color: #73d13d;
  }
}

:deep(.ant-select) {
  .ant-select-selector {
    border-radius: 6px !important;
  }
}
</style>
