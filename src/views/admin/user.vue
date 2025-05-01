<template>
  <div class="user-management-container">
    <!-- 搜索框 -->
    <div class="table-operations">
      <!-- 移除外层 search-container -->
      <!-- 修改 a-space，添加 align="center" -->
      <a-space size="middle" align="center">
        <!-- 用户名标签移到 a-space 内部 -->
        <div class="search-label">
          <span>用户名</span>
          <span style="margin-left: 4px;">🔍</span>
        </div>
        <!-- 输入框 -->
        <a-input-search
          placeholder="输入用户名搜索"
          enter-button="查询"
          allowClear
          @search="onSearch"
          @input="handleSearchInput"
          v-model:value="keyword"
          class="custom-search-input"
          style="width: 300px"
        />
        <!-- 新增：状态筛选框 -->
        <a-select
          v-model:value="filterStatus"
          placeholder="筛选状态"
          style="width: 120px; margin-left: 8px;"
          @change="handleFilterChange"
          allowClear
        >
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="0">正常</a-select-option>
          <a-select-option value="1">封号</a-select-option>
        </a-select>
        <!-- 新增：刷新按钮 -->
        <a-button @click="getUserList()" class="refresh-button">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
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
            <!-- 修改：使用 danger 按钮并添加图标 -->
            <a-button type="primary" danger size="small">
              <template #icon><StopOutlined /></template>
              禁用
            </a-button>
          </a-popconfirm>
          <a-popconfirm
            v-else
            title="确定解除禁用该用户?"
            ok-text="是"
            cancel-text="否"
            @confirm="enableUser(record)"
          >
            <!-- 修改：使用 primary 按钮并添加图标 -->
            <a-button type="primary" size="small">
              <template #icon><CheckCircleOutlined /></template>
              解除禁用
            </a-button>
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
import { message, SelectProps } from 'ant-design-vue'; // 引入 SelectProps (如果需要更强的类型定义)
import type { ColumnType } from 'ant-design-vue/es/table';
import { ref, reactive, onMounted } from 'vue';
import { debounce } from 'lodash-es';
// 引入图标
import { UserOutlined, ReloadOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';

// 移除了 searchMode ref
// const searchMode = ref<'username' | 'nickname'>('username');
// 关键词
const keyword = ref('');
// 新增：筛选状态 ref，初始为 '全部'
const filterStatus = ref<string>(''); // 使用空字符串代表全部

// 防抖处理（500ms延迟）
const handleSearchInput = debounce(() => {
  onSearch(); // 防抖触发时也进行搜索
}, 500);

// 执行搜索 (包含关键词和状态)
const onSearch = () => {
  getUserList({
    keyword: keyword.value,
    status: filterStatus.value, // 传递当前状态
  });
};

// 新增：处理筛选状态变化
const handleFilterChange = () => {
  getUserList({
    keyword: keyword.value, // 保留当前关键词
    status: filterStatus.value, // 传递新的状态
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
  // 初始加载也包含状态筛选
  getUserList({ status: filterStatus.value });
});

// 修改：getUserList 接受 status 参数
const getUserList = (params: { keyword?: string; status?: string } = {}) => {
  data.loading = true;
  // 准备传递给 API 的参数
  const apiParams: Record<string, any> = {
    keyword: params.keyword !== undefined ? params.keyword : keyword.value, // 使用传入的或当前的 keyword
  };
  // 只有当 status 不是空字符串时才添加到参数中
  if (params.status !== undefined && params.status !== '') {
    apiParams.status = params.status;
  } else if (filterStatus.value !== '') { // 如果函数调用没传status，但全局filterStatus有值
     apiParams.status = filterStatus.value;
  }


  listApi(apiParams) // 传递处理后的参数
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
      // 可以添加错误提示
      message.error('获取用户列表失败');
    });
};

const disableUser = (record: any) => {
  const formData = new FormData();
  formData.append('id', record.id);
  formData.append('role', '1'); // 修改：设置角色为管理员 (或者保持原角色不变，仅修改状态)
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
  /* 可选：如果希望标签与输入框左对齐，移除或注释掉 align-items: center */
  /* align-items: center; */
  /* 确保垂直居中 */
  align-items: center;
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
    border-radius: 10px; /* 新增：为按钮添加圆角 */
  }
}

