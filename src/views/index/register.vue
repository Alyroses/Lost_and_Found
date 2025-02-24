<template>
  <div class="container">
    <div class="tel-regist-page pc-style">
      <div class="regist-header">
        <img :src="LogoIcon" alt="logo" class="logo-icon" />
        <div class="regist-title">
          <span class="regist-title-text">注册新账号</span>
          <span @click="router.push({ name: 'login' })" class="toWxLogin">
            我要登录
          </span>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <img :src="UserIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入用户名" v-model="tData.loginForm.username" type="text" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <img :src="MailIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入邮箱" v-model="tData.loginForm.email" type="text" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <img :src="PwdIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入密码" v-model="tData.loginForm.password" type="password" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <img :src="PwdIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请再次输入密码" v-model="tData.loginForm.repassword" type="password" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <img :src="CodeIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入邮箱验证码" v-model="tData.loginForm.emailCode" type="text" class="input" />
            <p class="err-view"> </p>
          </div>
          <button class="get-code-btn" @click="getEmailCode">获取验证码</button>
        </div>
      </div>
      <div class="regist-padding">
        <div class="common-input">
          <div class="captcha-container">
            <img :src="captchaImageUrl" alt="Captcha" class="captcha-img" @click="reloadCaptcha" />
          </div>
          <div class="input-view">
            <input placeholder="请输入验证码" v-model="tData.loginForm.captcha" type="text" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
      </div>
      <div class="tel-login">
        <div class="next-btn-view">
          <button class="next-btn" @click="handleRegister">注册</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { userRegisterApi, sendEmailCodeApi } from '/@/api/index/user'; // 确保导入 sendEmailCodeApi
import { message } from 'ant-design-vue';
// 更换图片路径
import LogoIcon from '/public/lost_found_logo.png';
import UserIcon from '/@/assets/images/username_icon.png';
import MailIcon from '/@/assets/images/mail-icon.svg';
import PwdIcon from '/@/assets/images/pwd-icon.svg';
import CodeIcon from '/@/assets/images/code-icon.svg';
import LoginIcon from '/public/images/icons02.png';

const router = useRouter();

const tData = reactive({
  loginForm: {
    username: '',
    email: '',
    emailCode: '',
    password: '',
    repassword: '',
    captcha: ''
  },
});

const captchaImageUrl = ref('http://localhost:8000/myapp/index/user/generateCaptcha'); // 设置验证码生成的 URL

const reloadCaptcha = () => {
  captchaImageUrl.value = `http://localhost:8000/myapp/index/user/generateCaptcha?${new Date().getTime()}`;
};

const handleRegister = () => {
  console.log('login');
  if (tData.loginForm.username === '' || tData.loginForm.email === '' || tData.loginForm.emailCode === '' || tData.loginForm.password === '' || tData.loginForm.repassword === '' || tData.loginForm.captcha === '') {
    message.warn('不能为空！');
    return;
  }

  userRegisterApi({
    username: tData.loginForm.username,
    email: tData.loginForm.email,
    emailCode: tData.loginForm.emailCode,
    password: tData.loginForm.password,
    repassword: tData.loginForm.repassword,
    captcha: tData.loginForm.captcha,
  })
    .then((res) => {
      message.success('注册成功！');
      router.push({ name: 'login' });
    })
    .catch((err) => {
      message.error(err.msg || '注册失败');
    });
};

const getEmailCode = () => {
  if (tData.loginForm.email === '') {
    message.warn('请输入邮箱');
    return;
  }

  const emailCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // 生成随机6位数验证码

    sendEmailCodeApi({ email: tData.loginForm.email, code: emailCode })
    .then((res) => {
      message.success('验证码已发送');
    })
    .catch((err) => {
      message.error(err.msg || '获取验证码失败');
    });
};
</script>

<style scoped lang="less">
div {
  display: block;
}

.container {
  max-width: 100%;
  //background: #142131;
  background-image: url('../images/login-background.jpg');
  background-size: cover;
  object-fit: cover;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pc-style {
  position: relative;
  width: 440px;
  height: 665px;
  background: #fff;
  -webkit-box-shadow: 2px 2px 6px #aaa;
  box-shadow:  5px 6px 7px #d84747;;
  border-radius: 4px;
}

.regist-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .logo-icon {
    margin-right: 10px;
    width: 76px;
    height: 80px;
  }
}

.tel-regist-page {
  overflow: hidden;
  background-size: cover;
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/public/images/register_form_image.jpg');
    background-size: cover;
    opacity: 0.5; // 设置透明度
    z-index: -1;
  }

  .regist-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    color: #824a02;
    font-weight: 500;
    height: 24px;
    line-height: 24px;
    margin: 40px 0;
    padding: 0 28px;
    gap:50px;
    .toWxLogin {
      color: #e91c12;
      cursor: pointer;
      display: flex;
      align-items: center;
      background: url('/public/images/icons02.png') left 5px no-repeat;
      text-indent: 58px;
      margin-left: auto;

      .login-icon {
        margin-left: 30px;
        width: 20px;
        height: 30px;
      }
    }
  }

  .regist-padding {
    padding: 0 28px;
    margin-bottom: 8px;
  }
}

.common-input {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: start;
  -ms-flex-align: start;
  align-items: flex-start;

  .left-icon {
    margin-right: 12px;
    width: 24px;
    margin-top: 7px;
  }

  .input-view {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;

    .input {
      font-weight: 500;
      font-size: 14px;
      color: #1e1e1e;
      height: 44px;
      line-height: 26px;
      padding: 10px;
      display: block;
      width: 100%;
      letter-spacing: 1.5px;
      outline: none; // 去掉边框线
    }

    .err-view {
      margin-top: 4px;
      height: 16px;
      line-height: 16px;
      font-size: 12px;
      color: #f62a2a;
    }
  }
}

.captcha-container {
  padding: 5px;
  border-radius: 4px;
}

.captcha-img {
  margin-right: 20px;
  margin-top: 1px;
  border-radius: 4px;
}

.get-code-btn {
  background: #5c7cba;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  line-height: 40px;
  text-align: center;
  padding: 0 15px;
  margin-left: 10px;
  cursor: pointer;
}

.tel-login {
  padding: 0 28px;
}

.next-btn {
  background: #5c7cba;
  border-radius: 4px;
  color: #ef9f04;
  font-size: 20px;
  font-weight: 500;
  height: 40px;
  line-height: 40px;
  text-align: center;
  width: 100%;
  outline: none;
  cursor: pointer;
}

.regist-title-text{
  font-size: 26px;
}
</style>
