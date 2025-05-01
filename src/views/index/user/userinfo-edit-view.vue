<template>
  <div class="content-list">
    <div class="list-title">设置</div>
    <a-spin :spinning="loading" style="min-height: 200px;">
      <div class="list-content">
      <div class="edit-view">
        <div class="item flex-view">
          <div class="label">头像</div>
          <div class="right-box avatar-box flex-view">
            <!-- 显示本地预览或后端头像 -->
            <img v-if="tData.previewUrl" :src="tData.previewUrl" class="avatar">
            <img v-else-if="tData.form && tData.form.avatar" :src="tData.form.avatar" class="avatar">
            <img v-else :src="AvatarIcon" class="avatar">
            <div class="change-tips flex-view">
                <!-- 移动注释到标签外部 -->
                <a-upload
                  name="file"
                  accept="image/*"
                  :multiple="false"
                  :show-upload-list="false"
                  :before-upload="beforeUpload"
                >
                  <label>点击更换头像</label>
                </a-upload> <!-- 隐藏 antd 的列表 -->
              <p class="tip">图片格式支持 GIF、PNG、JPEG，尺寸不小于 200 PX，小于 4 MB</p>
            </div>
          </div>
        </div>
        <!-- 新增：性别 -->
        <div class="item flex-view">
          <div class="label">性别</div>
          <div class="right-box">
            <a-radio-group v-model:value="tData.form.gender" class="gender-radio-group">
              <a-radio value="男" class="gender-male">
                <man-outlined /> 男
              </a-radio>
              <a-radio value="女" class="gender-female">
                <woman-outlined /> 女
              </a-radio>
              <a-radio value="不展示" class="gender-neutral">不展示</a-radio>
            </a-radio-group>
          </div>
        </div>

        <!-- 新增：生日 -->
        <div class="item flex-view">
          <div class="label">生日</div>
          <div class="right-box">
            <a-date-picker
              v-model:value="tData.form.birthday"
              placeholder="请选择生日"
              valueFormat="YYYY-MM-DD"
              style="width: 200px;"
              class="input-dom"
            />
          </div>
        </div>

        <!-- 修改：所在地改为输入框 -->
        <div class="item flex-view">
          <div class="label">所在地</div>
          <div class="right-box">
            <input
              type="text"
              v-model="tData.form.location"
              placeholder="请输入所在地，如：省/市/区"
              maxlength="100"
              class="input-dom"
            />
          </div>
        </div>

        <!-- 新增：学校 -->
        <div class="item flex-view">
          <div class="label">学校</div>
          <div class="right-box">
            <input type="text" v-model="tData.form.school" placeholder="请输入学校名称" maxlength="50" class="input-dom">
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">用户名/昵称</div>
          <div class="right-box">
            <input type="text" v-model="tData.form.nickname" placeholder="请输入昵称" maxlength="20" class="input-dom">
            <p class="tip">支持中英文，长度不能超过 20 个字符</p>
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">手机号</div>
          <div class="right-box">
            <input type="text" v-model="tData.form.mobile" placeholder="请输入邮箱" maxlength="100" class="input-dom web-input">
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">邮箱</div>
          <div class="right-box">
            <input type="text" v-model="tData.form.email" placeholder="请输入邮箱" maxlength="100" class="input-dom web-input">
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">个人简介</div>
          <div class="right-box">
          <textarea v-model="tData.form.description" placeholder="请输入简介" maxlength="200" class="intro">
          </textarea>
            <p class="tip">限制200字以内</p>
          </div>
        </div>
        <button class="save mg" @click="submit()">保存</button>
      </div>
    </div>
    </a-spin>
  </div>
</template>

<script setup>
import {message} from "ant-design-vue";
import {detailApi, updateUserInfoApi} from '/@/api/index/user'
import {useUserStore} from "/@/store";
import AvatarIcon from '/@/assets/images/avatar.jpg'
import { ref, reactive, onMounted } from 'vue'; // 确保引入 ref, reactive, onMounted
import { ManOutlined, WomanOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const userStore = useUserStore();

let loading = ref(false)
let tData = reactive({
  previewUrl: null, // 添加本地预览 URL
  form:{
    avatar: undefined, // 后端返回的头像 URL
    avatarFile: null, // 本地文件对象
    nickname: undefined,
    email: undefined,
    mobile: undefined,
    description: undefined,
    gender: undefined,
    birthday: undefined,
    location: undefined, // 直接使用文本
    school: undefined,
  }
})

onMounted(()=>{
  getUserInfo()
})

const beforeUpload =(file)=> {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }
  const isLt4M = file.size / 1024 / 1024 < 4; // 限制大小为 4MB
  if (!isLt4M) {
    message.error('图片大小不能超过 4MB!');
    return false;
  }

  // 生成本地预览 URL
  tData.previewUrl = URL.createObjectURL(file);
  // 保存文件对象以备提交
  tData.form.avatarFile = file; // 直接存储原始文件

  return false; // 阻止 antdv 的默认上传行为
}

