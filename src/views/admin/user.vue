<template>
  <div>
    <!-- 搜索框 -->
    <div class="table-operations">
      <a-space>
      <!-- 搜索模式切换 -->
      <a-radio-group v-model:value="searchMode" button-style="solid">
        <a-radio-button value="username">用户名</a-radio-button>
        <a-radio-button value="nickname">昵称</a-radio-button>
      </a-radio-group>

      <!-- 搜索框 -->
      <a-input-search 
        :addon-before="searchMode === 'username' ? '用户名' : '昵称'"
        enter-button 
        @search="onSearch"
        @input="handleSearchInput"
        v-model:value="keyword"
      />
    </a-space>
    </div>

    <!-- 用户表格 -->
    <a-table
      size="middle"
      rowKey="id"
      :loading="data.loading"
      :columns="columns"
      :data-source="data.userList"
      :pagination="{
        size: 'default',
        current: data.page,
        pageSize: data.pageSize,
        onChange: (current) => (data.page = current),
        showSizeChanger: false,
        showTotal: (total) => `共${total}条数据`,
      }"
    >
      <template #bodyCell="{ text, record, index, column }">
        <template v-if="column.key === 'operation'">
          <a-popconfirm
            v-if="record.status === '0'"
            title="确定禁用该用户?"
            ok-text="是"
            cancel-text="否"
            @confirm="disableUser(record)"
          >
            <a href="#">禁用</a>
          </a-popconfirm>
          <a-popconfirm
            v-else
            title="确定解除禁用该用户?"
            ok-text="是"
            cancel-text="否"
            @confirm="enableUser(record)"
          >
            <a href="#">解除禁用</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { listApi, updateApi } from '/@/api/admin/user';
import { message } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { ref, reactive } from 'vue';
import { debounce } from 'lodash-es';

// 搜索模式
const searchMode = ref<'username' | 'nickname'>('username');
// 关键词
const keyword = ref('');

// 防抖处理（500ms延迟）
const handleSearchInput = debounce(() => {
  onSearch();
}, 500);

// 执行搜索
const onSearch = () => {
  getUserList({
    searchType: searchMode.value,
    keyword: keyword.value,
  });
};

const columns: ColumnType<any>[] = reactive([
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    align: 'center',
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    align: 'center',
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
    align: 'center',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    align: 'center',
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    key: 'mobile',
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    customRender: ({ text }) => (text === '0' ? '正常' : '封号'),
  },
  {
    title: '操作',
    dataIndex: 'operation',
    key: 'operation',
    align: 'center',
  },
]);

const data = reactive({
  userList: [],
  loading: false,
  pageSize: 10,
  page: 1,
});

onMounted(() => {
  getUserList();
});

const getUserList = (params = {}) => {
  data.loading = true;
  listApi({ ...params, keyword: keyword.value })
    .then((res) => {
      data.loading = false;
      res.data.forEach((item: any, index: any) => {
        item.index = index + 1;
      });
      data.userList = res.data;
    })
    .catch((err) => {
      data.loading = false;
      console.error(err);
    });
};

const disableUser = (record: any) => {
  const formData = new FormData();
  formData.append('id', record.id);
  formData.append('role', '3'); // 设置角色为演示账号
  formData.append('status', '1'); // 设置状态为封号

  updateApi({ id: record.id }, formData)
    .then(() => {
      message.success('用户已禁用');
      getUserList();
    })
    .catch((err) => {
      console.error(err);
      message.error('操作失败');
    });
};

const enableUser = (record: any) => {
  const formData = new FormData();
  formData.append('id', record.id);
  formData.append('role', '2'); // 设置角色为普通用户
  formData.append('status', '0'); // 设置状态为正常

  updateApi({ id: record.id }, formData)
    .then(() => {
      message.success('用户已解除禁用');
      getUserList();
    })
    .catch((err) => {
      console.error(err);
      message.error('操作失败');
    });
};
</script>

<style scoped lang="less">
.table-operations {
  margin-bottom: 16px;
  text-align: right;
}

</style>
