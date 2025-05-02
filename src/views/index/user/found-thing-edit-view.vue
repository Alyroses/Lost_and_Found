<template>
    <div class="content-list">
      <!-- 修改标题部分，更换图标并添加 class -->
      <div class="list-title">
        <search-outlined class="title-icon" /> 发布拾物信息
      </div>
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
                      <p class="ant-upload-text">请选择或拖拽拾物图片到此处</p>
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
              <div class="label">详细拾物地点</div>
              <div class="right-box">
                <input 
                  type="text" 
                  v-model="tData.form.detailLocation" 
                  placeholder="请输入详细拾物地点" 
                  maxlength="50" 
                  class="input-dom"
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
                  class="input-dom mobile-input"
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

            <!-- 新增：同意协议部分 -->
            <div class="terms-container">
              <a-checkbox v-model:checked="agreedToTerms"></a-checkbox>
              <p class="form-notice">
                勾选表示同意《用户服务协议》，我们将在审核通过后展示您的信息
              </p>
            </div>
  
            <!-- 提交按钮 -->
            <button class="save mg" @click="submit()">发布</button>
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
  // 确保导入 createFoundApi
  import { createApi, listUserThingApi, updateApi, createFoundApi } from '/@/api/index/thing';
  import { useUserStore } from "/@/store";
  import { BASE_URL } from "/@/store/constants";
  // 导入图标
  import { FileImageOutlined, SearchOutlined } from '@ant-design/icons-vue';
  // 导入 ref, reactive, onMounted
  import { ref, reactive, onMounted } from 'vue';
  // 导入 useRouter
  import { useRouter } from 'vue-router'; // 确保导入 useRouter

  const router = useRouter();
  const userStore = useUserStore();

  const selectedOptions = ref([])
  let loading = ref(false)
  // 同意协议状态
  const agreedToTerms = ref(false);
  // 文件列表，虽然不显示，但保留以配合 a-upload-dragger
  let fileList = ref([]);

  const tData = reactive({
    tagData: [{}],
    regionDatas: regionData,
    form: {
      // avatar: undefined, // 移除
      avatarFile: null, // 用于存储文件对象
      title: undefined,
      // price: undefined, // 移除
      tag: [],
      mobile: undefined,
      location: undefined, // 省市区
      detailLocation: undefined, // 详细地址
      description: undefined,
      // coverUrl: undefined, // 移除
      previewUrl: null, // 用于本地预览图片
      classification: undefined,
      longitude: undefined,
      latitude: undefined,
      id: undefined, // 用于判断是创建还是更新
    }
  })

  let cData = ref([])

  onMounted(() => {
    getCDataList()
    getTagDataList()
    // 如果是编辑模式，需要获取现有数据
    // getUserThing() // 暂时注释掉，根据需要启用
  })


  //获取标签
  const getTagDataList = () => {
    listTagApi({}).then((res) => {
      // 移除旧的 index 添加逻辑
      // res.data.forEach((item, index) => {
      //   item.index = index + 1;
      // });
      tData.tagData = res.data;
    });
  };

  //获取地点 - 更新逻辑
  const handleChange = () => {
    if (selectedOptions.value && selectedOptions.value.length > 0) {
      // 将编码转换为文本，使用 '/' 分隔符
      tData.form.location = selectedOptions.value.map(code => codeToText[code]).join('/');
    } else {
      tData.form.location = undefined; // 清空地区如果选择不完整
    }
    console.log("Selected Region Text:", tData.form.location);
  };


  // 处理图片选择和预览 - 更新逻辑
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

  // --- 新增：地址经纬度解析函数 ---
  const getGeoLocation = () => {
    return new Promise((resolve, reject) => {
      // 确保 BMapGL 已加载
      if (!window.BMapGL || !window.BMapGL.Geocoder) {
        message.error("地图服务未加载，无法解析地址");
        return reject("地图服务未加载");
      }

      const myGeo = new BMapGL.Geocoder();
      const regionAddress = tData.form.location; // 省/市/区 文本
      const detailAddress = tData.form.detailLocation || ''; // 详细地址
      const fullAddress = regionAddress ? (regionAddress + (detailAddress ? '/' + detailAddress : '')) : detailAddress; // 优先组合地址

      if (!fullAddress) {
        console.warn("地址信息不完整，无法进行地理编码");
        // 地址不完整时，可以选择返回 null 或 reject
        // return resolve(null); // 返回 null，让 submit 函数决定如何处理
        return reject("地址信息不完整"); // 或者直接 reject
      }

      console.log("Attempting to geocode address:", fullAddress);
      // 提供城市信息给API以提高精度，尝试从 regionAddress 中提取市级信息
      const cityHint = regionAddress ? regionAddress.split('/')[1] || regionAddress.split('/')[0] : "全国";

      myGeo.getPoint(fullAddress, (point) => {
        if (point) {
          console.log(`地址 "${fullAddress}" 解析成功:`, point);
          resolve({ lng: point.lng, lat: point.lat });
        } else {
          console.error(`地址 "${fullAddress}" 无法解析`);
          // 地址解析失败，reject Promise
          reject(`无法解析地址: ${fullAddress}`);
        }
      }, cityHint); // 提供城市信息以提高精度
    });
  };

  // --- 新增：辅助函数，用于获取完整地址 ---
  const getFullAddress = () => {
    let address = tData.form.location || '';
    if (tData.form.detailLocation) {
      address += '/' + tData.form.detailLocation; // 使用 / 分隔
    }
    return address.trim();
  };

  // --- 重构 submit 函数 ---
  const submit = async () => {
    // --- 检查是否同意协议 ---
    if (!agreedToTerms.value) {
      message.warn("请先阅读并勾选同意《用户服务协议》");
      return;
    }

    let formData = new FormData()
    let userId = userStore.user_id

    // --- 表单验证 ---
    if (!tData.form.title) {
      message.warn("拾物标题不能为空"); return;
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
    // 详细地点现在是可选的
    // if (!tData.form.detailLocation) {
    //   message.warn("详细拾物地点不能为空"); return;
    // }
    if (!tData.form.description) {
      message.warn("物品描述不能为空"); return;
    }
     if (!tData.form.avatarFile && !tData.form.id) { // 创建时必须有文件
       message.warn("请上传物品图片"); return;
     }

    // --- 获取经纬度 ---
    const fullAddress = getFullAddress();
    if (!fullAddress && !tData.form.location) { // 确保至少有省市区信息
      message.warn("请完善地址信息");
      return;
    }

    loading.value = true; // 开始加载
    let locationPoint = null;

    try {
      locationPoint = await getGeoLocation(); // 调用地理编码函数
      console.log("Geocoding successful:", locationPoint);
    } catch (geoError) {
      console.error("Geocoding failed:", geoError);
      // 根据错误类型给出不同提示
      if (geoError === "地图服务未加载") {
        message.error("地图服务加载失败，请刷新页面重试");
      } else if (geoError === "地址信息不完整") {
        message.warn("地址信息不完整，无法获取精确位置");
        // 可以选择继续提交，但不包含经纬度，或者提示用户完善地址
        // 如果希望继续提交，可以在这里设置 locationPoint 为 null 或 {}
      } else if (typeof geoError === 'string' && geoError.startsWith("无法解析地址")) {
         message.warn(geoError + "，将不会记录精确位置");
         // 地址无法解析，也允许继续提交，但不包含经纬度
      } else {
        message.error("地址解析时发生未知错误");
      }
      // 如果地址解析失败，可以选择是否阻止提交
      // 如果不阻止，确保后续逻辑能处理 locationPoint 为 null 的情况
      // 如果要阻止，则取消下面的注释
      // loading.value = false;
      // return;
    }

    // --- 填充基础表单数据 ---
    formData.append('title', tData.form.title);
    formData.append('mobile', tData.form.mobile);
    formData.append('location', tData.form.location); // 省市区
    formData.append('description', tData.form.description);
    formData.append('user', userId);
    formData.append('status', '0'); // 0 代表拾物信息 (待认领)
    formData.append('type', 'found'); // 明确类型为拾物

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

    // --- 添加经纬度 (如果获取成功) ---
    if (locationPoint && typeof locationPoint.lng === 'number' && typeof locationPoint.lat === 'number') {
      formData.append('longitude', locationPoint.lng.toFixed(6)); // 保留6位小数
      formData.append('latitude', locationPoint.lat.toFixed(6)); // 保留6位小数
    } else {
      console.warn("经纬度信息无效或未获取，将不添加到表单中");
      // 可以选择发送默认值或不发送
      // formData.append('longitude', '0');
      // formData.append('latitude', '0');
    }

    // --- 图片文件处理 ---
    if (tData.form.avatarFile) {
       formData.append('cover', tData.form.avatarFile); // 'cover' 是后端接收文件的字段名
    }

    // --- 打印 FormData 内容以供调试 ---
    console.log("准备提交的表单数据 (Found Thing):");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }

    // --- 发送请求 ---
    try {
      if (tData.form.id) { // 如果有 id，执行更新操作
        await updateApi({ id: tData.form.id }, formData);
        message.success('更新成功！');
        // location.reload(); // 可以选择刷新或跳转
        resetForm(); // 清空表单
        // router.push({ name: 'userCenter' }); // 跳转到用户中心或其他页面
      } else { // 否则执行创建操作，使用 createFoundApi
        await createFoundApi(formData); // 调用拾物创建接口
        message.success('发布成功！等待审核');
        resetForm(); // 清空表单
        // location.reload(); // 可以选择刷新或跳转
        // router.push({ name: 'portal' }); // 跳转到首页或其他页面
      }
    } catch (error) {
      console.error("提交失败:", error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || '操作失败，请稍后重试';
      message.error(errorMsg);
    } finally {
      loading.value = false; // 结束加载
    }
  };

  // --- 新增：清空表单的函数 ---
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
     agreedToTerms.value = false; // 重置同意状态
  };

  </script>
  
  <style scoped lang="less">
