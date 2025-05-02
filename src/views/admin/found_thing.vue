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
        <!-- 状态筛选框 (调整状态文本) -->
        <a-select
          v-model:value="filterStatus"
          placeholder="筛选状态"
          style="width: 120px; margin-left: 8px;"
          @change="handleFilterChange"
          allowClear
        >
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="0">待审核</a-select-option> <!-- 修改 -->
          <a-select-option value="1">已上架</a-select-option> <!-- 修改 -->
          <a-select-option value="2">已下架</a-select-option> <!-- 修改 -->
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
        style: { marginTop: '16px' },
        total: data.total, // 绑定总数
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
         <!-- 新增：发布者列渲染 -->
         <template v-else-if="column.key === 'username'">
           <span>{{ record.user?.username || 'N/A' }}</span>
         </template>
        <!-- 状态列渲染 (使用新的状态文本) -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <!-- 操作列渲染 -->
        <template v-else-if="column.key === 'operation'">
           <a-space size="small">
             <!-- 查看详情按钮 -->
             <a-button type="primary" size="small" @click="viewDetail(record)">
               <template #icon><EyeOutlined /></template>
               详情
             </a-button>

             <!-- 新增：审核操作 (状态为 0 时显示) -->
             <template v-if="record.status === '0'">
                <a-dropdown :trigger="['hover']">
                  <template #overlay>
                    <a-menu @click="({ key }) => handleAuditMenuClick(key, record)">
                      <a-menu-item key="approve" class="audit-menu-item approve">
                        <CheckOutlined />通过审核
                      </a-menu-item>
                      <a-menu-item key="reject" class="audit-menu-item reject">
                        <CloseOutlined />拒绝审核
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button size="small" class="audit-dropdown-button">
                    审核 <DownOutlined />
                  </a-button>
                </a-dropdown>
             </template>

             <!-- 下架操作 (状态为 1 时显示) -->
             <template v-if="record.status === '1'">
               <a-popconfirm
                 title="确定下架该拾物信息吗？"
                 ok-text="是"
                 cancel-text="否"
                 @confirm="updateFoundThingStatus(record, '2')"
               >
                 <a-button type="primary" danger size="small">
                   <template #icon><ArrowDownOutlined /></template> <!-- 修改图标 -->
                   下架
                 </a-button>
               </a-popconfirm>
             </template>

             <!-- 上架操作 (状态为 2 时显示) -->
             <template v-if="record.status === '2'">
               <a-popconfirm
                 title="确定重新上架该拾物信息吗？"
                 ok-text="是"
                 cancel-text="否"
                 @confirm="updateFoundThingStatus(record, '1')"
               >
                 <a-button type="primary" size="small" style="background-color: #52c41a; border-color: #52c41a;">
                   <template #icon><ArrowUpOutlined /></template> <!-- 修改图标 -->
                   上架
                 </a-button>
               </a-popconfirm>
             </template>

             <!-- 删除按钮 (保持不变) -->
             <a-popconfirm
               title="确定删除该拾物信息?"
               ok-text="是"
               cancel-text="否"
               @confirm="deleteFoundThing(record)"
             >
               <a-button type="primary" danger size="small">
                 <template #icon><DeleteOutlined /></template>
                 删除
               </a-button>
             </a-popconfirm>
           </a-space>
        </template>
      </template>
    </a-table>
  </div>

  <!-- 可能需要的模态框，例如编辑/详情模态框 -->
  <!-- <a-modal ... /> -->

  <!-- 新增：拒绝理由输入模态框 -->
  <a-modal
    v-model:visible="rejectModal.visible"
    title="输入拒绝理由"
    ok-text="确认拒绝"
    cancel-text="取消"
    @ok="confirmReject"
    @cancel="cancelReject"
    :confirm-loading="rejectModal.loading"
  >
    <a-textarea
      v-model:value="rejectModal.reason"
      placeholder="请输入拒绝审核的理由..."
      :rows="4"
    />
  </a-modal>

</template>

