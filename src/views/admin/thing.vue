<template>
  <div class="thing-management-container"> <!-- 修改容器 class -->
    <!--页面区域-->
    <div class="page-view">
      <!-- 修改：参考 user.vue 的搜索和操作区域 -->
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
           <!-- 状态筛选框 -->
           <a-select
             v-model:value="filterStatus"
             placeholder="筛选状态"
             style="width: 120px; margin-left: 8px;"
             @change="handleFilterChange"
             allowClear
           >
             <a-select-option value="">全部</a-select-option>
             <a-select-option value="0">未审核</a-select-option>
             <a-select-option value="1">已上架</a-select-option>
             <a-select-option value="2">已下架</a-select-option>
           </a-select>
           <!-- 刷新按钮 -->
           <a-button @click="getDataList()" class="refresh-button">
             <template #icon><ReloadOutlined /></template>
             刷新
           </a-button>
           <!-- 保留新增和批量删除按钮 -->

           <a-button @click="handleBatchDelete" danger>批量删除</a-button>
        </a-space>
      </div>
      <!-- 修改：添加 class="thing-table" -->
      <a-table
        size="middle"
        rowKey="id"
        :loading="data.loading"
        :columns="columns as import('ant-design-vue').TableColumnsType"
        :data-source="data.dataList"
        :scroll="{ x: 'max-content' }"
        :row-selection="rowSelection"
        :pagination="{
            size: 'default',
            current: data.page,
            pageSize: data.pageSize,
            onChange: (current) => (data.page = current),
            showSizeChanger: false,
            showTotal: (total) => `共${total}条数据`,
            style: { marginTop: '16px' } // 添加分页器上边距
          }"
        class="thing-table"
      >
        <template #bodyCell="{ text, record, index, column }">
          <!-- 新增：图片列渲染 -->
          <template v-if="column.key === 'cover'">
            <a-avatar :src="record.cover" shape="square" :size="64">
              <template #icon><FileImageOutlined /></template>
            </a-avatar>
          </template>
          <!-- 新增：发布者列渲染 -->
          <template v-else-if="column.key === 'username'">
            <span>{{ record.user?.username || 'N/A' }}</span>
          </template>
          <!-- 修改：状态列渲染 -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusTagColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <!-- 修改：操作列渲染 -->
          <template v-else-if="column.key === 'operation'">
            <a-space size="small">
              <!-- 查看详情按钮 (保持不变) -->
              <a-button type="primary" size="small" @click="handleViewDetail(record)">
                <template #icon><EyeOutlined /></template>
                详情
              </a-button>

              <!-- 修改：审核操作 (状态为 0 时显示) -->
              <template v-if="record.status === '0'">
                 <a-dropdown :trigger="['hover']"> <!-- 修改 trigger 为 hover -->
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
                   <!-- 添加 class="audit-dropdown-button" -->
                   <a-button size="small" class="audit-dropdown-button">
                     审核 <DownOutlined />
                   </a-button>
                 </a-dropdown>
              </template>

              <!-- 下架操作 (状态为 1 时显示) -->
              <template v-if="record.status === '1'">
                <a-popconfirm
                  title="确定下架该物品吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="updateThingStatus(record, '2')"
                >
                  <a-button type="primary" danger size="small">
                    <template #icon><ArrowDownOutlined /></template>
                    下架
                  </a-button>
                </a-popconfirm>
              </template>

              <!-- 上架操作 (状态为 2 时显示) -->
              <template v-if="record.status === '2'">
                <a-popconfirm
                  title="确定重新上架该物品吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="updateThingStatus(record, '1')"
                >
                  <a-button type="primary" size="small" style="background-color: #52c41a; border-color: #52c41a;">
                    <template #icon><ArrowUpOutlined /></template>
                    上架
                  </a-button>
                </a-popconfirm>
              </template>

            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 查看/编辑详情弹窗区域 -->
    <div>
      <!-- 修改：调整 Modal 样式，添加 :ok-button-props 和 :cancel-button-props -->
      <a-modal
        :visible="modal.visile"
        :forceRender="true"
        :title="modal.title"
        width="880px"
        :ok-text="modal.mode === 'view' ? '' : '确认'"
        :cancel-text="modal.mode === 'view' ? '关闭' : '取消'"
        @cancel="handleCancel"
        @ok="handleOk"
        wrapClassName="thing-detail-modal"
        :ok-button-props="{ style: { display: modal.mode === 'view' ? 'none' : '' } }"
      >
        <!-- 修改：添加 modal-body 类 -->
        <div class="modal-body">
          <!-- 修改：绑定 disabled 属性 -->
          <a-form ref="myform" :label-col="{ style: { width: '80px' } }" :model="modal.form" :rules="modal.rules">
            <a-row :gutter="24">
              <a-col span="24">
                <a-form-item label="寻物标题" name="title">
                  <a-input placeholder="请输入" v-model:value="modal.form.title" :disabled="modal.mode === 'view'" />
                </a-form-item>
              </a-col>
              <!-- 新增：发布者 (只读) -->
              <a-col span="12">
                 <a-form-item label="发布者">
                   <span class="form-item-readonly-text">{{ modal.form.user?.username || 'N/A' }}</span>
                 </a-form-item>
              </a-col>
              <!-- 新增：地区 (只读) -->
              <a-col span="12">
                 <a-form-item label="丢失地区">
                   <span class="form-item-readonly-text">{{ modal.form.location || '未填写' }}</span>
                 </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="物品分类" name="classification">
                  <a-select placeholder="请选择" allowClear :options="modal.cData"
                    :field-names="{ label: 'title', value: 'id' }" v-model:value="modal.form.classification" :disabled="modal.mode === 'view'" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="标签">
                  <a-select mode="multiple" placeholder="请选择" allowClear v-model:value="modal.form.tag" :disabled="modal.mode === 'view'">
                    <template v-for="item in modal.tagData">
                      <a-select-option :value="item.id">{{ item.title }}</a-select-option>
                    </template>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col span="24">
                <a-form-item label="照片">
                  <!-- 修改：根据模式显示上传器或图片 -->
                  <template v-if="modal.mode === 'edit'">
                    <a-upload-dragger name="file" accept="image/*" :multiple="false" :before-upload="handleBeforeUpload"
                      v-model:file-list="fileList">
                      <p class="ant-upload-drag-icon">
                        <template v-if="modal.form.coverUrl">
                          <img :src="modal.form.coverUrl" style="width: 60px; height: 80px" />
                        </template>
                        <template v-else>
                          <file-image-outlined />
                        </template>
                      </p>
                      <p class="ant-upload-text"> 请选择要上传的图片 </p>
                    </a-upload-dragger>
                  </template>
                  <template v-else>
                     <div v-if="modal.form.coverUrl" class="image-preview-container">
                       <a-image :width="100" :src="modal.form.coverUrl" />
                     </div>
                     <span v-else class="form-item-readonly-text">无照片</span>
                  </template>
                </a-form-item>
              </a-col>

              <a-col span="24">
                <a-form-item label="物品简介">
                  <a-textarea placeholder="请输入" v-model:value="modal.form.description" :disabled="modal.mode === 'view'" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="奖励积分" name="price">
                  <!-- 修改：查看模式下显示文本 -->
                  <a-input-number v-if="modal.mode === 'edit'" placeholder="请输入" :min="0" v-model:value="modal.form.price" style="width: 100%" />
                  <span v-else class="form-item-readonly-text">{{ modal.form.price !== undefined ? modal.form.price + ' 积分' : '未设置' }}</span>
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="联系号码">
                  <a-input-number v-if="modal.mode === 'edit'" placeholder="请输入" :min="0" v-model:value="modal.form.mobile" style="width: 100%" />
                   <span v-else class="form-item-readonly-text">{{ modal.form.mobile || '未提供' }}</span>
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="丢失地区">
                   <!-- 修改：查看模式下显示文本 -->
                   <el-cascader v-if="modal.mode === 'edit'" :options="modal.regionDatas" v-model="selectedOptions" placeholder="请选择"
                     @change="handleChange"></el-cascader>
                   <span v-else class="form-item-readonly-text">{{ modal.form.location || '未填写' }}</span>
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="详细地址">
                   <a-input v-if="modal.mode === 'edit'" placeholder="请输入详细地址" v-model:value="modal.form.detail_location" />
                   <span v-else class="form-item-readonly-text">{{ modal.form.detail_location || '未填写' }}</span>
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="状态" name="status">
                   <!-- 使用辅助函数显示状态文本 -->
                   <span class="form-item-readonly-text">{{ getStatusText(modal.form.status) }}</span>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-modal>
    </div>

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

  </div>