const getUserInfo =()=> {
  loading.value = true
  let userId = userStore.user_id
  detailApi({id: userId}).then(res => {
    // 直接使用后端返回的数据，包括 avatar URL
    tData.form = { ...res.data, avatarFile: null }; // 合并数据并清空旧文件
    tData.previewUrl = null; // 清空预览
    loading.value = false
  }).catch(err => {
    console.log(err)
    loading.value = false
  })
}
const submit =()=> {
  let formData = new FormData()
  let userId = userStore.user_id

  // 确保 userId 存在
  if (!userId) {
    message.error('无法获取用户信息，请重新登录');
    return;
  }

  // 将 userId 添加到 FormData
  formData.append('user_id', userId); // 或者后端期望的其他字段名，例如 'id'

  // 只有当用户选择了新文件时才添加到 FormData
  if (tData.form.avatarFile) {
    formData.append('avatar', tData.form.avatarFile); // 'avatar' 是后端接收文件的字段名
  }

  // 添加其他字段
  if (tData.form.nickname) {
    formData.append('nickname', tData.form.nickname)
  }
  if (tData.form.email) {
    formData.append('email', tData.form.email)
  }
  if (tData.form.mobile) {
    formData.append('mobile', tData.form.mobile)
  }
  if (tData.form.description) {
    formData.append('description', tData.form.description)
  }
  if (tData.form.gender) {
    formData.append('gender', tData.form.gender)
  }
  if (tData.form.birthday) {
    formData.append('birthday', tData.form.birthday)
  }
  if (tData.form.location) {
    formData.append('location', tData.form.location)
  }
  if (tData.form.school) {
    formData.append('school', tData.form.school)
  }

  console.log("准备提交的用户信息 FormData:"); // 调试输出
  for (let pair of formData.entries()) {
     console.log(pair[0]+ ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
  }

  loading.value = true; // 开始加载
  updateUserInfoApi({ id: userId }, formData).then(res => {
    // --- Start: Add try...catch for success handling ---
    try {
      message.success('保存成功'); // 显示成功消息

      // 检查后端返回的数据结构是否符合预期
      if (res && res.data) {
          console.log("后端成功响应数据 (准备传入 store):", JSON.stringify(res.data, null, 2)); // 打印准备传入的数据
          tData.form = { ...res.data, avatarFile: null }; // 使用返回的数据更新，并清除文件对象
          tData.previewUrl = null; // 清除本地预览

          // 尝试更新 userStore，这里可能是出错点
          console.log("尝试更新 userStore...");
          userStore.setUserInfo(res.data); // 调用 action 更新 store
          console.log("userStore 更新成功");

      } else {
          console.warn("后端响应成功，但未返回有效数据，重新获取用户信息...");
          // 如果后端没返回新数据，则重新获取
          getUserInfo();
      }
    } catch (successHandlingError) {
      // 捕获处理成功响应时发生的错误
      console.error("处理成功响应时出错:", successHandlingError);
      // 打印更详细的错误堆栈
      console.error("错误堆栈:", successHandlingError.stack);
      message.error('信息更新成功，但处理响应时遇到问题'); // 提供更具体的错误信息
    }
    // --- End: Add try...catch ---

  }).catch(err => {
    // 这个 catch 现在只处理 API 调用本身的失败 (网络错误, 4xx, 5xx 等)
    console.error("API 调用失败:", err); // 使用 console.error
    // 尝试获取更详细的错误信息
    const errorMsg = err?.response?.data?.msg || err?.msg || err?.message || '保存失败';
    message.error(errorMsg);
  }).finally(() => {
    loading.value = false; // 结束加载
  });
}

</script>

<style scoped lang="less">
input, textarea {
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
    color: #152844;
    font-weight: 600;
    font-size: 18px;
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
        font-size: 16px; // 修改：增大字体大小，例如从 14px 改为 16px
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
        object-fit: cover; // 保持图片比例
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
        font-size: 16px; // 修改：增大字体大小，例如从 14px 改为 16px
        line-height: 22px;
        height: 22px;
        cursor: pointer;
        width: 120px; // 可选：适当增加宽度以适应更大的字体
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

      // 确保 Radio Group 水平排列
      :deep(.ant-radio-group) {
        display: flex; // 强制 flex 布局 (默认行为)
        flex-direction: row; // 明确水平方向 (默认行为)
        flex-wrap: wrap; // 允许换行
        gap: 8px; // 修改：减小选项之间的间距
        align-items: center; // 垂直居中对齐 radio 和文字
        line-height: 40px; // 与输入框对齐
      }

      // 性别 Radio Group 特定样式
      .gender-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px; // 修改：减小选项之间的间距
        align-items: center;
        line-height: 40px;

        // 图标样式
        .anticon {
          margin-right: 4px; // 图标和文字间距
          vertical-align: middle; // 垂直居中
        }

        // 新增：使女性选项始终为粉色
        .gender-female {
          color: #eb2f96; // 文字颜色
          .anticon {
            color: #eb2f96; // 图标颜色
          }
        }

        // 选中状态颜色覆盖
        :deep(.ant-radio-wrapper-checked) {
          // 男性选中 - 蓝色主题
          &.gender-male {
            .ant-radio-inner {
              border-color: #1890ff !important; // 边框颜色
            }
            .ant-radio-inner::after {
              background-color: #1890ff !important; // 圆点颜色
            }
            // 可选：改变图标和文字颜色
            color: #1890ff;
            .anticon {
              color: #1890ff;
            }
          }

          // 女性选中 - 粉色主题 (保持选中时的边框和圆点颜色)
          &.gender-female {
            .ant-radio-inner {
              border-color: #eb2f96 !important; // 边框颜色
            }
            .ant-radio-inner::after {
              background-color: #eb2f96 !important; // 圆点颜色
            }
            // 选中时颜色不变 (因为已经设置了常态粉色)
            // color: #eb2f96;
            // .anticon {
            //   color: #eb2f96;
            // }
          }

          // 不展示选中 - 保持默认或灰色
          &.gender-neutral {
             /* 可以保持 antd 默认的 primary color 或自定义灰色 */
             /* 例如灰色: */
             /*
             .ant-radio-inner { border-color: #bfbfbf !important; }
             .ant-radio-inner::after { background-color: #bfbfbf !important; }
             color: #595959;
             */
          }
        }
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





