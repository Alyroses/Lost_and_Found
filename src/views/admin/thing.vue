<template>
  <div>
    <!--页面区域-->
    <div class="page-view">
      <div class="table-operations">
        <a-space>
          <a-button type="primary" @click="handleAdd">新增</a-button>
          <a-button @click="handleBatchDelete">批量删除</a-button>
          <a-input-search addon-before="名称" enter-button @search="onSearch" @change="onSearchChange" />
        </a-space>
      </div>
      <a-table size="middle" rowKey="id" :loading="data.loading" :columns="columns" :data-source="data.dataList"
        :scroll="{ x: 'max-content' }" :row-selection="rowSelection" :pagination="{
            size: 'default',
            current: data.page,
            pageSize: data.pageSize,
            onChange: (current) => (data.page = current),
            showSizeChanger: false,
            showTotal: (total) => `共${total}条数据`,
          }">
        <template #bodyCell="{ text, record, index, column }">
          <template v-if="column.key === 'operation'">
            <span>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除?" ok-text="是" cancel-text="否" @confirm="confirmDelete(record)">
                <a href="#">删除</a>
              </a-popconfirm>
            </span>
          </template>
        </template>
      </a-table>
    </div>

    <!--弹窗区域-->
    <div>
      <a-modal :visible="modal.visile" :forceRender="true" :title="modal.title" width="880px" ok-text="确认"
        cancel-text="取消" @cancel="handleCancel" @ok="handleOk">
        <div>
          <a-form ref="myform" :label-col="{ style: { width: '80px' } }" :model="modal.form" :rules="modal.rules">
            <a-row :gutter="24">
              <a-col span="24">
                <a-form-item label="寻物标题" name="title">
                  <a-input placeholder="请输入" v-model:value="modal.form.title" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="物品分类" name="classification">
                  <a-select placeholder="请选择" allowClear :options="modal.cData"
                    :field-names="{ label: 'title', value: 'id' }" v-model:value="modal.form.classification" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="标签">
                  <a-select mode="multiple" placeholder="请选择" allowClear v-model:value="modal.form.tag">
                    <template v-for="item in modal.tagData">
                      <a-select-option :value="item.id">{{ item.title }}</a-select-option>
                    </template>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col span="24">
                <a-form-item label="照片">
                  <a-upload-dragger name="file" accept="image/*" :multiple="false" :before-upload="beforeUpload"
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
                </a-form-item>
              </a-col>

              <a-col span="24">
                <a-form-item label="物品简介">
                  <a-textarea placeholder="请输入" v-model:value="modal.form.description" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="寻回奖励" name="price">
                  <a-input-number placeholder="请输入" :min="0" v-model:value="modal.form.price" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="联系号码">
                  <a-input-number placeholder="请输入" :min="0" v-model:value="modal.form.mobile" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="丢失地区">
                  <el-cascader :options="modal.regionDatas" v-model="selectedOptions" placeholder="请选择"
                    @change="handleChange"></el-cascader>
                </a-form-item>
              </a-col>
              <a-col span="12">
                <a-form-item label="状态" name="status">
                  <a-select placeholder="请选择" allowClear v-model:value="modal.form.status">
                    <a-select-option key="0" value="0">上架（进行查找）</a-select-option>
                    <a-select-option key="1" value="1">下架（无果或者已找到）</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileImageOutlined } from '@ant-design/icons-vue';