</template>

<script setup lang="ts">

// Define the handleBeforeUpload method
const handleBeforeUpload = (file: File) => {
  console.log('File before upload:', file);
  // Add any validation or processing logic here
  return true; // Return true to proceed with the upload
};
// --- 导入 ---
// 修改：导入 EyeOutlined, DeleteOutlined
import { FileImageOutlined, ReloadOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons-vue'; // 导入图标
import { FormInstance, message, SelectProps, Modal } from 'ant-design-vue';

// Define DataItem type if not imported
type DataItem = {
  id: string | number;
  [key: string]: any;
};
import { codeToText, regionData } from 'element-china-area-data';
import { listApi as listClassificationApi } from '/@/api/admin/classification';
import { listApi as listTagApi } from '/@/api/admin/tag';
import { createApi, deleteApi, listApi, updateApi } from '/@/api/admin/thing';
import { BASE_URL } from '/@/store/constants';
import { ref, reactive, onMounted } from 'vue'; // 确保导入 ref, reactive, onMounted
import { debounce } from 'lodash-es'; // 导入 debounce

let selectedOptions = ref([])

// --- 修改：表格列定义 ---
const columns = reactive([
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
    align: 'center',
  },
  // 新增：图片列
  {
    title: '图片',
    dataIndex: 'cover',
    key: 'cover',
    width: 100,
    align: 'center',
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
  },
  // 新增：发布者列
  {
    title: '发布者',
    // dataIndex: ['user', 'username'], // 假设后端返回 user 对象嵌套 username
    key: 'username', // 使用 key 匹配 template
    align: 'center',
  },

  {
    title: '地区',
    dataIndex: 'location',
    key: 'location',
  },
  {
    title: '物品简介',
    dataIndex: 'description',
    key: 'description',
    customRender: ({ text, record, index, column }) => (text ? text.substring(0, 10) + '...' : '--'),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: 100,
    // customRender 已移至 template
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'operation',
    align: 'center',
    fixed: 'right',
    width: 140,
  },
]);

