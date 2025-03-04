<template>
  <div id="userLayout">
    <!-- 头部 -->
    <div class="user-layout-header">
      <img class="logo" :src="LogoIcon" alt="Logo" />
      <span class="text_speak_english">LOST & FOUND</span>
      <span class="text_speak">欢迎来到失物招领后台管理系统！</span>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <div class="main">
        <div class="main_right">
          <h2 class="sys_title">管理员登录</h2>
          <!-- 修改为 horizontal 布局 -->
          <a-form 
            ref="myform" 
            layout="horizontal" 
            :model="data.loginForm" 
            :rules="data.rules" 
            :hideRequiredMark="true"
          >
            <a-form-item name="username" label="账号" :colon="false">
              <a-input 
                size="large" 
                class="input_txt" 
                placeholder="请输入登录账号" 
                v-model:value="data.loginForm.username"
                @pressEnter="handleSubmit"
              >
                <a-icon slot="prefix" type="user" />
              </a-input>
            </a-form-item>

            <a-form-item name="password" label="密码" :colon="false">
              <a-input 
                size="large" 
                class="input_txt" 
                type="password"
                placeholder="请输入登录密码" 
                v-model:value="data.loginForm.password"
                @pressEnter="handleSubmit"
              >
                <a-icon slot="prefix" type="lock" />
              </a-input>
            </a-form-item>

            <a-form-item :wrapper-col="{ span: 24 }">
              <a-button 
                class="login-button" 
                type="primary" 
                :loading="loginBtn" 
                size="large" 
                block
                @click="handleSubmit"
              >
                登录
              </a-button>
            </a-form-item>
          </a-form>
          <div class="error-tip"></div>
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="copyright"></div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import LogoIcon from '/public/lost_found_logo.png';
import { useUserStore } from '/@/store';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();
const myform = ref();
const loginBtn = ref(false);

const data = reactive({
  loginForm: {
    username: '',
    password: '',
  },
  rules: {
    username: [{ required: true, message: '请输入管理员用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  },
});

const handleSubmit = () => {
  myform.value?.validate()
    .then(handleLogin)
    .catch(() => message.warn('不能为空'));
};

const handleLogin = () => {
  userStore.adminLogin(data.loginForm)
    .then(loginSuccess)
    .catch(err => message.warn(err.msg || '登录失败'));
};

const loginSuccess = () => {
  router.push('/admin');
  message.success('登录成功！');
};
</script>

<style lang="less" scoped>
#userLayout {
  position: relative;
  height: 100vh;
  background: #f0f2f5;

  /* 头部样式 - 增加底部间距 */
  .user-layout-header {
    height: 80px;
    padding: 0 24px;
    margin-bottom: 46px;  // 增加与表单的间距
    color: rgba(0, 0, 0, 0.85);
    font-size: 28px;
    font-weight: 600;
    line-height: 80px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .logo {
      width: 105px;
      height: 112px;;
      margin-right: 16px;
      vertical-align: middle;
      margin-top: -17px;
    }

    .text_speak_english {
      color: #eebf51;
      margin-right: 24px;
    }

    .text_speak {
      font-size: 24px;
      color: #666;
    }
  }

  /* 主容器 */
  .main-container {
    height: calc(100vh - 200px);  // 调整高度适应新间距
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(45deg, #cffafa, #e3c0ca);

    .main {
      border-radius: 8px;
      box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.1);
      background: white;

      .main_right {
        padding: 40px;
        width: 480px;

        /* 标题样式 */
        .sys_title {
          margin-bottom: 32px;
          line-height: 1.5;
          text-align: center;
          background: linear-gradient(90deg, rgba(240, 189, 123, 0.8), rgba(242, 164, 226, 0.8));
          color: #c46e5b;
          font-size: 28px;
          padding: 12px;
          border-radius: 4px;
        }

        /* 修复Ant Design标签布局 */
        :deep(.ant-form-item-label) {
          text-align: left;
          padding-right: 16px;
          label {
            font-weight: 500;
            color: #333;
          }
        }

        /* 输入框统一样式 */
        .input_txt {
          width: 100%;
          height: 44px;
          border: 2px solid #e1c080;
          border-radius: 8px;
          padding: 0 16px;
          transition: border-color 0.3s;

          &:focus {
            border-color: #1890ff;
            box-shadow: none;
          }
        }

        /* 登录按钮样式 */
        .login-button {
          height: 44px;
          font-size: 16px;
          background: linear-gradient(45deg, #ff7e5f, #feb47b);
          border: none;
          border-radius: 8px;
          margin-top: 24px;
          transition: all 0.3s;

          &:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
        }
      }
    }
  }

  .footer {
    height: 60px;
    line-height: 60px;
    text-align: center;
    color: #666;
  }
}
</style>