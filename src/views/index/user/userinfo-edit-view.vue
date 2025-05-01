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
                  :disabled="!isEditing"  
                >
                  <label :style="{ cursor: isEditing ? 'pointer' : 'default', color: isEditing ? '#4684e2' : '#6f6f6f' }">
                    {{ isEditing ? '点击更换头像' : '头像' }}
                  </label>
                </a-upload> <!-- 隐藏 antd 的列表 -->
              <p class="tip">图片格式支持 GIF、PNG、JPEG，尺寸不小于 200 PX，小于 4 MB</p>
            </div>
          </div>
        </div>
        <!-- 新增：性别 -->
        <div class="item flex-view">
          <div class="label">性别</div>
          <div class="right-box">
            <!-- 编辑状态显示 Radio Group -->
            <a-radio-group
              v-if="isEditing"
              v-model:value="tData.form.gender"
              class="gender-radio-group"
            >
              <a-radio value="男" class="gender-male">
                <man-outlined /> 男
              </a-radio>
              <a-radio value="女" class="gender-female">
                <woman-outlined /> 女
              </a-radio>
              <a-radio value="不展示" class="gender-neutral">不展示</a-radio>
            </a-radio-group>
            <!-- 只读状态显示文本和图标 -->
            <span v-else class="readonly-text gender-readonly">
              <template v-if="tData.form.gender === 'M'">
                <man-outlined class="gender-icon-male" /> 男
              </template>
              <template v-else-if="tData.form.gender === 'F'">
                <woman-outlined class="gender-icon-female" /> 女
              </template>
              <template v-else>
                {{ tData.form.gender === 'N' ? '不展示' : (tData.form.gender || '未填写') }}
              </template>
            </span>
          </div>
        </div>

        <!-- 新增：生日 -->
        <div class="item flex-view">
          <div class="label">生日</div>
          <div class="right-box">
            <!-- 编辑状态显示日期选择器 -->
            <a-date-picker
              v-if="isEditing"
              v-model:value="tData.form.birthday"
              placeholder="请选择生日"
              valueFormat="YYYY-MM-DD"
              style="width: 200px;"
              class="input-dom"
            />
            <!-- 只读状态显示文本 -->
            <span v-else class="readonly-text">{{ tData.form.birthday || '未填写' }}</span>
          </div>
        </div>

        <!-- 修改：所在地改为输入框 -->
        <div class="item flex-view">
          <div class="label">所在地</div>
          <div class="right-box">
            <!-- 编辑状态显示输入框 -->
            <input
              v-if="isEditing"
              type="text"
              v-model="tData.form.location"
              placeholder="请输入所在地，如：省/市/区"
              maxlength="100"
              class="input-dom"
            />
            <!-- 只读状态显示文本 -->
            <span v-else class="readonly-text">{{ tData.form.location || '未填写' }}</span>
          </div>
        </div>

        <!-- 新增：学校 -->
        <div class="item flex-view">
          <div class="label">学校</div>
          <div class="right-box">
            <!-- 编辑状态显示输入框 -->
            <input
              v-if="isEditing"
              type="text"
              v-model="tData.form.school"
              placeholder="请输入学校名称"
              maxlength="50"
              class="input-dom"
            />
            <!-- 只读状态显示文本 -->
            <span v-else class="readonly-text">{{ tData.form.school || '未填写' }}</span>
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">用户名/昵称</div>
          <div class="right-box">
            <!-- 编辑状态显示输入框，绑定到 username -->
            <input
              v-if="isEditing"
              type="text"
              v-model="tData.form.username" 
              placeholder="请输入用户名" 
              maxlength="20"
              class="input-dom"
            />
            <!-- 只读状态显示文本，显示 username -->
            <span v-else class="readonly-text">{{ tData.form.username || '未填写' }}</span>
            <p v-if="isEditing" class="tip">支持中英文，长度不能超过 20 个字符</p>
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">手机号</div>
          <div class="right-box">
            <!-- 编辑状态显示输入框 -->
            <input
              v-if="isEditing"
              type="text"
              v-model="tData.form.mobile"
              placeholder="请输入手机号"
              maxlength="11"
              class="input-dom web-input"
            />
            <!-- 只读状态显示文本 -->
            <span v-else class="readonly-text">{{ tData.form.mobile || '未填写' }}</span>
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">邮箱</div>
          <div class="right-box">
            <!-- 编辑状态显示输入框 -->
            <input
              v-if="isEditing"
              type="text"
              v-model="tData.form.email"
              placeholder="请输入邮箱"
              maxlength="100"
              class="input-dom web-input"
            />
            <!-- 只读状态显示文本 -->
            <span v-else class="readonly-text">{{ tData.form.email || '未填写' }}</span>
          </div>
        </div>
        <div class="item flex-view">
          <div class="label">个人简介</div>
          <div class="right-box">
            <!-- 编辑状态显示文本域 -->
            <textarea
              v-if="isEditing"
              v-model="tData.form.description"
              placeholder="请输入简介"
              maxlength="200"
              class="intro"
            ></textarea>
            <!-- 只读状态显示段落 -->
            <p v-else class="readonly-textarea">{{ tData.form.description || '未填写' }}</p>
            <p v-if="isEditing" class="tip">限制200字以内</p>
          </div>
        </div>
        <button v-if="isEditing" class="save mg" @click="submit()">保存</button>
        <button v-if="!isEditing" class="edit mg" @click="toggleEdit(true)">编辑</button>
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
    username: undefined, // 确保 username 字段存在
    nickname: undefined, // nickname 字段仍然可以保留，但输入框不绑定它
    email: undefined,
    mobile: undefined,
    description: undefined,
    gender: undefined,
    birthday: undefined,
    location: undefined, // 直接使用文本
    school: undefined,
  }
})

