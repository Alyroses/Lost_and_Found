<template>
    <div class="content-list">
      <div class="list-title">发布失物信息</div>
      <a-spin :spinning="loading" style="min-height: 200px;">
        <div class="list-content">
          <div class="edit-view">
            <div class="item flex-view">
              <div class="label">图片</div>
              <div class="right-box avatar-box flex-view">
                <a-col span="24">
                  <a-form-item label="">
                    <a-upload-dragger name="file" accept="image/*" :multiple="false" :before-upload="beforeUpload"
                      v-model:file-list="fileList">
                      <p class="ant-upload-drag-icon">
                        <template v-if="tData.form.coverUrl">
                          <img :src="tData.form.form.coverUrl" style="width: 60px; height: 80px" />
                        </template>
                        <template v-else>
                          <file-image-outlined />
                        </template>
                      </p>
                      <p class="ant-upload-text"> 请选择要上传的图片 </p>
                    </a-upload-dragger>
                  </a-form-item>
                </a-col>
              </div>
            </div>
            <div class="item flex-view">
              <div class="label">标题</div>
              <div class="right-box">
                <input type="text" v-model="tData.form.title" placeholder="请输入寻物标题" maxlength="20" class="input-dom">
                <p class="tip">支持中英文，长度不能超过 20 个字符</p>
              </div>
            </div>
            <div class="item flex-view">
              <div class="label">地区</div>
              <el-cascader :options="tData.regionDatas" v-model="selectedOptions" placeholder="请选择"
                @change="handleChange"></el-cascader>
            </div>
  
            <div class="item flex-view">
              <div class="label">奖励</div>
              <div class="right-box">
                <input type="text" v-model="tData.form.price" placeholder="请输入价格" maxlength="100"
                  class="input-dom web-input">
              </div>
            </div>
            <div class="item flex-view">
              <div class="label">联系人手机号</div>
              <div class="right-box">
                <input type="text" v-model="tData.form.mobile" placeholder="请输入手机号" maxlength="100"
                  class="input-dom web-input">
              </div>
            </div>
            <div class="item flex-view">
              <div class="label">物品分类</div>
              <div class="right-box">
                <a-select placeholder="请选择" allowClear :options="cData" style="width: 200px;"
                  :field-names="{ label: 'title', value: 'id', }" v-model:value="tData.form.classification">
                </a-select>
              </div>
              <div class="item flex-view">
                <div class="label">标签</div>
                <a-select placeholder="请选择" mode="multiple" style="width: 200px;" allowClear
                  v-model:value="tData.form.tag">
                  <template v-for="item in tData.tagData">
                    <a-select-option :value="item.id">{{ item.title }}</a-select-option>
                  </template>
                </a-select>
              </div>
            </div>
            <div class="item flex-view">
              <div class="label">物品描述</div>
              <div class="right-box">
                <textarea v-model="tData.form.description" placeholder="请输入描述" maxlength="200" class="intro">
      </textarea>
                <p class="tip">限制200字以内</p>
              </div>
            </div>
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
  // const submit = () => {
  //   let formData = new FormData()
  //   let userId = userStore.user_id
  //   if (tData.form.avatarFile) {
  //     formData.append('cover', tData.form.avatarFile)
  //   }
  //   if (tData.form.title) {
  //     formData.append('title', tData.form.title)
  //   } else {
  //     message.warn("寻物标题不能为空")
  //     return
  //   }
  //   if (tData.form.classification) {
  //     formData.append('classification', tData.form.classification)
  //   }
  //   if (tData.form.tag) {
  //     tData.form.tag.forEach(function (value) {
  //       if (value) {
  //         formData.append('tag', value);
  //       }
  //     });
  //   }
  
  //   if (tData.form.mobile) {
  //     formData.append('mobile', tData.form.mobile)
  //   } else {
  //     message.warn("手机号不能为空")
  //     return
  //   }
  //   if (tData.form.location) {
  //     formData.append('location', tData.form.location)
  //   } else {
  //     message.warn("地区不能为空")
  //     return
  //   }
  //   if (tData.form.price) {
  //     formData.append('price', tData.form.price)
  //   } else {
  //     message.warn("奖励不能为空")
  //     return
  //   }
  //   if (tData.form.description) {
  //     formData.append('description', tData.form.description)
  //   } else {
  //     message.warn("介绍不能为空")
  //     return
  //   }
  //   formData.append('user', userId)
  //   formData.append('status', '1')
  
  //   if (tData.form.id) {
  //     updateApi({
  //       id: tData.form.id
  //     }, formData).then(res => {
  //       message.success('保存成功，后台审核中')
  //       // getUserThing()
  //     }).catch(err => {
  //       console.log(err)
  //     })
  //   } else {
  //     createApi(formData).then(res => {
  //       message.success('保存成功，后台审核中')
  //       // getUserThing()
  //     }).catch(err => {
  //       console.log(err)
  //     })
  //   }
  
  // }
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
    if (tData.form.price) {
      formData.append('price', tData.form.price)
    } else {
      message.warn("奖励不能为空")
      return
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
        longitude = parseFloat(longitude.toFixed(5));
        latitude = parseFloat(latitude.toFixed(5));
        console.log(longitude)
        console.log(latitude)
        formData.append('longitude', longitude)
        formData.append('latitude', latitude)
  
  
        if (tData.form.id) {
          updateApi({ id: tData.form.id }, formData).then(res => {
            message.success('保存成功，后台审核中')
            // getUserThing()
          }).catch(err => {
            console.log(err)
          })
        } else {
          createApi(formData).then(res => {
            message.success('保存成功，后台审核中')
            // getUserThing()
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
  input,
  textarea {
    border-style: none;
    outline: none;
    margin: 0;
    padding: 0;
  }
  
  .flex-view {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
  }
  
  .content-list {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
  
    .list-title {
      color: #e96728;
      font-weight: 600;
      font-size: 23px;
      line-height: 48px;
      height: 48px;
      margin-bottom: 4px;
      border-bottom: 1px solid #cedce4;
    }
  
    .edit-view {
      .item {
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        margin: 24px 0;
  
        .label {
          width: 100px;
          color: #152844;
          font-weight: 600;
          font-size: 14px;
        }
  
        .right-box {
          -webkit-box-flex: 1;
          -ms-flex: 1;
          flex: 1;
        }
  
        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin-right: 16px;
        }
  
        .change-tips {
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -ms-flex-wrap: wrap;
          flex-wrap: wrap;
        }
  
        label {
          color: #4684e2;
          font-size: 14px;
          line-height: 22px;
          height: 22px;
          cursor: pointer;
          width: 100px;
          display: block;
        }
  
        .tip {
          color: #6f6f6f;
          font-size: 14px;
          height: 22px;
          line-height: 22px;
          margin: 0;
          width: 100%;
        }
  
        .right-box {
          -webkit-box-flex: 1;
          -ms-flex: 1;
          flex: 1;
        }
  
        .input-dom {
          width: 400px;
        }
  
        .input-dom {
          background: #f8fafb;
          border-radius: 4px;
          height: 40px;
          line-height: 40px;
          font-size: 14px;
          color: #152844;
          padding: 0 12px;
        }
  
        .tip {
          font-size: 12px;
          line-height: 16px;
          color: #6f6f6f;
          height: 16px;
          margin-top: 4px;
        }
  
        .intro {
          resize: none;
          background: #f8fafb;
          width: 100%;
          padding: 8px 12px;
          height: 82px;
          line-height: 22px;
          font-size: 14px;
          color: #152844;
        }
      }
  
      .save {
        background: #4684e2;
        border-radius: 32px;
        width: 96px;
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        color: #fff;
        border: none;
        outline: none;
        cursor: pointer;
      }
  
      .mg {
        margin-left: 100px;
      }
    }
  }
  </style>

   