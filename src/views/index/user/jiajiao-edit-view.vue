<template>
  <div class="content-list">
    <div class="list-title">发布失物信息</div>
    <a-spin :spinning="loading" style="min-height: 200px;">
      <div class="list-content">
        <div class="edit-view">
          <!-- 图片上传部分 -->
          <div class="item flex-view">
            <div class="label">图片</div>
            <div class="right-box avatar-box flex-view">
              <a-col span="24">
                <a-form-item label="">
                  <a-upload-dragger
                    name="file"
                    accept="image/*"
                    :multiple="false"
                    :before-upload="beforeUpload"
                    :show-upload-list="false"  
                    class="custom-uploader"
                  >
                    <p class="ant-upload-drag-icon">
                      <!-- 使用本地预览 URL -->
                      <template v-if="tData.form.previewUrl">
                        <img :src="tData.form.previewUrl" class="preview-image" />
                      </template>
                      <template v-else>
                        <file-image-outlined />
                      </template>
                    </p>
                    <p class="ant-upload-text">请选择或拖拽图片到此处</p>
                  </a-upload-dragger>
                </a-form-item>
              </a-col>
            </div>
          </div>
          <!-- 标题 -->
          <div class="item flex-view">
            <div class="label title-label">标题</div>
            <div class="right-box">
              <input 
                type="text" 
                v-model="tData.form.title" 
                placeholder="请输入寻物标题" 
                maxlength="20" 
                class="input-dom"
              >
              <p class="tip">支持中英文，长度不能超过 20 个字符</p>
            </div>
          </div>

          <!-- 地区选择 -->
          <div class="item flex-view">
            <div class="label">地区</div>
            <el-cascader 
              :options="tData.regionDatas" 
              v-model="selectedOptions" 
              placeholder="请选择"
              @change="handleChange"
              class="region-select"
            ></el-cascader>
          </div>
          
          <!-- 详细丢失地点 -->
          <div class="item flex-view">
            <div class="label">详细丢失地点</div>
            <div class="right-box">
              <input 
                type="text" 
                v-model="tData.form.detailLocation" 
                placeholder="请输入详细丢失地点" 
                maxlength="50" 
                class="input-dom"
              >
            </div>
          </div>

          <!-- 奖励方式 -->
          <div class="item flex-view">
          <div class="label">积分奖励</div>
          <div class="right-box">
            <input 
              type="number" 
              v-model="tData.form.points" 
              min="0" 
              max="15"
              placeholder="请输入积分数 (最多10积分)" 
              class="input-dom"
              @input="limitPoints"
            >
          </div>
        </div>

          <!-- 联系人手机号 -->
          <div class="item flex-view">
            <div class="label">联系人手机号</div>
            <div class="right-box">
              <input 
                type="text" 
                v-model="tData.form.mobile" 
                placeholder="请输入手机号" 
                maxlength="11"
                class="input-dom"
              >
            </div>
          </div>

          <!-- 物品分类和标签双列布局 -->
          <div class="dual-column-container">
            <!-- 物品分类 -->
            <div class="item flex-view dual-column-item">
              <div class="label">物品分类</div>
              <div class="right-box">
                <a-select 
                  placeholder="请选择" 
                  allowClear 
                  :options="cData" 
                  class="classification-select"
                  :field-names="{ label: 'title', value: 'id' }" 
                  v-model:value="tData.form.classification"
                ></a-select>
              </div>
            </div>

            <!-- 标签 -->
            <div class="item flex-view dual-column-item">
              <div class="label">标签</div>
              <div class="right-box">
                <a-select 
                  placeholder="请选择" 
                  mode="multiple" 
                  class="tag-select"
                  allowClear
                  v-model:value="tData.form.tag"
                >
                  <template v-for="item in tData.tagData">
                    <a-select-option :value="item.id">{{ item.title }}</a-select-option>
                  </template>
                </a-select>
              </div>
            </div>
          </div>

          <!-- 物品描述 -->
          <div class="item flex-view">
            <div class="label">物品描述</div>
            <div class="right-box">
              <textarea 
                v-model="tData.form.description" 
                placeholder="请输入描述" 
                maxlength="200" 
                class="intro"
              ></textarea>
              <p class="tip">限制200字以内</p>
            </div>
          </div>

          <!-- 提交按钮 -->
          <button class="save mg" @click="submit()">发布</button>
          <p class="form-notice">
              发布即表示同意《用户服务协议》，我们将在审核通过后展示您的信息
            </p>
        </div>
      </div>
    </a-spin>
  </div>
</template>


