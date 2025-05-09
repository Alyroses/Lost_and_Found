<template>
    <div>
        <!--页面区域-->
        <div class="page-view">
            <div class="view-toggle-buttons">
                <!-- 新的分段控件样式 -->
                <div class="segmented-control">
                    <button
                        :class="{ active: activeViewType === 'lost' }"
                        @click="setActiveView('lost')"
                        class="segment-button"
                    >
                        我发布的失物
                    </button>
                    <button
                        :class="{ active: activeViewType === 'found' }"
                        @click="setActiveView('found')"
                        class="segment-button"
                    >
                        我发布的招领
                    </button>
                    <!-- 修改：匹配管理标签按钮，增加徽标 -->
                    <button
                        :class="{ active: activeViewType === 'matches' }"
                        @click="setActiveView('matches')"
                        class="segment-button"
                    >
                        匹配管理
                         <a-badge :count="dataMatchRequests.totalUnread" :offset="[10, -5]" v-if="dataMatchRequests.totalUnread > 0"/>
                    </button>
                </div>
            </div>

            <!-- 我发布的失物/招领列表 -->
            <template v-if="activeViewType === 'lost' || activeViewType === 'found'">
                <h2 class="section-title">{{ activeViewType === 'lost' ? '我发布的失物列表' : '我发布的招领列表' }}</h2>
                <a-table size="middle" rowKey="id" :loading="currentTableLoading" :columns="unifiedColumns"
                    :data-source="currentTableData" :scroll="{ x: 'max-content' }" :pagination="{
                        size: 'default',
                        current: activeViewType === 'lost' ? dataLost.page : dataFound.page,
                        pageSize: activeViewType === 'lost' ? dataLost.pageSize : dataFound.pageSize,
                        onChange: handlePageChange,
                        showSizeChanger: false,
                        showTotal: (total) => `共${total}条数据`,
                    }">
                    <template #bodyCell="{ text, record, index, column }">
                        <template v-if="column.key === 'operation'">
                            <span class="action-buttons">
                                <a @click="handleEdit(record)" class="action-button">修改</a>
                                <a-divider type="vertical" />
                                <a-popconfirm title="确定取消发布吗?" ok-text="是" cancel-text="否"
                                    @confirm="handleConfirmDelete(record)">
                                    <a href="#" class="action-button">删除发布</a>
                                </a-popconfirm>
                                <a-divider type="vertical" />
                                <!-- 修改：根据 match_status 显示不同操作 -->
                                <template v-if="record.match_status === 'completed'">
                                     <a-tag color="blue">已完成匹配</a-tag>
                                </template>
                                <template v-else-if="record.match_status === 'confirmed'">
                                    <a-popconfirm title="确定标记为最终完成吗?" ok-text="是" cancel-text="否"
                                        @confirm="handleMatchSuccess(record)">
                                        <a href="#" class="action-button" style="color: green;">标记为最终完成</a>
                                    </a-popconfirm>
                                </template>
                                <template v-else-if="record.match_status === 'pending' && record.match_user && record.match_user.id !== userStore.user_id">
                                    <a-tag color="orange" @click="setActiveView('matches')" style="cursor: pointer;">待您处理匹配</a-tag>
                                </template>
                                <template v-else-if="record.match_status === 'pending' && record.match_user && record.match_user.id === userStore.user_id">
                                     <a-tag color="processing">您已请求</a-tag>
                                </template>
                                 <template v-else-if="record.match_status === 'rejected'">
                                     <a-tag color="error">匹配已拒绝</a-tag>
                                </template>
                                <template v-else-if="!record.match_status || record.match_status === 'cancelled'">
                                    <a-popconfirm title="确定标记为配对成功吗?" ok-text="是" cancel-text="否"
                                        @confirm="handleMatchSuccess(record)">
                                        <a href="#" class="action-button">手动标记完成</a>
                                    </a-popconfirm>
                                </template>
                            </span>
                        </template>
                        <template v-else-if="column.key === 'description'">
                            {{ text ? String(text).substring(0, 30) + (String(text).length > 30 ? '...' : '') : '--' }}
                        </template>
                        <template v-else-if="column.key === 'status'">
                            {{ formatStatus(text, activeViewType, record.match_status, record.match_user?.id === userStore.user_id) }}
                        </template>
                    </template>
                </a-table>
            </template>

            <!-- 新增：匹配管理列表 -->
            <template v-if="activeViewType === 'matches'">
                <h2 class="section-title">收到的匹配请求 (待处理)</h2>
                <a-table size="middle" rowKey="id" :loading="dataMatchRequests.loading" :columns="matchRequestColumns"
                    :data-source="dataMatchRequests.dataList" :scroll="{ x: 'max-content' }" :pagination="{
                        size: 'default',
                        current: dataMatchRequests.page,
                        pageSize: dataMatchRequests.pageSize,
                        onChange: handleMatchRequestPageChange,
                        showSizeChanger: false,
                        showTotal: (total) => `共${total}条待处理请求`,
                    }">
                    <template #bodyCell="{ text, record, column }">
                         <template v-if="column.key === 'requester'">
                            <a-avatar :src="record.match_user?.avatar || defaultAvatar" size="small" />
                            <span style="margin-left: 8px;">{{ record.match_user?.username || '未知用户' }}</span>
                        </template>
                        <template v-else-if="column.key === 'itemTitle'">
                            <a @click="gotoDetail(record)">{{ record.title }}</a>
                        </template>
                        <template v-else-if="column.key === 'itemType'">
                            <a-tag :color="record.type === 'lost' ? 'cyan' : 'purple'">{{ record.type === 'lost' ? '失物' : '招领' }}</a-tag>
                        </template>
                        <template v-else-if="column.key === 'operation'">
                            <span class="action-buttons" v-if="record.match_status === 'pending'">
                                <a-popconfirm title="确定同意该用户的匹配请求吗?" ok-text="同意" cancel-text="再想想"
                                    @confirm="handleConfirmMatchRequest(record)">
                                    <a href="#" class="action-button" style="color: green;">同意匹配</a>
                                </a-popconfirm>
                                <a-divider type="vertical" />
                                <a-popconfirm title="确定拒绝该用户的匹配请求吗?" ok-text="拒绝" cancel-text="取消"
                                    @confirm="handleRejectMatchRequest(record)">
                                    <a href="#" class="action-button" style="color: red;">拒绝匹配</a>
                                </a-popconfirm>
                            </span>
                             <span v-else>
                                <a-tag :color="getMatchStatusTagColor(record.match_status)">{{ formatMatchStatus(record.match_status) }}</a-tag>
                            </span>
                        </template>
                    </template>
                </a-table>
            </template>
        </div>

        <!--弹窗区域-->
        <div>
            <a-modal :visible="modal.visile" :forceRender="true" :title="modal.title" width="880px" ok-text="确认"
                cancel-text="取消" @cancel="handleCancel" @ok="handleOk">
                <div>
                    <a-form ref="myform" :label-col="{ style: { width: '100px' } }" :model="modal.form"
                        :rules="modal.rules">
                        <a-row :gutter="24">
                            <a-col span="24">
                                <a-form-item :label="activeViewType === 'lost' ? '失物标题' : '招领标题'" name="title">
                                    <a-input placeholder="请输入标题" v-model:value="modal.form.title" />
                                </a-form-item>
                            </a-col>
                            <a-col span="12">
                                <a-form-item label="物品分类" name="classification">
                                    <a-select placeholder="请选择分类" allowClear :options="modal.cData"
                                        :field-names="{ label: 'title', value: 'id' }"
                                        v-model:value="modal.form.classification" />
                                </a-form-item>
                            </a-col>
                            <a-col span="12">
                                <a-form-item label="标签">
                                    <a-select mode="multiple" placeholder="请选择标签" allowClear
                                        v-model:value="modal.form.tag">
                                        <template v-for="item in modal.tagData" :key="item.id">
                                            <a-select-option :value="item.id">{{ item.title }}</a-select-option>
                                        </template>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col span="24">
                                <a-form-item label="物品照片">
                                    <a-upload-dragger name="file" accept="image/*" :multiple="false"
                                        :before-upload="beforeUpload" v-model:file-list="fileList" :maxCount="1">
                                        <p class="ant-upload-drag-icon">
                                            <template v-if="modal.form.coverUrl">
                                                <img :src="modal.form.coverUrl" style="width: 60px; height: 80px; object-fit: cover;" />
                                            </template>
                                            <template v-else>
                                                <file-image-outlined />
                                            </template>
                                        </p>
                                        <p class="ant-upload-text"> 点击或拖拽图片到此处上传 </p>
                                    </a-upload-dragger>
                                </a-form-item>
                            </a-col>
                            <a-col span="24">
                                <a-form-item label="详细描述" name="description">
                                    <a-textarea placeholder="请输入物品的详细描述" v-model:value="modal.form.description" :rows="4"/>
                                </a-form-item>
                            </a-col>
                            <a-col span="12">
                                <a-form-item :label="activeViewType === 'lost' ? '悬赏积分' : '拾获积分'" name="points">
                                    <a-input-number placeholder="请输入积分" :min="0" v-model:value="modal.form.points"
                                        style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col span="12">
                                <a-form-item label="联系人手机号" name="mobile">
                                    <a-input-number placeholder="请输入" :min="0" v-model:value="modal.form.mobile"
                                        style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col span="12">
                                <a-form-item :label="activeViewType === 'lost' ? '丢失地区' : '拾获地区'" name="location">
                                    <el-cascader :options="modal.regionDatas" v-model="selectedOptions"
                                        placeholder="请选择地区" @change="handleChange" style="width: 100%;"></el-cascader>
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
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listApi as listClassificationApi } from '/@/api/admin/classification';
import { listApi as listTagApi } from '/@/api/admin/tag';
// Import user-specific APIs from index/thing.ts
import {
    listUserThingApi, 
    listUserFoundThingApi, 
    createApi as createUserThingApi, 
    createFoundApi as createUserFoundThingApi, 
    updateApi as updateUserThingApi, 
    deleteUserThingApi, 
    updateUserThingStatusApi,
    // 新增导入
    listIncomingMatchRequestsApi,
    respondToMatchRequestApi
} from '/@/api/index/thing';
import { useUserStore } from "/@/store";
import { BASE_URL } from "/@/store/constants";
import defaultAvatar from '/@/assets/images/avatar.jpg'; // 导入默认头像

