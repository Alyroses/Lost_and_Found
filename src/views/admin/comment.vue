<template>
  <div>
    <!--页面区域-->
    <div class="management-container">
      <div class="table-operations">
        <a-button @click="handleBatchDelete" :disabled="data.selectedRowKeys.length === 0">批量删除</a-button>
      </div>
      <a-table
        size="middle"
        rowKey="id"
        :loading="data.loading"
        :columns="columns"
        :data-source="data.list"
        :scroll="{ x: 'max-content' }"
        :row-selection="rowSelection"
        :pagination="{
          size: 'default',
          current: data.page,
          pageSize: data.pageSize,
          onChange: (current) => (data.page = current),
          showSizeChanger: false,
          showTotal: (total) => `共${total}条数据`,
          style: { marginTop: '16px' }
        }"
        class="content-table"
      >
        <template #bodyCell="{ text, record, index, column }">
          <template v-if="column.key === 'user'">
            <a-space align="center">
              <a-avatar :src="record.user?.avatar || defaultAvatar" size="small" />
              <span>{{ record.user?.username || '未知用户' }}</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'content'">
            <a-tooltip :title="text">
              <div class="ellipsis-text">{{ text }}</div>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'parent_comment_id'">
            {{ text || 'N/A' }}
          </template>
          <template v-else-if="column.key === 'related_item'">
            <span v-if="record.object_id && record.item_type">
              {{ record.item_type === 'lost' ? '失物' : (record.item_type === 'found' ? '招领' : record.item_type) }}: {{ record.object_id }}
            </span>
            <span v-else>N/A</span>
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-space>
              <a-popconfirm title="确定删除?" ok-text="是" cancel-text="否" @confirm="confirmDelete(record)">
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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { message, Avatar as AAvatar, Space as ASpace, Tooltip as ATooltip } from 'ant-design-vue';
import { deleteApi, listApi } from '/@/api/admin/comment';
import { DeleteOutlined } from '@ant-design/icons-vue';
import defaultAvatar from '/@/assets/images/avatar.jpg'; // 引入默认头像

import type { ColumnsType } from 'ant-design-vue/es/table';

const columns: ColumnsType<any> = reactive([
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    align: 'center',
    width: 80,
  },
  {
    title: '用户',
    key: 'user', // Custom render key
    align: 'left',
    width: 180,
  },
  {
    title: '评论内容',
    dataIndex: 'content',
    key: 'content',
    align: 'left',
    ellipsis: true, // Will be handled by custom render with tooltip
  },
  {
    title: '关联物品',
    key: 'related_item', // Custom render key
    align: 'center',
    width: 150,
  },
  {
    title: '点赞数',
    dataIndex: 'like_count',
    key: 'like_count',
    align: 'center',
    width: 100,
  },
  {
    title: '父评论ID',
    dataIndex: 'parent_comment', // This is the parent_comment ID from API
    key: 'parent_comment_id',
    align: 'center',
    width: 120,
  },
  {
    title: '评论时间',
    dataIndex: 'comment_time',
    key: 'comment_time',
    align: 'center',
    width: 180,
    customRender: ({ text }) => text ? new Date(text).toLocaleString() : '-',
  },
  {
    title: '操作',
    key: 'operation',
    align: 'center',
    fixed: 'right',
    width: 120,
  },
]);

// 页面数据
const data = reactive({
  list: [] as any[],
  loading: false,
  selectedRowKeys: [] as any[],
  pageSize: 10,
  page: 1,
  total: 0, // For pagination total
});

onMounted(() => {
  getList();
});

const getList = () => {
  data.loading = true;
  listApi({
    // keyword: data.keyword, // If you have search
    page: data.page,
    pageSize: data.pageSize,
  })
    .then((res) => {
      if (res.code === 0 && res.data && Array.isArray(res.data.list)) {
        res.data.list.forEach((item: any, index: any) => {
          item.index = (data.page - 1) * data.pageSize + index + 1;
        });
        data.list = res.data.list;
        data.total = res.data.total || res.data.list.length; // Assuming API returns total count
      } else {
        data.list = [];
        data.total = 0;
        message.error(res.msg || '获取评论列表失败');
      }
    })
    .catch((err) => {
      message.error(err.msg || '请求评论列表失败');
      data.list = [];
      data.total = 0;
    })
    .finally(() => {
      data.loading = false;
    });
};

const rowSelection = ref({
  onChange: (selectedRowKeys: (string | number)[]) => {
    data.selectedRowKeys = selectedRowKeys;
  },
});

const confirmDelete = (record: any) => {
  deleteApi({ ids: record.id })
    .then((res) => {
      if (res.code === 0) {
        message.success('删除成功');
        getList();
      } else {
        message.error(res.msg || '删除失败');
      }
    })
    .catch((err) => {
      message.error(err.msg || '操作失败');
    });
};

const handleBatchDelete = () => {
  if (data.selectedRowKeys.length === 0) {
    message.warn('请勾选需要删除的项');
    return;
  }
  deleteApi({ ids: data.selectedRowKeys.join(',') })
    .then((res) => {
      if (res.code === 0) {
        message.success('批量删除成功');
        data.selectedRowKeys = [];
        getList();
      } else {
        message.error(res.msg || '批量删除失败');
      }
    })
    .catch((err) => {
      message.error(err.msg || '操作失败');
    });
};
</script>

<style scoped lang="less">
.management-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.table-operations {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.content-table {
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  :deep(.ant-table-thead > tr > th) {
    background-color: #fffaf5;
    font-weight: 600;
    color: #333;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 12px 16px;
    .ant-btn-primary.ant-btn-sm { // For primary small buttons like Edit/Delete
      border-radius: 10px;
    }
  }
  .ellipsis-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px; /* Adjust as needed */
  }
}
</style>
