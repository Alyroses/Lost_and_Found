<template>
  <div class="user-management-container">
    <!-- 搜索框 -->
    <div class="table-operations">
      <a-space size="middle"> <!-- 增加间距 -->
        <!-- 搜索模式切换 -->
        <!-- 添加自定义 class -->
        <a-radio-group v-model:value="searchMode" button-style="solid" class="custom-radio-group">
          <a-radio-button value="username">用户名</a-radio-button>
          <a-radio-button value="nickname">昵称</a-radio-button>
        </a-radio-group>

        <!-- 搜索框 -->
        <!-- 添加自定义 class -->
        <a-input-search
          :placeholder="searchMode === 'username' ? '输入用户名搜索' : '输入昵称搜索'"
          enter-button="查询" 
          allowClear
          @search="onSearch"
          @input="handleSearchInput"
          v-model:value="keyword"
          class="custom-search-input"
          style="width: 300px"
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
        style: { marginTop: '16px' } // 添加分页器上边距
      }"
      class="user-table"
    >
      <template #bodyCell="{ text, record, index, column }">
        <!-- 新增：头像列渲染 -->
        <template v-if="column.key === 'avatar'">
          <a-avatar :src="record.avatar" size="large">
            <!-- 可以添加默认头像或文字头像 -->
            <template #icon><UserOutlined /></template>
          </a-avatar>
        </template>
        <!-- 修改：操作列渲染 -->
        <template v-else-if="column.key === 'operation'">
          <a-popconfirm
            v-if="record.status === '0'"
            title="确定禁用该用户?"
            ok-text="是"
            cancel-text="否"
            @confirm="disableUser(record)"
          >
            <!-- 修改：使用 danger 按钮 -->
            <a-button type="primary" danger size="small">禁用</a-button>
          </a-popconfirm>
          <a-popconfirm
            v-else
            title="确定解除禁用该用户?"
            ok-text="是"
            cancel-text="否"
            @confirm="enableUser(record)"
          >
            <!-- 修改：使用 primary 或 default 按钮 -->
            <a-button type="primary" size="small">解除禁用</a-button>
          </a-popconfirm>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="text === '0' ? 'green' : 'red'">
            {{ text === '0' ? '正常' : '封号' }}
          </a-tag>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { listApi, updateApi } from '/@/api/admin/user';
import { message } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { ref, reactive, onMounted } from 'vue';
import { debounce } from 'lodash-es';
import { UserOutlined } from '@ant-design/icons-vue'; // 引入图标

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
    width: 80, // 指定宽度
  },
  // 新增：头像列
  {
    title: '头像',
    dataIndex: 'avatar',
    key: 'avatar',
    align: 'center',
    width: 100, // 指定宽度
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
    width: 100, // 指定宽度
    // customRender 已移至 template #bodyCell
  },
  {
    title: '操作',
    dataIndex: 'operation',
    key: 'operation',
    align: 'center',
    width: 120, // 指定宽度
    // customRender 已移至 template #bodyCell
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
.user-management-container {
  padding: 20px; // 添加容器内边距
  background-color: #fff; // 设置背景色
  border-radius: 8px; // 添加圆角
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); // 添加阴影
}

.table-operations {
  margin-bottom: 24px; // 增加搜索区域和表格的间距
  display: flex; // 使用 flex 布局
  justify-content: flex-start; // 左对齐
  align-items: center; // 垂直居中对齐
}

.user-table {
  // 可以为表格添加一些样式，例如边框
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  // 调整表头样式
  :deep(.ant-table-thead > tr > th) {
    background-color: #fffaf5; // 匹配 Sider 背景色
    font-weight: 600;
    color: #333; // 表头文字颜色
  }

  // 调整单元格内边距
  :deep(.ant-table-tbody > tr > td) {
    padding: 12px 16px;
  }

  // 头像样式
  :deep(.ant-avatar) {
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
}

// 操作按钮间距
:deep(.ant-table-cell) {
  .ant-btn {
    margin: 0 4px; // 给按钮之间添加一些间距
  }
}

/* 自定义 Radio Group 样式 */
.custom-radio-group {
  :deep(.ant-radio-button-wrapper) {
    border-radius: 16px !important; // 设置圆角
    border: 1px solid #e0e0e0; // 统一边框颜色
    color: #555; // 默认文字颜色
    background-color: #fff; // 默认背景
    transition: all 0.3s; // 添加过渡效果

    &:first-child {
      border-radius: 16px 0 0 16px !important; // 左侧按钮圆角
    }
    &:last-child {
      border-radius: 0 16px 16px 0 !important; // 右侧按钮圆角
    }
    &:not(:first-child)::before {
       display: none; // 移除按钮间的分割线
    }

    &:hover {
      // 修改 hover 颜色
      color: #feb47b; // 登录按钮渐变色之二
      border-color: #feb47b;
    }
  }

  :deep(.ant-radio-button-wrapper-checked) {
    // 修改选中背景色和边框色
    background-color: #ff7e5f; // 登录按钮渐变色之一
    border-color: #ff7e5f !important; // 选中边框色
    color: #fff !important; // 选中文字颜色
    box-shadow: -1px 0 0 0 #ff7e5f; // 覆盖阴影

     &:hover {
       color: #fff !important;
       // 修改选中 hover 颜色
       border-color: #feb47b !important;
       background-color: #feb47b;
     }
  }
}

/* 自定义 Input Search 样式 */
.custom-search-input {
  :deep(.ant-input) {
    border-radius: 16px 0 0 16px !important; // 输入框左侧圆角
    border-color: #e0e0e0; // 统一边框颜色
    height: 32px; // 保持与 radio 一致的高度
    &:focus, &:hover {
       border-color: #1890ff; // 保持 Antd 默认的 focus 蓝色
       box-shadow: none; // 移除默认的 focus 阴影
    }
  }
  :deep(.ant-input-search-button) {
    border-radius: 0 16px 16px 0 !important; // 按钮右侧圆角
    // 修改按钮背景色和边框色
    background-color: #ff7e5f; // 登录按钮渐变色之一
    border-color: #ff7e5f; // 按钮边框色
    color: #fff; // 按钮文字颜色
    height: 32px; // 保持与 radio 一致的高度
    transition: all 0.3s;

    &:hover {
      // 修改按钮 hover 颜色
      background-color: #feb47b; // 登录按钮渐变色之二
      border-color: #feb47b;
    }
  }
  // 移除输入框和按钮之间的边框
  :deep(.ant-input-group-addon) {
     display: none;
  }
   :deep(.ant-input-affix-wrapper) {
     border-radius: 16px 0 0 16px !important; // 确保清除按钮的 wrapper 也有圆角
   }
}
</style>