const userStore = useUserStore();
const router = useRouter();

const activeViewType = ref<'lost' | 'found' | 'matches'>('lost'); 

const unifiedColumns = reactive([
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '积分', dataIndex: 'points', key: 'points', width: 80 },
    { title: '地区', dataIndex: 'location', key: 'location', width: 150, ellipsis: true },
    { title: '详细描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 250 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 }, // 状态列，由 formatStatus 格式化
    { title: '操作', key: 'operation', align: 'center', fixed: 'right' as 'right', width: 260 },
]);

// 新增：匹配管理表格列
const matchRequestColumns = reactive([
    { title: '请求匹配的物品', dataIndex: 'title', key: 'itemTitle', width: 200, ellipsis: true },
    { title: '请求者', key: 'requester', width: 150, ellipsis: true },
    { title: '物品类型', dataIndex: 'type', key: 'itemType', width: 100 },
    // { title: '请求描述', dataIndex: 'description', key: 'description', ellipsis: true, customRender: ({text}) => text ? String(text).substring(0,30) + '...' : '--' },
    { title: '请求时间', dataIndex: 'match_request_time', key: 'match_request_time', width: 150, customRender: ({text}) => text ? new Date(text).toLocaleString() : '--'},
    { title: '当前状态', dataIndex: 'match_status', key: 'match_status', width: 120, customRender: ({text}) => formatMatchStatus(text) },
    { title: '操作', key: 'operation', align: 'center', fixed: 'right', width: 200 },
]);