// --- 新增：搜索和筛选状态 ---
const keyword = ref('');
const filterStatus = ref<string>(''); // 筛选状态

// 文件列表
const fileList = ref<any[]>([]);

// 页面数据
const data = reactive({
  dataList: [],
  loading: false,
  // keyword: '', // 移动到 ref
  selectedRowKeys: [] as any[],
  pageSize: 10,
  page: 1,
});

//获取地点
const handleChange = () => {
    if (
        selectedOptions.value[0] != null &&
        selectedOptions.value[1] != null &&
        selectedOptions.value[2] != null
    ) {
        modal.form.location =
            codeToText[selectedOptions.value[0]] +
            '/' +
            codeToText[selectedOptions.value[1]] +
            '/' +
            codeToText[selectedOptions.value[2]]

    }
}

// 弹窗数据源
const modal = reactive({
  visile: false,
  // editFlag: false; // 使用 mode 替代
  mode: 'view' as 'view' | 'edit', // 新增：模式，'view' 或 'edit'
  title: '',
  cData: [],
  tagData: [] as Array<{ id: string | number; title: string }>,
  regionDatas: regionData,
  form: {
    id: undefined,
    title: undefined,
    classification: undefined,
    tag: [],
    price: undefined, // 用于奖励积分
    // points: undefined, // 移除重复的 points
    mobile: undefined,
    location: '',
    detail_location: undefined as string | undefined, // 新增：详细地址
    status: undefined, // 状态值可能是 '0', '1', '2'
    cover: undefined,
    coverUrl: undefined,
    imageFile: null as File | null,
    description: undefined,
    user: undefined as { username: string } | undefined, // 新增：用于存储用户信息
  },
  rules: {
    title: [{ required: true, message: '请输入名称', trigger: 'change' }],
    classification: [{ required: true, message: '请选择分类', trigger: 'change' }],
    // status: [{ required: true, message: '请选择状态', trigger: 'change' }], // 移除状态验证
  },
});