<script setup>
import { message } from "ant-design-vue";
import { codeToText, regionData } from 'element-china-area-data';
import { listApi as listClassificationApi } from '/@/api/admin/classification';
import { listApi as listTagApi } from '/@/api/admin/tag';
import { createApi, listUserThingApi, updateApi } from '/@/api/index/thing';
import { useUserStore } from "/@/store";
import { BASE_URL } from "/@/store/constants";
// import COS from 'cos-js-sdk-v5'; // <--- 移除 COS SDK 导入
import { FileImageOutlined } from '@ant-design/icons-vue'; // 确保图标已导入

const router = useRouter();
const userStore = useUserStore();

// --- 移除 COS 实例创建 ---
// const cos = new COS({ ... });

const selectedOptions = ref([])

let loading = ref(false)
const tData = reactive({
  tagData: [{}],
  regionDatas: regionData,
  form: {
    // avatar: undefined, // 这个字段似乎未使用，可以移除
    avatarFile: null, // 用于存储文件对象
    title: undefined,
    // price: undefined, // 这个字段似乎未使用，如果是积分奖励，使用 points
    points: undefined, // 积分奖励字段
    tag: [],
    mobile: undefined,
    location: undefined, // 省市区
    detailLocation: undefined, // 详细地址
    description: undefined,
    // coverUrl: undefined, // 不再需要前端直接处理上传后的 URL
    previewUrl: null, // 用于本地预览图片
    classification: undefined,
    longitude: undefined,
    latitude: undefined,
    id: undefined, // 用于判断是创建还是更新
  }
})

let cData = ref([])
let fileList = ref([]); // 虽然不显示列表，但保留以配合 a-upload-dragger

onMounted(() => {
  getCDataList()
  getTagDataList()
  // 如果是编辑模式，需要获取现有数据
  // getUserThing() // 暂时注释掉，根据需要启用
})

//获取标签
const getTagDataList = () => {
  listTagApi({}).then((res) => {
    tData.tagData = res.data;
  });
};

// 限制积分
const limitPoints = () => {
  if (tData.form.points > 10) {
    tData.form.points = 10;
    message.warn("积分奖励最多10分");
  } else if (tData.form.points < 0) {
    tData.form.points = 0;
  }
};

//获取地点
const handleChange = () => {
  if (selectedOptions.value.length === 3) {
    const province = codeToText[selectedOptions.value[0]];
    const city = codeToText[selectedOptions.value[1]];
    const district = codeToText[selectedOptions.value[2]];
    const directMunicipalities = ["北京市", "上海市", "天津市", "重庆市"];
    let regionText = "";
    if (directMunicipalities.includes(province)) {
      regionText = province + district;
    } else {
      regionText = province + city + district;
    }
    tData.form.location = regionText;
  } else {
     tData.form.location = undefined; // 清空地区如果选择不完整
  }
};

// --- 修改 beforeUpload ---
// 处理图片选择和预览
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false; // 阻止非图片文件
  }
  const isLt2M = file.size / 1024 / 1024 < 2; // 限制大小为 2MB
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return false;
  }

  // 生成本地预览 URL
  tData.form.previewUrl = URL.createObjectURL(file);
  // 保存文件对象以备提交
  tData.form.avatarFile = file;

  fileList.value = [file]; // 更新 fileList 以触发组件状态，虽然不显示

  return false; // 阻止 antdv 的默认上传行为
};


const getCDataList = () => {
  listClassificationApi({}).then(res => {
    cData.value = res.data
  })
}

// --- 获取用户现有物品信息（编辑时用） ---
// const getUserThing = () => { ... } // 如果需要编辑功能，取消注释并实现

//地址经纬度解析
const getGeoLocation = () => {
  // 确保 BMapGL 已加载
  if (!window.BMapGL || !window.BMapGL.Geocoder) {
     message.error("地图服务未加载，无法解析地址");
     return Promise.reject("地图服务未加载");
  }
  const myGeo = new BMapGL.Geocoder();
  const fullAddress = getFullAddress(); // 使用辅助函数获取完整地址
   if (!fullAddress) {
     return Promise.reject("地址信息不完整");
   }
  return new Promise((resolve, reject) => {
    myGeo.getPoint(fullAddress, (point) => {
      if (point) {
        resolve({ lng: point.lng, lat: point.lat });
      } else {
        // 尝试仅使用省市区进行解析
        myGeo.getPoint(tData.form.location, (pointFallback) => {
           if (pointFallback) {
             console.warn(`详细地址 "${fullAddress}" 解析失败，已回退到省市区解析`);
             resolve({ lng: pointFallback.lng, lat: pointFallback.lat });
           } else {
             console.error(`地址 "${fullAddress}" 及省市区 "${tData.form.location}" 均无法解析`);
             reject(`无法解析地址: ${fullAddress}`);
           }
        });
      }
    }, tData.form.location || "全国"); // 提供城市信息以提高精度
  });
};

