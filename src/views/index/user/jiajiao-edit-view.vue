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
                    v-model:file-list="fileList"
                    class="custom-uploader"
                  >
                    <p class="ant-upload-drag-icon">
                      <template v-if="tData.form.coverUrl">
                        <img :src="tData.form.coverUrl" class="preview-image" />
                      </template>
                      <template v-else>
                        <file-image-outlined />
                      </template>
                    </p>
                    <p class="ant-upload-text">请选择要上传的图片</p>
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
              placeholder="请输入积分数 (最多15积分)" 
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
const router = useRouter();
const userStore = useUserStore();

const selectedOptions = ref([])

let loading = ref(false)
const tData = reactive({
  tagData: [{}],
  regionDatas: regionData,
  form: {
    avatar: undefined,
    avatarFile: undefined,
    title: undefined,
    price: undefined,
    points: undefined, // 新增积分奖励字段
    tag: [],
    mobile: undefined,
    location: undefined,
    description: undefined,
    coverUrl: undefined,
    classification: undefined,
    longitude: undefined,
    latitude: undefined,
  }
})

let cData = ref([])

onMounted(() => {
  getCDataList()
  // getUserThing()
  getTagDataList()
})

//获取标签
const getTagDataList = () => {
  listTagApi({}).then((res) => {
    res.data.forEach((item, index) => {
      item.index = index + 1;
    });
    tData.tagData = res.data;
  });
};

const rewardType = ref("points");

// 限制积分
const limitPoints = () => {
  if (tData.form.points > 15) {
    tData.form.points = 15;
    message.warn("积分奖励最多15分");
  }
};

//获取地点
const handleChange = () => {
  console.log(selectedOptions.value)
  if (
    selectedOptions.value[0] != null &&
    selectedOptions.value[1] != null &&
    selectedOptions.value[2] != null
  ) {
    tData.form.location =
      codeToText[selectedOptions.value[0]] +
      '/' +
      codeToText[selectedOptions.value[1]] +
      '/' +
      codeToText[selectedOptions.value[2]]
  }
}

const beforeUpload = (file) => {
  // 改文件名
  const fileName = new Date().getTime().toString() + '.' + file.type.substring(6)
  const copyFile = new File([file], fileName)
  console.log(copyFile)
  tData.form.avatarFile = copyFile
  return false
}

const getCDataList = () => {
  listClassificationApi({}).then(res => {
    cData.value = res.data
  })
}

const getUserThing = () => {
  loading.value = true
  let userId = userStore.user_id
  listUserThingApi({ user: userId }).then(res => {
    console.log(res)
    if (res.data && res.data.length > 0) {
      tData.form = res.data[0]
    }
    if (tData.form.cover) {
      tData.form.avatar = BASE_URL + tData.form.cover
    }
    loading.value = false
  }).catch(err => {
    console.log(err)
    loading.value = false
  })
}

const submit = () => {
  let formData = new FormData()
  let userId = userStore.user_id

  // 检查并填充表单数据
  if (tData.form.avatarFile) {
    formData.append('cover', tData.form.avatarFile)
  }
  if (tData.form.title) {
    formData.append('title', tData.form.title)
  } else {
    message.warn("寻物标题不能为空")
    return
  }
  if (tData.form.classification) {
    formData.append('classification', tData.form.classification)
  }
  if (tData.form.tag) {
    tData.form.tag.forEach(function (value) {
      if (value) {
        formData.append('tag', value);
      }
    });
  }
  if (tData.form.mobile) {
    formData.append('mobile', tData.form.mobile)
  } else {
    message.warn("手机号不能为空")
    return
  }
  if (tData.form.location) {
    formData.append('location', tData.form.location)
  } else {
    message.warn("地区不能为空")
    return
  }
  
  // 积分验证
  if (tData.form.points === undefined || tData.form.points < 0) {
    message.warn("积分奖励不能为空且不能为负数");
    return;
  }
  if (tData.form.points > 15) {
    message.warn("积分奖励最多15分");
    return;
  }

  if (tData.form.description) {
    formData.append('description', tData.form.description)
  } else {
    message.warn("介绍不能为空")
    return
  }

  // 添加用户 ID 和状态
  formData.append('user', userId)
  formData.append('status', '1')

  // 使用百度地图 API 获取当前位置的经纬度
  let geolocation = new BMapGL.Geolocation()
  geolocation.getCurrentPosition(function (r) {
    if (this.getStatus() === BMAP_STATUS_SUCCESS) {
      // 获取成功，添加经纬度到 formData
      let longitude = r.point.lng
      let latitude = r.point.lat
      // 格式化经纬度，保留小数点后5位
      longitude = parseFloat(longitude.toFixed(5))
      latitude = parseFloat(latitude.toFixed(5))
      console.log(longitude)
      console.log(latitude)
      formData.append('longitude', longitude)
      formData.append('latitude', latitude)

      if (tData.form.id) {
        updateApi({ id: tData.form.id }, formData).then(res => {
          message.success('保存成功，后台审核中')
        }).catch(err => {
          console.log(err)
        })
      } else {
        createApi(formData).then(res => {
          message.success('保存成功，后台审核中')
        }).catch(err => {
          console.log(err)
        })
      }
    } else {
      message.error('无法获取当前位置')
    }
  }, { enableHighAccuracy: true })
}
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


</style>