// 新增：拒绝理由模态框状态
const rejectModal = reactive({
  visible: false,
  loading: false,
  reason: '',
  currentRecord: null as any | null, // 存储当前要拒绝的记录
});

const myform = ref<FormInstance>();

onMounted(() => {
  getDataList({ status: filterStatus.value });
  getCDataList();
  getTagDataList();
});

// --- 修改：getDataList 接受参数 ---
const getDataList = (params: { keyword?: string; status?: string } = {}) => {
  data.loading = true;
  const apiParams: Record<string, any> = {
    // keyword: data.keyword, // 使用 ref keyword
    keyword: params.keyword !== undefined ? params.keyword : keyword.value,
  };
  // 添加状态筛选参数
  if (params.status !== undefined && params.status !== '') {
    apiParams.status = params.status;
  } else if (filterStatus.value !== '') {
     apiParams.status = filterStatus.value;
  }

  listApi(apiParams) // 传递参数
    .then((res) => {
      data.loading = false;
      console.log(res); // 确认 res.data 中包含 cover 和 user.username
      res.data.forEach((item: any, index: any) => {
        item.index = (data.page - 1) * data.pageSize + index + 1; // 修复序号计算
        // item.price = item.price; // price 不再需要特殊处理
      });
      data.dataList = res.data;
      // 可能需要更新总数用于分页 data.total = res.total;
    })
    .catch((err) => {
      data.loading = false;
      console.log(err);
      message.error('获取列表失败');
    });
};

const getCDataList = () => {
  listClassificationApi({}).then((res) => {
    modal.cData = res.data;
  });
};
const getTagDataList = () => {
  listTagApi({}).then((res) => {
    res.data.forEach((item, index) => {
      item.index = index + 1;
    });
    modal.tagData = res.data;
  });
};

// --- 修改：移除 onSearchChange，使用 handleSearchInput ---
// const onSearchChange = (e: Event) => {
//   data.keyword = e?.target?.value;
//   console.log(data.keyword);
// };

// --- 新增：搜索防抖处理 ---
const handleSearchInput = debounce(() => {
  data.page = 1; // 重置到第一页
  onSearch();
}, 500);

// --- 修改：onSearch 调用 getDataList ---
const onSearch = () => {
  data.page = 1; // 重置到第一页
  getDataList({ keyword: keyword.value, status: filterStatus.value });
};

// --- 新增：处理筛选状态变化 ---
const handleFilterChange = () => {
  data.page = 1; // 重置到第一页
  getDataList({ keyword: keyword.value, status: filterStatus.value });
};

const rowSelection = ref({
  onChange: (selectedRowKeys: (string | number)[], selectedRows: DataItem[]) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    data.selectedRowKeys = selectedRowKeys;
  },
});

const handleAdd = () => {
  resetModal();
  modal.mode = 'edit'; // 修改：设置模式为 edit
  modal.visile = true;
  // modal.editFlag = false; // 移除
  modal.title = '新增';
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
  modal.form.cover = undefined;
  modal.form.user = undefined; // 重置 user
};

