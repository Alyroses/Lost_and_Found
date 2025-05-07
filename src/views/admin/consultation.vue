<template>
    <div>
      <!--页面区域-->
      <div class="management-container">
        <div class="table-operations">
          <a-space>
            <a-button type="primary" @click="handleAdd">新增公告</a-button>
            <a-button @click="handleBatchDelete" :disabled="data.selectedRowKeys.length === 0">批量删除</a-button>
          </a-space>
        </div>
        <a-table
          size="middle"
          rowKey="id"
          :loading="data.loading"
          :columns="columns"
          :data-source="data.noticeList"
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
            <template v-if="column.key === 'operation'">
              <a-space>
                <a-button type="primary" size="small" @click="handleEdit(record)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm title="确定删除?" ok-text="是" cancel-text="否" @confirm="confirmDelete(record)">
                  <a-button type="primary" danger size="small">
                    <template #icon><DeleteOutlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
             <template v-else-if="column.key === 'content'">
              <div class="ellipsis-text" :title="text">{{ text }}</div>
            </template>
          </template>
        </a-table>
      </div>
  
      <!--弹窗区域-->
      <div>
        <a-modal
          :visible="modal.visile"
          :forceRender="true"
          :title="modal.title"
          ok-text="确认"
          cancel-text="取消"
          @cancel="handleCancel"
          @ok="handleOk"
          width="600px"
        >
          <div>
            <a-form ref="myform" :label-col="{ style: { width: '80px' } }" :model="modal.form" :rules="modal.rules">
              <a-row :gutter="24">
                <a-col span="24">
                  <a-form-item label="标题" name="title">
                    <a-input placeholder="请输入标题" v-model:value="modal.form.title" />
                  </a-form-item>
                </a-col>
                <a-col span="24">
                  <a-form-item label="通知内容" name="content">
                    <a-textarea placeholder="请输入内容" :rows="6" v-model:value="modal.form.content" />
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
  import { FormInstance, message } from 'ant-design-vue';
  import { createApi, deleteApi, listApi, updateApi } from '/@/api/admin/notice'; // 使用 admin 下的 notice API
  import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
  import { reactive, ref, onMounted, nextTick } from 'vue'; // 确保导入
  
    const columns = reactive([
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        align: 'center',
        width: 80,
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        align: 'left',
        ellipsis: true,
        width: 200,
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        align: 'left',
        ellipsis: true, // 配合 CSS 实现多行省略
      },
      {
        title: '创建时间', // 新增创建时间列
        dataIndex: 'create_time',
        key: 'create_time',
        align: 'center',
        width: 180,
        customRender: ({ text }) => text ? new Date(text).toLocaleString() : '-',
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'operation',
        align: 'center',
        fixed: 'right',
        width: 180,
      },
    ]);
  
    const data = reactive({
      noticeList: [],
      loading: false,
      keyword: '',
      selectedRowKeys: [] as any[],
      pageSize: 10,
      page: 1,
    });
  
    const modal = reactive({
      visile: false,
      editFlag: false,
      title: '',
      form: {
        id: undefined as string | undefined,
        title: undefined  as string | undefined,
        content: undefined as string | undefined,
      },
      rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
      },
    });
  
    const myform = ref<FormInstance>();
  
    onMounted(() => {
      getDataList();
    });
  
    const getDataList = () => {
      data.loading = true;
      listApi({ // 使用 admin 下的 listApi
        // keyword: data.keyword, // 如果需要搜索功能
        page: data.page,
        pageSize: data.pageSize,
      })
        .then((res) => {
          if (res.code === 0) {
            res.data.forEach((item: any, index: any) => {
              // 如果后端不直接分页，前端计算序号 (page - 1) * pageSize + index + 1
              item.index = (data.page - 1) * data.pageSize + index + 1;
            });
            data.noticeList = res.data;
            // data.total = res.totalCount; // 假设后端返回总数
          } else {
            message.error(res.msg || '获取列表失败');
          }
        })
        .catch((err) => {
          message.error(err.msg || '请求失败');
        })
        .finally(() => {
            data.loading = false;
        });
    };
  
    const rowSelection = ref({
      onChange: (selectedRowKeys: (string | number)[], selectedRows: any[]) => {
        data.selectedRowKeys = selectedRowKeys;
      },
    });
  
    const handleAdd = () => {
      resetModal();
      modal.visile = true;
      modal.editFlag = false;
      modal.title = '新增通知公告';
    };

    const handleEdit = (record: any) => {
      resetModal();
      modal.visile = true;
      modal.editFlag = true;
      modal.title = '编辑通知公告';
      // 使用 nextTick 确保表单重置后再赋值
      nextTick(() => {
        modal.form.id = record.id;
        modal.form.title = record.title;
        modal.form.content = record.content;
      });
    };
  
    const confirmDelete = (record: any) => {
      deleteApi({ ids: record.id }) // 使用 admin 下的 deleteApi
        .then((res) => {
          if (res.code === 0) {
            message.success('删除成功');
            getDataList();
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
      deleteApi({ ids: data.selectedRowKeys.join(',') }) // 使用 admin 下的 deleteApi
        .then((res) => {
          if (res.code === 0) {
            message.success('批量删除成功');
            data.selectedRowKeys = [];
            getDataList();
          } else {
            message.error(res.msg || '批量删除失败');
          }
        })
        .catch((err) => {
          message.error(err.msg || '操作失败');
        });
    };
  
    const handleOk = () => {
      myform.value
        ?.validate()
        .then(() => {
          const api = modal.editFlag ? updateApi : createApi; // 使用 admin 下的 API
          const params = modal.editFlag ? { id: modal.form.id, ...modal.form } : modal.form;
          
          api(params)
            .then((res) => {
              if (res.code === 0) {
                message.success(modal.editFlag ? '更新成功' : '新增成功');
                hideModal();
                getDataList();
              } else {
                message.error(res.msg || '操作失败');
              }
            })
            .catch((err) => {
              message.error(err.msg || '请求失败');
            });
        })
        .catch((err) => {
          console.log('表单验证失败:', err);
        });
    };
  
    const handleCancel = () => {
      hideModal();
    };
  
    const resetModal = () => {
      myform.value?.resetFields();
      modal.form.id = undefined;
      modal.form.title = undefined;
      modal.form.content = undefined;
    };
  
    const hideModal = () => {
      modal.visile = false;
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
       .ant-btn-primary.ant-btn-sm {
         border-radius: 10px;
       }
    }
    .ellipsis-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px; /* 根据需要调整最大宽度 */
    }
  }
  
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
  </style>
