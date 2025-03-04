<template>
  <div id="userLayout">
    <div class="user-layout-header">
      <img class="logo" :src="LogoIcon" alt="" />
      <span class="text_speak_english">LOST & FOUND </span>
      <span class="text_speak"> 欢迎来到失物招领后台管理系统！</span>
    </div>
    <div class="main-container">
      <div class="main">
        <div class="main_right">
          <h2 class="sys_title">管理员登录</h2>
          <a-form ref="myform" layout="vertical" :model="data.loginForm" :rules="data.rules" :hideRequiredMark="true">
            <a-form-item name="username" label="账号" :colon="false">
              <a-input size="large" class="input_txt" placeholder="请输入登录账号" v-model:value="data.loginForm.username"
                @pressEnter="handleSubmit">
                <a-icon slot="prefix" type="user" />
              </a-input>
            </a-form-item>
            <a-form-item name="password" label="密码" :colon="false">
              <a-input size="large" class="input_txt" type="password" placeholder="请输入登录密码" v-model:value="data.loginForm.password"
                @pressEnter="handleSubmit">
                <a-icon slot="prefix" type="lock" />
              </a-input>
            </a-form-item>
            <a-form-item style="padding-top: 24px">
              <a-button class="login-button" type="primary" :loading="loginBtn" size="large" block
                @click="handleSubmit"> 登录 </a-button>
            </a-form-item>
          </a-form>
          <div class="error-tip"></div>
        </div>
      </div>
    </div>
    <footer class="footer">
      <div class="copyright">
        <span></span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import LogoIcon from '/public/lost_found_logo.png';
import { useUserStore } from '/@/store';

const router = useRouter();
const userStore = useUserStore();

import { message } from 'ant-design-vue';

const myform = ref();

const loginBtn = ref<Boolean>(false);
const checked = ref<Boolean>(false);
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
  myform.value
    ?.validate()
    .then(() => {
      handleLogin();
    })
    .catch(() => {
      message.warn('不能为空');
    });
};

const handleLogin = () => {
  userStore
    .adminLogin({
      username: data.loginForm.username,
      password: data.loginForm.password,
    })
    .then((res) => {
      loginSuccess();
    })
    .catch((err) => {
      message.warn(err.msg || '登录失败');
    });
};

const loginSuccess = () => {
  router.push({ path: '/admin' });
  message.success('登录成功！');
};
</script>

<style lang="less" scoped>
#userLayout {
  position: relative;
  height: 100vh;

  .user-layout-header {
    height: 80px;
    padding: 0 24px;
    color: fade(#000, 85%);
    font-size: 28px;
    font-weight: bold;
    line-height: 80px;

    .logo {
      width: 105px;
      height: 100px;
      margin-right: -8px;
      margin-top: -8px;
    }
  }

  .main-container {
    height: calc(100vh - 160px);
    background:linear-gradient(45deg,#cffafa,#e3c0ca);

    .main {
      position: absolute;
      right: 80px;
      top: 50%;
      display: flex;
      transform: translate(0, -50%);
      border-radius: 8px;
      overflow: hidden;
      -webkit-box-shadow: 2px 2px 6px #aaa;
      box-shadow: 2px 2px 6px #aaa;

      .main_right {
        background: #ffffff;
        padding: 24px;
        width: 420px;
        user-select: none;

        .sys_title {
          line-height:72px;
          text-align:center;
          background:linear-gradient(90deg,rgba(240, 189, 123, 0.6),rgba(242, 164, 226, 0.6));
          color:#c46e5b;
          font-size:25px;
        }

        :deep(.ant-form-item label) {
          font-weight: bold;
        }

        .flex {
          align-items: center;
          display: flex;
          justify-content: space-between;
        }

        .forget_password {
          cursor: pointer;
        }

        .login-button {

          display:block;
          margin:35px auto 0;
          width:298px;
          height:40px;
          border:5px;
          border-radius:4px;
          background:rgba(247,60,45,0.6);
          color:#fff;
          cursor:pointer;
        }
      }

      .error-tip {
        text-align: center;
      }
    }
  }

  .footer {
    height: 80px;
  }
}
.text_speak{
  margin: -55px 0 0 14px;
  font-size: 25px;
  color: #eebf51;

}
.text_speak_english{
  margin: -55px 0 0 14px;
  font-size: 25px;
  color: #eebf51;

}
.input_txt{
  display:block;
  margin:-41px auto 0;
  width:254px;
  height:44px;
  border:2px solid #e1c080;
  border-radius:11px;
  outline:none;
  text-indent:10px;
}
.form_item_name{
  margin-top: 100px;
}
</style>