const beforeUpload = (file: File) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
        return false;
    }
    const fileName = new Date().getTime().toString() + '.' + file.name.split('.').pop();
    modal.form.imageFile = new File([file], fileName, { type: file.type });
    
    // Preview
    const reader = new FileReader();
    reader.onload = e => {
        modal.form.coverUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    fileList.value = [modal.form.imageFile]; // Update fileList for display
    return false; // Prevent auto-upload
};

const fileList = ref<any[]>([]);

// Data for user's lost items
const dataLost = reactive({
    dataList: [],
    loading: false,
    pageSize: 10,
    page: 1,
    total: 0,
});

// Data for user's found items
const dataFound = reactive({
    dataList: [],
    loading: false,
    pageSize: 10,
    page: 1,
    total: 0,
});

// 修改：Data for incoming match requests，增加 totalUnread
const dataMatchRequests = reactive({
    dataList: [] as any[],
    loading: false,
    pageSize: 10,
    page: 1,
    total: 0,
    totalUnread: 0, // 用于徽标显示
});

const currentTableData = computed(() => {
    if (activeViewType.value === 'lost') return dataLost.dataList;
    if (activeViewType.value === 'found') return dataFound.dataList;
    // if (activeViewType.value === 'matches') return dataMatchRequests.dataList; // 这个由 specific table 处理
    return [];
});