// 修改：handleEdit 现在只用于编辑，如果需要的话
const handleEdit = (record: any) => {
  resetModal();
  modal.mode = 'edit'; // 修改：设置模式为 edit
  modal.visile = true;
  // modal.editFlag = true; // 移除
  modal.title = '编辑详情'; // 修改标题
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
  selectedOptions.value = []; // 修正：使用 .value
  for (const key in record) {
    if (record[key] !== undefined) { // 检查 undefined
      modal.form[key] = record[key];
    }
  }
  // 填充 user 信息
  modal.form.user = record.user;
  modal.form.detail_location = record.detail_location; // 填充详细地址

  if (modal.form.cover) {
    modal.form.coverUrl = modal.form.cover;
    modal.form.cover = undefined;
  }
};

// 修改：handleViewDetail 设置为查看模式
const handleViewDetail = (record: any) => {
  resetModal();
  modal.mode = 'view'; // 修改：设置模式为 view
  modal.visile = true;
  // modal.editFlag = false; // 移除
  modal.title = '详情'; // 修改标题
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
  selectedOptions.value = []; // 修正：使用 .value
  for (const key in record) {
     if (record[key] !== undefined) { // 检查 undefined
       modal.form[key] = record[key];
     }
  }
  // 填充 user 信息
  modal.form.user = record.user;
  modal.form.detail_location = record.detail_location; // 填充详细地址

  if (modal.form.cover) {
    modal.form.coverUrl = modal.form.cover;
    modal.form.cover = undefined;
  }
};

// 移除 confirmDelete 方法
// const confirmDelete = (record: any) => { ... };

// 移除 handleBatchDelete 方法 或 注释掉其内容，因为批量删除按钮也移除了
const handleBatchDelete = () => {
  console.log('批量删除功能已移除');
  message.info('批量删除功能已移除');
  // ... (原有的删除逻辑)
};