// --- 辅助函数，用于获取完整地址 ---
const getFullAddress = () => {
  let address = tData.form.location || '';
  if (tData.form.detailLocation) {
    // 简单拼接，后端可以进一步处理去重等逻辑
    address += tData.form.detailLocation;
  }
  return address.trim();
};


// --- 修改 submit 函数 ---
const submit = async () => {
  let formData = new FormData()
  let userId = userStore.user_id

  // --- 表单验证 ---
  if (!tData.form.title) {
    message.warn("寻物标题不能为空"); return;
  }
  if (!tData.form.mobile) {
    message.warn("手机号不能为空"); return;
  }
   if (!/^\d{11}$/.test(tData.form.mobile)) {
    message.warn("请输入有效的11位手机号"); return;
  }
  if (!tData.form.location) {
    message.warn("地区不能为空"); return;
  }
   if (tData.form.points === undefined || tData.form.points === null || tData.form.points < 0) { // 包含 null 检查
    message.warn("积分奖励不能为空且不能为负数"); return;
  }
  // 积分限制已在 input 事件处理
  // if (tData.form.points > 10) { ... }
  if (!tData.form.description) {
    message.warn("物品描述不能为空"); return;
  }
   // 检查是否有文件被选中（编辑时可能没有新文件）
   if (!tData.form.avatarFile && !tData.form.id) { // 创建时必须有文件
     message.warn("请上传物品图片"); return;
   }
   // --- 结束表单验证 ---


  // --- 填充表单数据 ---
  formData.append('title', tData.form.title);
  formData.append('mobile', tData.form.mobile);
  formData.append('location', tData.form.location); // 省市区
  formData.append('points', tData.form.points.toString()); // 积分
  formData.append('description', tData.form.description);
  formData.append('user', userId);
  formData.append('status', '0'); // 0 代表失物信息 (寻找中)
  formData.append('type', 'lost'); // 明确类型为失物

  if (tData.form.classification) {
    formData.append('classification', tData.form.classification);
  }
  if (tData.form.tag && tData.form.tag.length > 0) {
    tData.form.tag.forEach(tagId => {
      if (tagId) formData.append('tag', tagId);
    });
  }
   if (tData.form.detailLocation) {
    formData.append('detail_location', tData.form.detailLocation); // 详细地址
  }

  // --- 图片文件处理 ---
  // 只有当用户选择了新文件时才添加到 FormData
  if (tData.form.avatarFile) {
     formData.append('cover', tData.form.avatarFile); // 'cover' 是后端接收文件的字段名
  }
  // --- 结束图片文件处理 ---


  // --- 获取经纬度 ---
  const fullAddress = getFullAddress();
  if (!fullAddress && !tData.form.location) { // 确保至少有省市区信息
    message.warn("请完善地址信息");
    return;
  }

  loading.value = true; // 开始加载

  try {
    // 尝试解析经纬度，如果失败则不阻塞提交，后端可以再次尝试或留空
    try {
       const locationPoint = await getGeoLocation();
       formData.append('longitude', locationPoint.lng.toFixed(6));
       formData.append('latitude', locationPoint.lat.toFixed(6));
    } catch (geoError) {
       console.warn("地理编码失败:", geoError);
       message.warn("地址解析失败，经纬度将留空");
       // 不再 return，允许提交，让后端处理
       // formData.append('longitude', ''); // 或者根据后端要求传空值
       // formData.append('latitude', '');
    }


    console.log("准备提交的表单数据:"); // 打印查看
    for (let pair of formData.entries()) {
       console.log(pair[0]+ ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }

    // --- 发送请求 ---
    if (tData.form.id) { // 如果有 id，执行更新操作
      await updateApi({ id: tData.form.id }, formData);
      message.success('更新成功！');
    } else { // 否则执行创建操作
      await createApi(formData);
      message.success('发布成功！等待审核');
      // 清空表单或跳转
      // resetForm(); // 可以添加一个清空表单的函数
      // router.push({ name: 'portal' });
    }
  } catch (error) {
    console.error("提交失败:", error);
    // 尝试从 error 对象中获取更具体的后端错误信息
    const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || '操作失败，请稍后重试';
    message.error(errorMsg);
  } finally {
    loading.value = false; // 结束加载
  }
};

// 清空表单的函数示例
const resetForm = () => {
   Object.keys(tData.form).forEach(key => {
     if (key === 'tag') {
       tData.form[key] = [];
     } else {
       tData.form[key] = undefined;
     }
   });
   tData.form.avatarFile = null;
   tData.form.previewUrl = null;
   selectedOptions.value = [];
   fileList.value = [];
};

</script>


<style scoped lang="less">
@font-face {
  font-family: 'FZJZJW';
  src: url('/src/assets/fonts/FZJZJW.TTF') format('truetype');
}

@primary-color: #ee8131;
@secondary-color: #6a8ee6;
@background-color: #f8fafb;
@border-color: #e0e4e8;
@text-color: #152844;
@error-color: #ff4d4f;

@border-radius: 8px;
@input-height: 40px;
@spacing: 24px;

.content-list {
  width: 104%;
  max-width: 1200px;
  min-width: 931px;
  margin: 0 auto;
  padding: @spacing;
  background: #fff0f0af;
  border-radius: @border-radius;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: width 0.3s;

  .list-title {
    font-size: 24px;
    color: @primary-color;
    margin-bottom: 20px;
    padding-bottom: 3px;
    border-bottom: 2px solid #eee;
    font-weight: 600;
    font-family: 'FZJZJW', -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  }

  .dual-column-container {
    display: flex;
    gap: 24px;
    width: 98%;

    .dual-column-item {
      flex: 1;
      min-width: 300px;
      margin-bottom: @spacing;

      .label {
        width: 80px;
      }

      .right-box {
        :deep(.ant-select) {
          width: 100% !important;
        }
      }
    }
  }

  .edit-view {
    .item {
      display: flex;
      align-items: center;
      margin-bottom: @spacing;
      gap: 20px;

      .label {
        width: 120px;
        font-weight: 500;
        color: @text-color;
        font-size: 15px;
        flex-shrink: 0;
      }

      .right-box {
        flex: 1;
        width: 100%;

        .input-dom, 
        .intro, 
        :deep(.ant-select-selector), 
        :deep(.ant-input) {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid @border-color;
          border-radius: @border-radius;
          transition: all 0.3s;
          background: @background-color;
          height: @input-height;

          &:focus {
            border-color: @primary-color;
            box-shadow: 0 0 0 2px fade(@primary-color, 20%);
          }
        }

        .intro {
          height: 150px; // 修改高度为150px
        }
      }

      .title-label {
        position: relative;
        top: -14px; // 向上移动15px
      }
    }

    .save {
      width: 100%;
      max-width: 200px;
      margin: -7px 0 24px 145px;
      padding: 12px;
      background: linear-gradient(135deg, @primary-color, @secondary-color);
      border-radius: @border-radius;
      color: #fff;
      font-weight: 500;
      transition: all 0.3s;
      border: none;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px fade(@primary-color, 30%);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 992px) {
  .content-list {
    width: 95%;
    min-width: unset;
    padding: 16px;

    .dual-column-container {
      flex-direction: column;

      .dual-column-item {
        width: 100%;
        min-width: unset;
      }
    }

    .edit-view .save {
      margin-left: 0;
      max-width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .content-list {
    width: 100%;
    border-radius: 0;

    .edit-view {
      .item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;

        .label {
          width: 100%;
        }
      }
    }
  }
}
.input-dom[type="number"] {
  width: 100%;
  max-width: 238px;
}

.preview-image {
  max-width: 100px; /* 限制预览图最大宽度 */
  max-height: 100px; /* 限制预览图最大高度 */
  object-fit: contain; /* 保持图片比例 */
}

.custom-uploader {
  :deep(.ant-upload-list) {
    display: none; /* 隐藏默认的文件列表 */
  }
  :deep(.ant-upload-drag) {
     border-radius: @border-radius;
     background: @background-color;
     border: 1px dashed @border-color;
     padding: 10px; /* 调整内边距 */
     height: auto; /* 自适应高度 */
     min-height: 120px; /* 最小高度 */
     display: flex;
     flex-direction: column;
     justify-content: center;
     align-items: center;
  }
   :deep(.ant-upload-drag-icon .anticon) {
    font-size: 32px; /* 调整图标大小 */
    color: #999;
  }
   :deep(.ant-upload-text) {
    font-size: 14px;
    color: #666;
    margin-top: 8px;
  }
}

.form-notice {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
  margin-left: 145px; /* 与按钮对齐 */
}
</style>