/* 移除了 .custom-radio-group 样式 */

/* 移除 .search-container 样式 */
/* .search-container { ... } */

/* 修改：用户名标签样式 */
.search-label {
  display: inline-flex; /* 使其宽度自适应内容 */
  align-items: center; /* 垂直居中 */
  padding: 4px 10px; /* 内边距 */
  background-color: #ff7e5f; /* 橙色背景 (与按钮颜色一致) */
  color: #fff; /* 白色文字 */
  border-radius: 12px; /* 圆角 */
  font-size: 12px; /* 字体大小 */
  /* 移除 margin-top */
  /* margin-top: 8px; */
  margin-right: 8px; /* 添加右边距 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* 可选：添加轻微阴影 */
  /* 确保高度与输入框协调 */
  height: 32px; /* 与输入框高度一致 */
  box-sizing: border-box; /* 包含 padding 和 border */
}

/* 自定义 Input Search 样式 */
.custom-search-input {
  :deep(.ant-input) {
    /* 移除输入框本身的圆角设置，由 wrapper 控制 */
    /* border-radius: 6px 0 0 6px !important; */
    border-color: #e0e0e0;
    height: 32px;
    &:focus, &:hover {
       border-color: #1890ff;
       box-shadow: none;
    }
    /* 确保输入框右侧没有边框，避免与按钮重叠 */
    border-right: none;
  }
  :deep(.ant-input-search-button) {
    border-radius: 0 6px 6px 0 !important; /* 修改：设置按钮右侧圆角 */
    background-color: #ff7e5f;
    border-color: #ff7e5f;
    color: #fff;
    height: 32px;
    transition: all 0.3s;
    /* 确保按钮左侧没有边框 */
    border-left: none;

    &:hover {
      background-color: #feb47b;
      border-color: #feb47b;
    }
  }
  :deep(.ant-input-group-addon) {
     display: none;
  }
   :deep(.ant-input-affix-wrapper) {
     border-radius: 6px 0 0 6px !important; /* 修改：设置 wrapper 左侧圆角 */
     border-color: #e0e0e0;
     /* 确保 wrapper 右侧没有边框 */
     border-right: none;
     &:focus-within, &:hover {
        border-color: #1890ff !important;
        box-shadow: none;
        /* 确保 focus/hover 时右侧边框也不显示 */
        border-right: none !important;
        /* 使用 z-index 确保 wrapper 在按钮下方，避免边框覆盖 */
        z-index: 1;
     }
   }
   /* 整体设置圆角，覆盖内部元素的具体设置 */
   border-radius: 18px;
   overflow: hidden; /* 确保子元素的角被裁剪 */
   display: inline-flex; /* 使其表现像一个整体 */
   border: 2px solid #e0e0e0; /* 添加外部边框 */

   &:hover, &:focus-within {
      border-color: #1890ff; /* 整体 hover/focus 边框颜色 */
   }

   /* 覆盖内部元素的边框，因为外部已经有边框了 */
   :deep(.ant-input-affix-wrapper),
   :deep(.ant-input-search-button) {
       border: none !important;
   }
   /* 调整按钮的 z-index，确保在 focus 时边框正确显示 */
    :deep(.ant-input-search-button) {
        position: relative;
        z-index: 2;
    }
}

/* 新增：刷新按钮样式 */
.refresh-button {
  margin-left: 8px; /* 添加左边距 */
  border-radius: 6px; /* 与输入框按钮协调 */
  border: none; /* 移除边框 */
  background-color: #40a9ff; /* 设置背景色 (Ant Design 主蓝色) */
  color: #fff; /* 设置文字颜色为白色 */
  transition: background-color 0.3s; /* 添加过渡效果 */

  &:hover {
    background-color: #69c0ff; /* 设置悬停时的背景色 */
  }
}

/* 可以为 Select 组件添加一些样式调整 */
:deep(.ant-select) {
  /* 例如调整圆角使其与其他组件协调 */
  .ant-select-selector {
    border-radius: 6px !important;
  }
}
</style>