import { FormInstance, message } from 'ant-design-vue';
import { codeToText, regionData } from 'element-china-area-data';
import { listApi as listClassificationApi } from '/@/api/admin/classification';
import { listApi as listTagApi } from '/@/api/admin/tag';
import { createApi, deleteApi, listApi, updateApi } from '/@/api/admin/thing';
import { BASE_URL } from '/@/store/constants';
let selectedOptions = ref([])
const columns = reactive([
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '奖励',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: '联系号码',
    dataIndex: 'mobile',
    key: 'mobile',
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
    customRender: ({ text, record, index, column }) => (text === '0' ? '寻找中' : '已找到'),
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

const beforeUpload = (file: File) => {
  // 改文件名
  const fileName = new Date().getTime().toString() + '.' + file.type.substring(6);
  const copyFile = new File([file], fileName);
  console.log(copyFile);
  modal.form.imageFile = copyFile;
  return false;
};

// 文件列表
const fileList = ref<any[]>([]);

// 页面数据
const data = reactive({
  dataList: [],
  loading: false,
  keyword: '',
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
  editFlag: false,
  title: '',
  cData: [],
  tagData: [{}],
  regionDatas: regionData,
  form: {
    id: undefined,
    title: undefined,
    classification: undefined,
    tag: [],
    price: undefined,
    mobile: undefined,

    location: '',
    status: undefined,
    cover: undefined,
    coverUrl: undefined,
    imageFile: null as File | null,
    description: undefined,
  },
  rules: {
    title: [{ required: true, message: '请输入名称', trigger: 'change' }],
    classification: [{ required: true, message: '请选择分类', trigger: 'change' }],
    price: [{ required: true, message: '请输入奖励价格', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  },
});



const myform = ref<FormInstance>();

onMounted(() => {
  getDataList();
  getCDataList();
  getTagDataList();
});

const getDataList = () => {
  data.loading = true;
  listApi({
    keyword: data.keyword,
  })
    .then((res) => {
      data.loading = false;
      console.log(res);
      res.data.forEach((item: any, index: any) => {
        item.index = index + 1;
        item.price = item.price;
      });
      data.dataList = res.data;
    })
    .catch((err) => {
      data.loading = false;
      console.log(err);
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

const onSearchChange = (e: Event) => {
  data.keyword = e?.target?.value;
  console.log(data.keyword);
};

const onSearch = () => {
  getDataList();
};

const rowSelection = ref({
  onChange: (selectedRowKeys: (string | number)[], selectedRows: DataItem[]) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    data.selectedRowKeys = selectedRowKeys;
  },
});

const handleAdd = () => {
  resetModal();
  modal.visile = true;
  modal.editFlag = false;
  modal.title = '新增';
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
  modal.form.cover = undefined;
};
const handleEdit = (record: any) => {
  resetModal();
  modal.visile = true;
  modal.editFlag = true;
  modal.title = '编辑';
  // 重置
  for (const key in modal.form) {
    modal.form[key] = undefined;
  }
  selectedOptions = ref([])
  for (const key in record) {
    if (record[key]) {
      modal.form[key] = record[key];
    }
  }
  if (modal.form.cover) {
    modal.form.coverUrl = BASE_URL + modal.form.cover;
    modal.form.cover = undefined;
  }
};

const confirmDelete = (record: any) => {
  console.log('delete', record);
  deleteApi({ ids: record.id })
    .then((res) => {
      getDataList();
    })
    .catch((err) => {
      message.error(err.msg || '操作失败');
    });
};

const handleBatchDelete = () => {
  console.log(data.selectedRowKeys);
  if (data.selectedRowKeys.length <= 0) {
    console.log('hello');
    message.warn('请勾选删除项');
    return;
  }
  deleteApi({ ids: data.selectedRowKeys.join(',') })
    .then((res) => {
      message.success('删除成功');
      data.selectedRowKeys = [];
      getDataList();
    })
    .catch((err) => {
      message.error(err.msg || '操作失败');
    });
};

const handleOk = () => {
  myform.value
    ?.validate()
    .then(() => {
      const formData = new FormData();
      if (modal.editFlag) {
        formData.append('id', modal.form.id);
      }
      formData.append('title', modal.form.title);
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
      formData.append('price', modal.form.price || '');
      if (modal.form.mobile) {
        formData.append('mobile', modal.form.mobile);
      }
      if (modal.form.location) {
        formData.append('location', modal.form.location);
      }
      if (modal.form.status) {
        formData.append('status', modal.form.status);
      }
      if (modal.editFlag) {
        updateApi(
          {
            id: modal.form.id,
          },
          formData,
        )
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
      console.log('不能为空');
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
</script>

<style scoped lang="less">
.page-view {
  min-height: 100%;
  background: #f6222238;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.table-operations {
  margin-bottom: 16px;
  text-align: right;
}

.table-operations>button {
  margin-right: 8px;
}
</style>