const currentTableLoading = computed(() => {
    if (activeViewType.value === 'lost') return dataLost.loading;
    if (activeViewType.value === 'found') return dataFound.loading;
    // if (activeViewType.value === 'matches') return dataMatchRequests.loading;
    return false;
});

const setActiveView = (type: 'lost' | 'found' | 'matches') => {
    activeViewType.value = type;
    if (type === 'lost') {
        dataLost.page = 1; // 重置页码
        getUserLostThings();
    } else if (type === 'found') {
        dataFound.page = 1; // 重置页码
        getUserFoundThings();
    } else if (type === 'matches') {
        dataMatchRequests.page = 1; // 重置页码
        getIncomingMatchRequests(true); // 传入 true 以显示加载状态
    }
};

const handlePageChange = (page: number) => {
    if (activeViewType.value === 'lost') {
        dataLost.page = page;
        getUserLostThings();
    } else if (activeViewType.value === 'found') {
        dataFound.page = page;
        getUserFoundThings();
    }
    // 分页单独处理
};

// 新增：匹配管理分页处理
const handleMatchRequestPageChange = (page: number) => {
    dataMatchRequests.page = page;
    getIncomingMatchRequests(true); // 传入 true 以显示加载状态
};

let selectedOptions = ref<string[]>([]);

const handleChange = () => {
    if (selectedOptions.value && selectedOptions.value.length === 3) {
        modal.form.location = selectedOptions.value.map(code => codeToText[code]).join('/');
    } else {
        modal.form.location = undefined;
    }
};