<script setup lang="ts">
// --- 导入必要的 API 和组件 ---
// 修改：导入 admin API
import { listApi, deleteApi, updateApi } from '/@/api/admin/thing';
import { message, SelectProps, Modal } from 'ant-design-vue'; // 导入 Modal
import type { ColumnType } from 'ant-design-vue/es/table';
import { ref, reactive, onMounted } from 'vue';
import { debounce } from 'lodash-es';
// 修改：导入所需图标
import { ReloadOutlined, FileImageOutlined, EyeOutlined, DeleteOutlined, CheckOutlined, TagOutlined, DownOutlined, CloseOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';

// --- 响应式数据 ---
const keyword = ref('');
const filterStatus = ref<string>(''); // 默认不过滤状态

const data = reactive({
  foundThingList: [], // 存储拾物列表数据
  loading: false,
  pageSize: 10,
  page: 1,
  total: 0, // 总数，用于分页
});

// 新增：拒绝理由模态框状态
const rejectModal = reactive({
  visible: false,
  loading: false,
  reason: '',
  currentRecord: null as any | null, // 存储当前要拒绝的记录
});

// --- 表格列定义 (调整字段和 key) ---
const columns: ColumnType<any>[] = reactive([
  { title: '序号', dataIndex: 'index', key: 'index', align: 'center', width: 80 },
  { title: '图片', dataIndex: 'cover', key: 'cover', align: 'center', width: 100 },
  { title: '物品名称', dataIndex: 'title', key: 'title', align: 'center' },
  { title: '拾取地点', dataIndex: 'location', key: 'location', align: 'center' },
  // { title: '拾取时间', dataIndex: 'found_time', key: 'found_time', align: 'center' }, // 后端若无此字段可移除
  { title: '发布者', key: 'username', align: 'center' }, // 使用 key 匹配 template
  { title: '状态', dataIndex: 'status', key: 'status', align: 'center', width: 100 },
  { title: '操作', key: 'operation', align: 'center', fixed: 'right', width: 200 }, // 调整宽度
]);

// --- 方法 ---

// 获取拾物列表
const getFoundThingList = (params: { keyword?: string; status?: string } = {}) => {
  data.loading = true;
  const apiParams: Record<string, any> = {
    page: data.page,
    pageSize: data.pageSize,
    keyword: params.keyword !== undefined ? params.keyword : keyword.value,
    type: 'found', // *** 关键：指定类型为拾物 ***
  };
  if (params.status !== undefined && params.status !== '') {
    apiParams.status = params.status;
  } else if (filterStatus.value !== '') {
     apiParams.status = filterStatus.value;
  }

  console.log("Fetching found things with params:", apiParams);
  // --- 调用实际 API ---
  listApi(apiParams).then(res => { // 使用 listApi
    data.loading = false;
    // 假设后端返回的数据结构与失物类似，包含 user 对象
    data.foundThingList = res.data.map((item, index) => ({
        ...item,
        index: (data.page - 1) * data.pageSize + index + 1
    }));
    // data.total = res.total; // 假设后端返回总数
    // 模拟总数，如果后端没返回
    data.total = data.foundThingList.length; // 或者根据实际情况调整
    console.log("Found things data:", data.foundThingList);
  }).catch(err => {
    data.loading = false;
    console.error(err);
    message.error(err.msg || '获取拾物列表失败');
  });
  // --- API 调用结束 ---
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
  // 这里可以打开一个模态框显示更详细的信息
  // 例如，使用 Modal.info() 或自定义模态框
  Modal.info({
      title: '拾物详情',
      content: `
          <p><strong>ID:</strong> ${record.id}</p>
          <p><strong>名称:</strong> ${record.title}</p>
          <p><strong>地区:</strong> ${record.location}</p>
          <p><strong>详细地点:</strong> ${record.detail_location || '无'}</p>
          <p><strong>描述:</strong> ${record.description || '无'}</p>
          <p><strong>发布者:</strong> ${record.user?.username || 'N/A'}</p>
          <p><strong>联系方式:</strong> ${record.mobile || '未提供'}</p>
          <p><strong>状态:</strong> ${getStatusText(record.status)}</p>
          ${record.cover ? `<img src="${record.cover}" style="max-width: 100%; margin-top: 10px;" />` : ''}
      `,
      width: 600,
      okText: '关闭',
  });
  // message.info("查看详情功能待实现");
};

// 删除拾物信息
const deleteFoundThing = (record: any) => {
  console.log("删除:", record);
  // --- 调用实际 API ---
  deleteApi({ id: record.id }).then(res => { // 使用 deleteApi
    message.success('删除成功');
    getFoundThingList(); // 刷新列表
  }).catch(err => {
    console.error(err);
    message.error(err.msg || '删除失败');
  });
  // --- API 调用结束 ---
};

// 修改：更新拾物状态 (处理审核、上架、下架)
const updateFoundThingStatus = (record: any, targetStatus: '1' | '2', reason?: string) => {
  let actionText = '';
  if (record.status === '0' && targetStatus === '1') actionText = '通过审核';
  else if (record.status === '0' && targetStatus === '2') actionText = '拒绝审核';
  else if (record.status === '1' && targetStatus === '2') actionText = '下架';
  else if (record.status === '2' && targetStatus === '1') actionText = '上架';
  else {
    console.warn('无效的状态转换:', record.status, '->', targetStatus);
    return;
  }

  const formData = new FormData();
  formData.append('id', record.id);
  formData.append('status', targetStatus);
  formData.append('type', 'found'); // 新增：添加类型参数
  // 如果是拒绝审核，添加理由
  if (record.status === '0' && targetStatus === '2' && reason) {
    formData.append('comment', reason); // 假设后端接收拒绝理由的字段是 'comment'
  }

  // 显示加载状态（如果是从拒绝模态框触发）
  if (rejectModal.visible) rejectModal.loading = true;

  updateApi({ id: record.id }, formData) // 使用 updateApi
    .then((res) => {
      message.success(`操作成功：${actionText}`);
      getFoundThingList(); // 刷新列表
      if (rejectModal.visible) cancelReject(); // 关闭拒绝模态框
    })
    .catch((err) => {
      console.error(err);
      message.error(`${actionText}操作失败: ${err.msg || ''}`);
    })
    .finally(() => {
      if (rejectModal.visible) rejectModal.loading = false; // 结束加载状态
    });
};

// 新增：显示拒绝理由模态框
const showRejectModal = (record: any) => {
  rejectModal.currentRecord = record;
  rejectModal.reason = ''; // 清空上次的理由
  rejectModal.visible = true;
};

// 新增：确认拒绝操作
const confirmReject = () => {
  if (!rejectModal.reason.trim()) {
    message.warning('请输入拒绝理由');
    return;
  }
  if (rejectModal.currentRecord) {
    // 调用 updateFoundThingStatus 并传入拒绝理由
    updateFoundThingStatus(rejectModal.currentRecord, '2', rejectModal.reason.trim());
  }
};

// 新增：取消拒绝操作
const cancelReject = () => {
  rejectModal.visible = false;
  rejectModal.loading = false;
  rejectModal.currentRecord = null;
  rejectModal.reason = '';
};

// 新增：处理审核下拉菜单点击事件
const handleAuditMenuClick = (key: string, record: any) => {
  if (key === 'approve') {
    Modal.confirm({
      title: '确定通过审核吗？',
      content: '通过后物品将变为“已上架”状态。',
      okText: '是',
      cancelText: '否',
      onOk: () => {
        updateFoundThingStatus(record, '1'); // 通过审核，状态变为 1
      },
    });
  } else if (key === 'reject') {
    showRejectModal(record); // 显示拒绝理由输入框
  }
};


// 修改：根据状态值返回 Tag 颜色 (匹配 thing.vue)
const getStatusColor = (status: string) => {
  switch (status) {
    case '0': return 'orange'; // 待审核 - 橙色
    case '1': return 'success'; // 已上架 - 绿色
    case '2': return 'red';     // 已下架 - 红色
    default: return 'default';
  }
};

// 修改：根据状态值返回 Tag 文本 (匹配 thing.vue)
const getStatusText = (status: string) => {
  switch (status) {
    case '0': return '待审核';
    case '1': return '已上架';
    case '2': return '已下架';
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
    background-color: #e6f7ff; // 浅蓝色表头
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

/* 调整操作按钮样式 */
:deep(.ant-table-cell .ant-btn[style*="background-color: #52c41a"]) { // 标记认领
  &:hover, &:focus {
    background-color: #73d13d !important;
    border-color: #73d13d !important;
  }
}
/* 新增：审核下拉按钮样式 (复制自 thing.vue) */
.audit-dropdown-button {
  border-color: #1890ff; // 蓝色边框
  color: #1890ff; // 蓝色文字
  background-color: #e6f7ff; // 浅蓝色背景
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); // 平滑过渡效果

  &:hover {
    border-color: #40a9ff;
    color: #fff; // 白色文字
    background-color: #1890ff; // 深蓝色背景
    transform: translateY(-2px); // 轻微上移
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2); // 添加阴影
  }

  &:active {
    transform: translateY(0); // 点击时恢复原位
    background-color: #096dd9; // 更深的蓝色背景
    border-color: #096dd9;
    box-shadow: none; // 移除阴影
  }

  // 图标颜色也跟随变化
  .anticon {
    transition: color 0.3s;
  }
  &:hover .anticon {
    color: #fff;
  }
}

/* 新增：审核下拉菜单项样式 (复制自 thing.vue) */
:deep(.ant-dropdown-menu .ant-dropdown-menu-item.audit-menu-item) {
  transition: background-color 0.2s ease, color 0.2s ease;

  .anticon {
    margin-right: 8px;
    transition: transform 0.2s ease;
  }

  &:hover {
    background-color: #f0f0f0;

    .anticon {
       transform: scale(1.1);
    }
  }

  &.approve {
    color: #52c41a; // 默认文字绿色
    .anticon { color: #52c41a; }
    &:hover {
      background-color: #f6ffed; // 悬停背景浅绿
      color: #52c41a; // 悬停文字绿色
    }
  }
  &.reject {
    color: #ff4d4f; // 默认文字红色
    .anticon { color: #ff4d4f; }
    &:hover {
      background-color: #fff1f0; // 悬停背景浅红
      color: #ff4d4f; // 悬停文字红色
    }
  }
}

/* 调整操作按钮样式 (复制自 thing.vue) */
:deep(.ant-table-cell .ant-btn[style*="background-color: #52c41a"]) { // 上架按钮
  &:hover, &:focus {
    background-color: #73d13d !important;
    border-color: #73d13d !important;
  }
}
/* 移除旧的标记处理按钮样式 */
/*
:deep(.ant-table-cell .ant-btn[style*="background-color: #faad14"]) { // 标记处理
  &:hover, &:focus {
    background-color: #ffc53d !important;
    border-color: #ffc53d !important;
  }
}
*/
</style>