@font-face {
  font-family: 'FZJZJW';
  src: url('/src/assets/fonts/FZJZJW.TTF') format('truetype');
}

@primary-color: #873692; // 主题色 (与 jiajiao-edit-view 一致)
@secondary-color: #6a8ee6;
@background-color: #f8fafb;
@border-color: #e0e4e8;
@text-color: #152844;
@error-color: #ff4d4f;

@border-radius: 8px;
@input-height: 40px;
@spacing: 21px;

.content-list {
  width: 104%;
  max-width: 1200px;
  min-width: 931px;
  margin: 0 auto;
  padding: @spacing;
  background: #fff0f0af; // 背景色 (与 jiajiao-edit-view 一致)
  border-radius: @border-radius;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: width 0.3s;

  .list-title {
    font-size: 27px;
    color: @primary-color; // 使用主题色
    margin-bottom: 20px;
    padding-bottom: 3px;
    border-bottom: 2px solid #eee;
    font-weight: 600;
    font-family: 'FZJZJW', -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -15px;

    .title-icon {
      transition: transform 0.3s ease-in-out;
    }

    &:hover .title-icon {
      transform: rotate(360deg);
    }
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
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateX(3px);
      }

      .label {
        width: 120px;
        color: @text-color;
        flex-shrink: 0;
        font-size: 16px;
        font-weight: 600;
        font-weight: bold;
      }

      .right-box {
        flex: 1;
        width: 100%;

        .input-dom,
        .intro,
        :deep(.ant-select-selector),
        :deep(.el-input__inner), // 兼容 el-cascader
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
            box-shadow: 0 0 0 3px fade(@primary-color, 20%);
            background-color: #fff;
          }
        }

        .intro {
          height: 150px;
        }

        // --- 移除 jiajiao-edit-view 特有的 reward-box 相关样式 ---
        // &.reward-box { ... }
        // .radio-group-wrapper { ... }
        // .reward-tip { ... }
        // :deep(.ant-radio-group) { ... }
        // .points-input { ... }
        // .mobile-input { ... }
        // --- 结束移除 ---
        .mobile-input {
          max-width: 250px; // 限制手机号输入框的最大宽度
        }
      }

      .title-label {
        position: relative;
        top: -12px;
      }
    }

    .save {
      width: 100%;
      max-width: 200px;
      margin: 0 0 24px 145px; // 保持与 jiajiao-edit-view 一致
      padding: 12px;
      background: linear-gradient(135deg, @primary-color, @secondary-color);
      border-radius: @border-radius;
      color: #fff;
      font-weight: 500;
      transition: all 0.3s, transform 0.2s ease-out;
      border: none;
      cursor: pointer;

      &:hover {
        opacity: 0.85;
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 6px 15px fade(@primary-color, 35%);
      }
       &:active {
         transform: translateY(-1px) scale(1);
         box-shadow: 0 4px 12px fade(@primary-color, 30%);
       }

      @media (max-width: 992px) {
        margin-left: 0;
      }
      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .terms-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 145px;
      margin-bottom: 16px;

      @media (max-width: 992px) {
        margin-left: 0;
      }
      @media (max-width: 768px) {
        margin-left: 0;
        align-items: flex-start;
      }
    }

    .form-notice {
      text-align: left;
      font-size: 14px;
      color: #0c0c0b;
      margin-top: 0;
      margin-left: 0;
      margin-bottom: 0;
      line-height: 1.5;
      font-weight: bold;
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
}

.preview-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
}

.custom-uploader {
  :deep(.ant-upload-list) {
    display: none;
  }
  :deep(.ant-upload-drag) {
     border-radius: @border-radius;
     background: @background-color;
     border: 1px dashed @border-color;
     padding: 10px;
     height: auto;
     min-height: 120px;
     display: flex;
     flex-direction: column;
     justify-content: center;
     align-items: center;
  }
   :deep(.ant-upload-drag-icon .anticon) {
    font-size: 32px;
    color: #999;
  }
   :deep(.ant-upload-text) {
    font-size: 14px;
    color: #666;
    margin-top: 8px;
  }
}

/* 移除 jiajiao-edit-view 特有的底部 form-notice */
/*
.form-notice {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
  margin-left: 145px;
}
*/
</style>