const modal = reactive({
    visile: false,
    editFlag: false,
    title: '',
    cData: [] as any[],
    regionDatas: regionData,
    tagData: [] as any[],
    form: {
        id: undefined as string | undefined,
        title: undefined as string | undefined,
        classification: undefined as string | undefined,
        tag: [] as string[],
        points: undefined as number | undefined,
        mobile: undefined as string | undefined,
        location: undefined as string | undefined,
        status: undefined as string | undefined, // Usually set by backend
        cover: undefined as string | undefined, // Stores existing cover URL for edit
        coverUrl: undefined as string | undefined, // For previewing new/existing image
        imageFile: undefined as File | undefined,
        description: undefined as string | undefined,
        type: 'lost' as 'lost' | 'found', // To distinguish for API calls
    },
    rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        classification: [{ required: true, message: '请选择物品分类', trigger: 'change' }],
        points: [{ required: true, message: '请输入悬赏或拾获积分', trigger: 'blur', type: 'number' }],
        mobile: [{ required: true, message: '请输入联系人手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
        location: [{ required: true, message: '请选择地区', trigger: 'change' }],
        description: [{ required: true, message: '请输入详细描述', trigger: 'blur' }],
    },
});

const myform = ref<FormInstance>();

onMounted(() => {
    // --- 新增：从路由查询参数设置初始视图 ---
    const initialView = router.currentRoute.value.query.view as typeof activeViewType.value;
    if (initialView && ['lost', 'found', 'matches'].includes(initialView)) {
        activeViewType.value = initialView;
    }
    // --- 结束 ---

    if (!userStore.user_id) {
        message.error("用户未登录，无法查看发布信息。");
        router.push('/login'); 
        return;
    }

    // 根据 activeViewType 加载对应数据
    if (activeViewType.value === 'lost') {
        getUserLostThings();
    } else if (activeViewType.value === 'found') {
        getUserFoundThings();
    } else if (activeViewType.value === 'matches') {
        getIncomingMatchRequests(true);
    }
    
    getIncomingMatchRequests(); // 获取未读匹配请求数量，不显示加载动画
    getCDataList();
    getTagDataList();
});

const getUserLostThings = () => {
    dataLost.loading = true;
    listUserThingApi({ user: userStore.user_id, page: dataLost.page, pageSize: dataLost.pageSize, type: 'lost' })
        .then((res) => {
            if (res && res.data && Array.isArray(res.data.list)) {
                dataLost.dataList = res.data.list.map((item: any) => ({ ...item, key: item.id }));
                dataLost.total = res.data.total || res.data.list.length;
            } else {
                // 保持原有逻辑，如果API不返回list和total，则尝试直接使用res.data
                if (Array.isArray(res.data)) {
                     dataLost.dataList = res.data.map((item: any) => ({ ...item, key: item.id }));
                     dataLost.total = res.total || res.data.length;
                } else {
                    throw new Error('失物列表响应数据格式不正确');
                }
            }
        })
        .catch((err) => {
            console.error(err); // 打印错误信息以便调试
            message.error(err.msg || '获取我发布的失物失败');
        })
        .finally(() => {
            dataLost.loading = false;
        });
};

const getUserFoundThings = () => {
    dataFound.loading = true;
    listUserThingApi({ user: userStore.user_id, page: dataFound.page, pageSize: dataFound.pageSize, type: 'found' })
        .then((res) => {
             if (res && res.data && Array.isArray(res.data.list)) {
                dataFound.dataList = res.data.list.map((item: any) => ({ ...item, key: item.id }));
                dataFound.total = res.data.total || res.data.list.length;
            } else {
                 if (Array.isArray(res.data)) {
                     dataFound.dataList = res.data.map((item: any) => ({ ...item, key: item.id }));
                     dataFound.total = res.total || res.data.length;
                 } else {
                    throw new Error('招领列表响应数据格式不正确');
                 }
            }
        })
        .catch((err) => {
            console.error(err); // 打印错误信息以便调试
            message.error(err.msg || '获取我发布的招领失败');
        })
        .finally(() => {
            dataFound.loading = false;
        });
};

// 修改：获取收到的匹配请求，增加 showLoadingMsg 参数
const getIncomingMatchRequests = (showLoadingIndicator = false) => {
    if (showLoadingIndicator) {
        dataMatchRequests.loading = true;
    }
    listIncomingMatchRequestsApi({ 
        user_id: userStore.user_id, // 这里已经使用了 userStore.user_id
        page: dataMatchRequests.page, 
        pageSize: dataMatchRequests.pageSize 
    })
        .then(res => {
            if (res.code === 0 && res.data && Array.isArray(res.data.list)) {
                dataMatchRequests.dataList = res.data.list.map((item: any) => ({ ...item, key: item.id }));
                dataMatchRequests.total = res.data.total;
                // 假设API返回的 total 就是需要用户处理的 'pending' 状态的请求总数
                dataMatchRequests.totalUnread = res.data.list.filter(req => req.match_status === 'pending').length; 
            } else {
                dataMatchRequests.dataList = [];
                dataMatchRequests.total = 0;
                dataMatchRequests.totalUnread = 0;
                if (res.msg && showLoadingIndicator) message.error(res.msg);
            }
        })
        .catch(err => {
            if (showLoadingIndicator) message.error(err.msg || '获取匹配请求失败');
            dataMatchRequests.dataList = [];
            dataMatchRequests.total = 0;
            dataMatchRequests.totalUnread = 0;
        })
        .finally(() => {
            if (showLoadingIndicator) {
                dataMatchRequests.loading = false;
            }
        });
};

const getCDataList = () => listClassificationApi({}).then(res => modal.cData = res.data);
const getTagDataList = () => listTagApi({}).then(res => modal.tagData = res.data);

const handleAdd = () => {
    resetModal();
    modal.editFlag = false;
    modal.form.type = activeViewType.value;
    modal.title = `发布新的${activeViewType.value === 'lost' ? '失物' : '招领'}信息`;
    modal.visile = true;
};

const handleEdit = (record: any) => {
    resetModal();
    modal.editFlag = true;
    modal.form.type = activeViewType.value; // or record.type if available
    modal.title = `编辑${activeViewType.value === 'lost' ? '失物' : '招领'}信息`;

    // Populate form, carefully handling potential undefined values
    modal.form.id = record.id;
    modal.form.title = record.title;
    modal.form.classification = record.classification_id || record.classification; // classification might be an object or just id
    modal.form.tag = Array.isArray(record.tag) ? record.tag.map(t => typeof t === 'object' ? t.id : t) : [];
    modal.form.points = record.points;
    modal.form.mobile = record.mobile;
    modal.form.location = record.location;
    modal.form.description = record.description;
    
    if (record.cover) {
        modal.form.coverUrl = record.cover.startsWith('http') ? record.cover : `${BASE_URL}${record.cover}`;
    } else {
        modal.form.coverUrl = undefined;
    }
    modal.form.imageFile = undefined; // Clear previous file selection

    // For el-cascader, selectedOptions needs to be an array of codes.
    // This requires a robust way to convert location string "省/市/区" back to codes.
    // This is a simplified placeholder. You might need a utility function for this.
    if (record.location && typeof record.location === 'string') {
        // Placeholder: You need a function to find codes from text.
        // e.g., selectedOptions.value = findCodesFromLocationText(record.location, regionData);
        // For now, we'll clear it, user has to re-select if editing location.
        selectedOptions.value = [];
    } else {
        selectedOptions.value = [];
    }
    modal.visile = true;
};

const handleConfirmDelete = (record: any) => {
    deleteUserThingApi({ id: record.id, type: activeViewType.value }) // Pass type if backend needs it
        .then(() => {
            message.success('取消发布成功');
            activeViewType.value === 'lost' ? getUserLostThings() : getUserFoundThings();
        })
        .catch(err => message.error(err.msg || '操作失败'));
};

const handleMatchSuccess = (record: any) => {
    // 调用 updateUserThingStatusApi 时，传递 id, status, type, 和 userId
    // activeViewType.value 在此上下文中应为 'lost' 或 'found'
    updateUserThingStatusApi({ 
        thing_id: record.id, // 修改：将 id 键名更改为 thing_id
        status: 'completed', 
        type: activeViewType.value, // 物品类型 (lost 或 found)
        userId: userStore.user_id  // 物主ID，即当前登录用户的ID
    }) 
        .then(() => {
            message.success('标记为已完成');
            if (activeViewType.value === 'lost') getUserLostThings();
            else if (activeViewType.value === 'found') getUserFoundThings();
            getIncomingMatchRequests(); // 刷新匹配管理列表状态，以防万一相关
        })
        .catch(err => message.error(err.msg || '操作失败'));
};

// 新增：处理同意匹配请求
const handleConfirmMatchRequest = (record: any) => {
    // 确保 record.item_type (或 record.type) 存在
    if (!record || record.item_type === undefined) {
        message.error('物品类型未知，无法处理请求');
        console.error('handleConfirmMatchRequest: item_type is undefined in record', record);
        return;
    }
    respondToMatchRequestApi({ thingId: record.record_id, itemType: record.item_type, action: 'confirm' })
        .then(res => {
            message.success(res.msg || '已同意匹配');
            getIncomingMatchRequests(true); 
            // 根据 record.item_type 刷新对应的列表
            if (record.item_type === 'lost') getUserLostThings();
            else if (record.item_type === 'found') getUserFoundThings();
        })
        .catch(err => message.error(err.msg || '操作失败'));
};

// 新增：处理拒绝匹配请求
const handleRejectMatchRequest = (record: any) => {
    // 确保 record.item_type (或 record.type) 存在
    if (!record || record.item_type === undefined) {
        message.error('物品类型未知，无法处理请求');
        console.error('handleRejectMatchRequest: item_type is undefined in record', record);
        return;
    }
    respondToMatchRequestApi({ thingId: record.record_id, itemType: record.item_type, action: 'reject' })
        .then(res => {
            message.success(res.msg || '已拒绝匹配');
            getIncomingMatchRequests(true); 
            // 根据 record.item_type 刷新对应的列表
            if (record.item_type === 'lost') getUserLostThings();
            else if (record.item_type === 'found') getUserFoundThings();
        })
        .catch(err => message.error(err.msg || '操作失败'));
};

// 修改 formatStatus 以更好地区分状态
const formatStatus = (status: string, itemType: 'lost' | 'found', matchStatus?: string, isRequester?: boolean) => {
    if (matchStatus) {
        switch (matchStatus) {
            case 'pending':
                return isRequester ? '已请求,待确认' : '有新匹配请求';
            case 'confirmed':
                return '已同意匹配';
            case 'rejected':
                return '匹配已拒绝';
            case 'completed':
                return '匹配已完成';
            case 'cancelled':
                return '匹配已取消';
            default:
                break;
        }
    }
    // 旧的 status 字段处理逻辑 (如果物品没有 match_status)
    if (status === 'matched' || status === 'completed') return itemType === 'lost' ? '已找到' : '已归还';
    if (status === '0' || status === 'pending' || status === '1' || status === 'active' || !status) return itemType === 'lost' ? '寻找中' : '寻主中';
    return status; 
};

// 新增：格式化匹配状态文本 (用于匹配管理列表)
const formatMatchStatus = (status?: string) => {
    switch (status) {
        case 'pending': return '等待处理';
        case 'confirmed': return '已同意';
        case 'rejected': return '已拒绝';
        case 'completed': return '已完成';
        case 'cancelled': return '已取消';
        default: return '未知状态';
    }
};

// 新增：获取匹配状态标签颜色
const getMatchStatusTagColor = (status?: string) => {
    switch (status) {
        case 'pending': return 'orange';
        case 'confirmed': return 'green';
        case 'rejected': return 'red';
        case 'completed': return 'blue';
        case 'cancelled': return 'default';
        default: return 'default';
    }
}; 

// 修改：跳转到物品详情页，使用 record.record_id 和 record.item_type
const gotoDetail = (record: any) => {
    // 确保 record_id 和 item_type 存在，如果不存在则给出提示或不跳转
    if (record && record.record_id !== undefined && record.item_type !== undefined) {
        router.push({ name: 'detail', query: { id: record.record_id, type: record.item_type } });
    } else {
        console.error('无法跳转到详情页：record_id 或 item_type 未定义', record);
        message.error('无法获取物品详情，信息不完整。');
    }
};

const handleOk = () => {
    myform.value?.validate().then(() => {
        const formData = new FormData();
        if (modal.editFlag && modal.form.id) {
            formData.append('id', modal.form.id);
        }
        formData.append('title', modal.form.title || '');
        if (modal.form.classification) formData.append('classification', modal.form.classification);
        
        if (modal.form.tag && modal.form.tag.length > 0) {
            modal.form.tag.forEach(t => formData.append('tag', t));
        } else {
            // If tags are optional and backend expects an empty list or specific handling
            // formData.append('tag', ''); // Or handle as per backend requirement
        }

        if (modal.form.imageFile) {
            formData.append('cover', modal.form.imageFile);
        } else if (modal.editFlag && modal.form.coverUrl && !modal.form.imageFile) {
            // If editing and image not changed, backend might not need 'cover' field
            // or you might send the existing URL if backend supports it.
            // For simplicity, if imageFile is not set, 'cover' is not appended.
        }

        formData.append('description', modal.form.description || '');
        formData.append('points', String(modal.form.points || 0));
        formData.append('mobile', modal.form.mobile || '');
        formData.append('location', modal.form.location || '');
        formData.append('user', userStore.user_id); // Associate with current user
        formData.append('type', modal.form.type); // 'lost' or 'found'

        const apiCall = modal.editFlag
            ? updateUserThingApi({ id: modal.form.id }, formData)
            : (modal.form.type === 'lost' ? createUserThingApi(formData) : createUserFoundThingApi(formData));

        apiCall.then(() => {
            message.success(modal.editFlag ? '更新成功' : '发布成功');
            hideModal();
            modal.form.type === 'lost' ? getUserLostThings() : getUserFoundThings();
        }).catch(err => message.error(err.msg || '操作失败'));
    }).catch(err => console.log('表单验证失败:', err));
};

const handleCancel = () => hideModal();

const resetModal = () => {
    myform.value?.resetFields();
    fileList.value = [];
    selectedOptions.value = [];
    modal.form.id = undefined;
    modal.form.title = undefined;
    modal.form.classification = undefined;
    modal.form.tag = [];
    modal.form.points = undefined;
    modal.form.mobile = undefined;
    modal.form.location = undefined;
    modal.form.description = undefined;
    modal.form.coverUrl = undefined;
    modal.form.imageFile = undefined;
};

const hideModal = () => modal.visile = false;

</script>

<style scoped lang="less">
.page-view {
    min-height: auto; 
    background: #fff;
    padding: 24px;
    display: flex;
    flex-direction: column;
    width: 123%; /* 保持100%，使其填充父容器提供的空间 */
    /* 如果thing-edit-view是flex子项，可以考虑 flex: 1; 来占据剩余空间 */
}

.view-toggle-buttons {
    margin-bottom: 20px;
    display: flex; 
    align-items: center; /* 垂直居中对齐 "发布新的..." 按钮和分段控件 */
}

/* 新增：分段控件样式 */
.segmented-control {
    display: inline-flex; /* 使其内容内联排列 */
    border-radius: 6px; /* 轻微的圆角 */
    overflow: hidden; /* 确保子元素的圆角效果 */
    border: 1px solid #d9d9d9; /* 整体边框 */
    box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* 轻微阴影增加立体感 */
}

.segment-button {
    padding: 8px 18px; /* 按钮内边距 */
    border: none; /* 移除默认边框 */
    background-color: #fff; /* 默认背景色 */
    cursor: pointer;
    font-size: 14px;
    color: #555; /* 默认文字颜色 */
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    outline: none; /* 移除焦点时的轮廓 */
}

.segment-button:not(:last-child) {
    border-right: 1px solid #d9d9d9; /* 分隔线 */
}

.segment-button.active {
    background-color: #1890ff; /* Ant Design 主色调 */
    color: #fff; /* 活动状态文字颜色 */
    font-weight: 500; /* 活动状态文字加粗 */
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); /* 活动状态内阴影 */
    position: relative; // 为了徽标定位
}

.segment-button .ant-badge {
    position: absolute;
    top: 2px;
    right: 2px;
}

.segment-button:hover:not(.active) {
    background-color: #f5f5f5; /* 非活动状态鼠标悬停背景色 */
    color: #333;
}
/* 分段控件样式结束 */

.section-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #333;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-button {
    color: #1890ff;
    cursor: pointer;
    padding: 0 6px; // Slightly reduced padding
    white-space: nowrap;
}

.action-button:hover {
    color: #40a9ff;
}

a-divider {
    margin: 0 6px; // Slightly reduced margin
}

// Ensure el-cascader takes full width in form item
:deep(.el-cascader) {
    width: 100%;
}
</style>