// 新增：切换物品状态 (上架/下架)
const updateThingStatus = (record: any, targetStatus: '1' | '2', reason?: string) => {
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
  formData.append('type', 'lost'); // 新增：添加类型参数
  // 如果有拒绝理由，添加到 FormData
  if (targetStatus === '2' && reason) {
    formData.append('comment', reason); // 假设后端接收拒绝理由的字段是 'comment'
  }

  // 显示加载状态（如果是从拒绝模态框触发）
  if (rejectModal.visible) rejectModal.loading = true;

  updateApi({ id: record.id }, formData)
    .then((res) => {
      message.success(`物品已${actionText}`);
      getDataList(); // 刷新列表
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
    updateThingStatus(rejectModal.currentRecord, '2', rejectModal.reason.trim());
  }
};

// 新增：取消拒绝操作
const cancelReject = () => {
  rejectModal.visible = false;
  rejectModal.loading = false;
  rejectModal.currentRecord = null;
  rejectModal.reason = '';
};


// 修改：handleOk 中移除 mobile 的 append ---
const handleOk = () => {
  if (modal.mode === 'view') {
    hideModal(); // 查看模式下，确认按钮行为等同于关闭
    return;
  }

  myform.value
    ?.validate()
    .then(() => {
      const formData = new FormData();
      // 检查 modal.form.id 是否存在
      if (modal.form.id !== undefined) {
        formData.append('id', modal.form.id);
      }
      formData.append('title', modal.form.title || '');
      if (modal.form.classification) {
        formData.append('classification', modal.form.classification);
      }
      if (modal.form.tag) {
        modal.form.tag.forEach(function (value) {
          if (value) {
            formData.append('tag', value);
          }
        });
      }
      if (modal.form.imageFile) {
        formData.append('cover', modal.form.imageFile);
      }
      formData.append('description', modal.form.description || '');
      formData.append('price', modal.form.price !== undefined ? String(modal.form.price) : '0'); // 确保 price 是字符串
      if (modal.form.location) {
        formData.append('location', modal.form.location);
      }
      // 新增：提交 detail_location
      if (modal.form.detail_location) {
        formData.append('detail_location', modal.form.detail_location);
      }
      if (modal.form.status) {
        formData.append('status', modal.form.status);
      } else {
         // 如果是新增，可以给一个默认状态，例如 '0' (上架)
         if (modal.mode === 'edit' && modal.form.id === undefined) { // 仅在新增时设置默认状态
            formData.append('status', '0');
         }
      }

      // 检查 modal.form.id 是否存在来判断是更新还是创建
      if (modal.form.id !== undefined) {
        updateApi({ id: modal.form.id }, formData)
          .then((res) => {
            hideModal();
            getDataList();
          })
          .catch((err) => {
            console.log(err);
            message.error(err.msg || '操作失败');
          });
      } else {
        createApi(formData)
          .then((res) => {
            hideModal();
            getDataList();
          })
          .catch((err) => {
            console.log(err);
            message.error(err.msg || '操作失败');
          });
      }
    })
    .catch((err) => {
      console.log('表单验证失败:', err);
    });
};

const handleCancel = () => {
  hideModal();
};

// 恢复表单初始状态
const resetModal = () => {
  myform.value?.resetFields();
  fileList.value = [];
};

// 关闭弹窗
const hideModal = () => {
  modal.visile = false;
};

// 新增：获取状态文本的辅助函数
const getStatusText = (status: string | undefined): string => {
  switch (status) {
    case '0': return '未审核';
    case '1': return '已上架'; // 修改文本
    case '2': return '已下架'; // 修改文本
    default: return '未知状态';
  }
};

// 新增：获取状态 Tag 颜色的辅助函数
const getStatusTagColor = (status: string | undefined): string => {
  switch (status) {
    case '0': return 'orange'; // 未审核 - 橙色
    case '1': return 'success'; // 已上架 - 绿色
    case '2': return 'red';     // 已下架 - 红色
    default: return 'default'; // 未知 - 默认
  }
};

// 新增：处理审核下拉菜单点击事件
const handleAuditMenuClick = (key: string, record: any) => {
  if (key === 'approve') {
    Modal.confirm({
      title: '确定通过审核吗？',
      okText: '是',
      cancelText: '否',
      onOk: () => {
        updateThingStatus(record, '1');
      },
    });
  } else if (key === 'reject') {
    showRejectModal(record);
  }
};
</script>

<style scoped lang="less">
/* --- 修改/新增：参考 user.vue 的样式 --- */
.thing-management-container { /* 修改容器 class */
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-view {
  min-height: 100%;
  /* background: #f6222238; */ /* 移除背景色 */
  padding: 0; /* 移除内边距，由父容器控制 */
  display: flex;
  flex-direction: column;
}

.table-operations {
  margin-bottom: 24px;
  /* text-align: right; */ /* 改为左对齐 */
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

/* 移除旧的按钮右边距规则 */
/* .table-operations > button {
  margin-right: 8px;
} */

.thing-table { /* 新增表格 class */
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  :deep(.ant-table-thead > tr > th) {
    background-color: #fffaf5; /* 修改：匹配 user.vue 表头/Sider 背景色 */
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
    border-radius: 10px;
  }
  .ant-divider-vertical {
    margin: 0;
  }
  a { /* 调整操作链接间距 */
    margin: 0 4px;
  }
}

.search-label {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background-color: #ff7e5f; /* 修改：匹配 user.vue 搜索标签橙色 */
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
      background-color: #ff7e5f; /* 修改：匹配 user.vue 搜索按钮橙色 */
      border-color: #ff7e5f; /* 修改：匹配 user.vue 搜索按钮橙色 */
      color: #fff;
      height: 30px;
      &:hover {
        background-color: #feb47b; /* 修改：匹配 user.vue 搜索按钮橙色 hover */
        border-color: #feb47b; /* 修改：匹配 user.vue 搜索按钮橙色 hover */
      }
  }
   :deep(.ant-input-affix-wrapper) {
     height: 30px;
     &:focus-within, &:hover {
        box-shadow: none;
     }
   }
}

.refresh-button {
  margin-left: 8px;
  border-radius: 6px;
  border: none;
  background-color: #40a9ff; /* 修改：匹配 user.vue 刷新按钮蓝色 */
  color: #fff;
  transition: background-color 0.3s;

  &:hover {
    background-color: #69c0ff; /* 修改：匹配 user.vue 刷新按钮蓝色 hover */
  }
}

:deep(.ant-select) {
  .ant-select-selector {
    border-radius: 6px !important;
  }
}

/* 弹窗内上传组件样式调整 */
:deep(.ant-upload-drag) {
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  &:hover {
    border-color: #1890ff;
  }
}
:deep(.ant-upload-drag-icon img) {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
}

/* 可以为上架按钮添加特定样式 */
:deep(.ant-btn-primary[style*="background-color: #52c41a"]) {
  &:hover, &:focus {
    background-color: #73d13d !important;
    border-color: #73d13d !important;
  }
}

/* 新增：只读文本样式 */
.form-item-readonly-text {
  color: #555; /* 设置文本颜色 */
  line-height: 32px; /* 与输入框高度对齐 */
  display: inline-block; /* 确保行高生效 */
  padding: 0 11px; /* 模拟输入框的内边距 */
  width: 100%; /* 占据整个宽度 */
  background-color: #f5f5f5; /* 添加浅灰色背景 */
  border: 1px solid #d9d9d9; /* 添加边框 */
  border-radius: 4px; /* 添加圆角 */
  cursor: text; /* 鼠标样式改为文本 */
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏溢出文本 */
  text-overflow: ellipsis; /* 显示省略号 */
}

/* 新增：图片预览容器样式 */
.image-preview-container {
  padding: 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  display: inline-block; /* 使容器适应内容大小 */
}

/* 新增：Modal 样式优化 */
:deep(.thing-detail-modal .ant-modal-header) {
  background-color: #f0f2f5; /* 浅灰色头部背景 */
  border-bottom: 1px solid #e8e8e8;
}

:deep(.thing-detail-modal .ant-modal-title) {
  color: #333; /* 深色标题 */
}

:deep(.thing-detail-modal .ant-modal-body) {
  padding: 24px; /* 增加内边距 */
  background-color: #ffffff; /* 白色内容区域 */
}

:deep(.thing-detail-modal .ant-modal-footer) {
  background-color: #f0f2f5; /* 浅灰色脚部背景 */
  border-top: 1px solid #e8e8e8;
  padding: 10px 24px; /* 调整脚部内边距 */
}

/* 调整表单项间距 */
:deep(.thing-detail-modal .ant-form-item) {
  margin-bottom: 16px; /* 减小表单项底部间距 */
}

/* 调整只读状态下的 Select 箭头颜色 */
:deep(.ant-select-disabled .ant-select-arrow) {
  color: rgba(0, 0, 0, 0.25);
}

/* 新增：审核下拉按钮样式 */
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

/* 新增：审核下拉菜单项样式 */
/* 尝试增加特异性 */
:deep(.ant-dropdown-menu .ant-dropdown-menu-item.audit-menu-item) {
  transition: background-color 0.2s ease, color 0.2s ease;

  .anticon {
    margin-right: 8px;
    transition: transform 0.2s ease;
  }

  &:hover {
    /* 通用悬停背景色，如果 approve/reject 的悬停不生效，这个可能会生效 */
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

/* 如果上述修改仍无效，可以尝试更高特异性或 !important (仅用于测试) */
/*
:deep(.ant-dropdown-menu-item.audit-menu-item.approve) {
  color: #52c41a !important;
}
:deep(.ant-dropdown-menu-item.audit-menu-item.approve:hover) {
  background-color: #f6ffed !important;
  color: #52c41a !important;
}
*/
</style>