// 新增：编辑状态 ref
const isEditing = ref(false); // 默认为非编辑状态

// 新增：切换编辑状态的函数
const toggleEdit = (editingState) => {
  isEditing.value = editingState;
  if (editingState) {
    // 进入编辑模式时，清空可能存在的预览 URL，避免显示旧的预览
    tData.previewUrl = null;
  }
};

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
    toggleEdit(false); // 获取数据成功后，进入只读模式
  }).catch(err => {
    console.log(err)
    loading.value = false
    // 获取失败也设置为非编辑状态，避免一直显示加载或空表单
    toggleEdit(false);
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

  // 添加其他字段 - 确保发送的是 username
  if (tData.form.username) { // 修改：发送 username
    formData.append('username', tData.form.username) // 修改：发送 username
  }
  // 如果后端也需要 nickname，可以单独添加
  // if (tData.form.nickname) {
  //   formData.append('nickname', tData.form.nickname)
  // }
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
          toggleEdit(false); // 保存成功后，返回只读模式

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
      toggleEdit(false); // 即使处理响应出错，也尝试返回只读模式
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
        font-size: 15px;
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

    // 新增：编辑按钮样式 (可以复用 save 样式或自定义)
    .edit {
      background: #1890ff; // 编辑按钮用蓝色
      border-radius: 32px;
      width: 96px;
      height: 32px;
      line-height: 32px;
      font-size: 14px;
      color: #fff;
      border: none;
      outline: none;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #40a9ff;
      }
    }
  }
}

// 为 readonly 状态下的 input 和 textarea 添加样式
input[readonly], textarea[readonly] {
  background-color: #f5f5f5; // 更明显的只读背景色
  cursor: default; // 默认光标
  border-color: #d9d9d9; // 边框颜色变浅
  color: rgba(0, 0, 0, 0.65); // 文字颜色变浅
}
// 修正：确保 antd 组件 disabled 状态下的样式
:deep(.ant-radio-group[disabled]),
:deep(.ant-picker.input-dom.ant-picker-disabled) {
  background-color: #f5f5f5 !important; // 统一只读背景色
  cursor: default !important;
  color: rgba(0, 0, 0, 0.65) !important;
}
:deep(.ant-radio-group[disabled] .ant-radio-wrapper) {
  cursor: default !important;
  color: rgba(0, 0, 0, 0.45) !important; // radio 文字颜色更浅
}
:deep(.ant-radio-group[disabled] .ant-radio-inner) {
  border-color: #d9d9d9 !important;
  background-color: #f5f5f5 !important;
}
:deep(.ant-radio-group[disabled] .ant-radio-inner::after) {
  background-color: #d9d9d9 !important; // 圆点颜色
}
// 特别处理性别图标在 disabled 状态下的颜色
:deep(.gender-radio-group[disabled]) {
  .gender-male .anticon,
  .gender-female .anticon {
    color: rgba(0, 0, 0, 0.45) !important; // 图标颜色变浅
  }
  .gender-female {
     color: rgba(0, 0, 0, 0.45) !important; // 女性文字颜色也变浅
  }
}

// 新增：只读文本样式
.readonly-text {
  display: inline-block; // 或 block，根据需要
  padding: 0 12px; // 模拟 input 的内边距
  height: 40px; // 模拟 input 的高度
  line-height: 40px; // 垂直居中文本
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85); // 正常文本颜色，或稍浅
  // background-color: #f5f5f5; // 可选：添加背景色以区分
  // border-radius: 4px; // 可选：添加圆角
  width: 400px; // 与 input-dom 保持一致
  box-sizing: border-box; // 确保 padding 不会增加总宽度
  white-space: nowrap; // 防止文本换行
  overflow: hidden; // 隐藏溢出部分
  text-overflow: ellipsis; // 显示省略号

  // 为性别只读状态添加特定样式（如果需要调整宽度或对齐）
  &.gender-readonly {
    width: auto; // 自动宽度适应内容
    display: inline-flex; // 使用 flex 布局对齐图标和文字
    align-items: center; // 垂直居中
    gap: 4px; // 图标和文字间距
  }
}

// 新增：只读状态性别图标颜色
.gender-icon-male {
  color: #1890ff; // 蓝色
}
.gender-icon-female {
  color: #eb2f96; // 粉色
}

// 新增：只读文本域样式 (适用于 textarea)
.readonly-textarea {
  display: block; // 使用 block 以便控制宽度和高度
  padding: 30px 12px; // 模拟 textarea 的内边距
  min-height: 82px; // 模拟 textarea 的高度
  line-height: 22px; // 模拟 textarea 的行高
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85);
  width: 100%; // 占据整个 right-box 宽度
  box-sizing: border-box;
  word-wrap: break-word; // 允许长单词换行
  white-space: pre-wrap; // 保留换行符和空格
  margin-top: 10px;
  // background-color: #f5f5f5; // 可选：添加背景色
  // border: 1px solid #d9d9d9; // 可选：添加边框
  // border-radius: 4px; // 可选：添加圆角
}
</style>





