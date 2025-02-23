<template>
  <div class="container">
    <div class="login-page pc-style">
      <img :src="LogoIcon" alt="logo" class="logo-icon" />
      <div class="login-tab">
        <div class="tab-selected">
          <span>账户登录</span>
          <span class="tabline tabline-width"></span>
        </div>
      </div>
      <div class="mail-login" type="login">
        <div class="common-input">
          <img :src="MailIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入注册邮箱" v-model="pageData.loginForm.username" type="text" class="input" />
            <p class="err-view"> </p>
          </div>
          <!---->
        </div>
        <div class="common-input">
          <img :src="PwdIcon" class="left-icon" />
          <div class="input-view">
            <input placeholder="请输入密码" v-model="pageData.loginForm.password" type="password" class="input" />
            <p class="err-view"> </p>
          </div>
        </div>
        <div class="more_input clearfix">
          <input type="checkbox" v-model="remember">
          <label >记住登录</label>
          <a href="/find_password.html">忘记密码</a>
        </div>
        <div class="next-btn-view">
          <button class="next-btn btn-active" style="margin: 16px 0px" @click="handleLogin">登录</button>
        </div>
      </div>
      <!-- <div class="operation">
        <a class="forget-pwd" style="text-align: right">忘记密码？</a>
      </div> -->
      <div class="third_party">
        <a @click="handleQQLogin" class="qq_login">QQ</a>
        <a href="#" class="weixin_login">微信</a>
        <a @click="handleCreateUser" class="register_btn">注册新帐号</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
// 更换图片路径
import LogoIcon from '/public/lost_found_logo.png';
import MailIcon from '/@/assets/images/mail-icon.svg';
import PwdIcon from '/@/assets/images/pwd-icon.svg';
import QQIcon from '/@/assets/images/qq-icon.svg'; // 引入QQ图标
import { useUserStore } from '/@/store';

const router = useRouter();
const userStore = useUserStore();

const pageData = reactive({
  loginForm: {
    username: '',
    password: '',
    captcha: ''
  },
});

const remember = ref(false);

// const captchaImageUrl = ref('http://localhost:8000/myapp/index/user/generateCaptcha'); // 设置验证码生成的 URL

// const reloadCaptcha = () => {
//   captchaImageUrl.value = `http://localhost:8000/myapp/index/user/generateCaptcha?${new Date().getTime()}`;
// };

const handleLogin = () => {
  
  userStore
    .login({
      username: pageData.loginForm.username,
      password: pageData.loginForm.password,
      captcha: pageData.loginForm.captcha,
    })
    .then((res) => {
      loginSuccess();
      console.log('success==>', userStore.user_name);
      console.log('success==>', userStore.user_id);
      console.log('success==>', userStore.user_token);
    })
    .catch((err) => {
      message.warn(err.msg || '登录失败');
      // reloadCaptcha();
    });
};

const handleCreateUser = () => {
  router.push({ name: 'register' });
};

const handleQQLogin = () => {
  // 处理QQ登录逻辑
  window.location.href = 'https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&state=YOUR_STATE';
};

const loginSuccess = () => {
  router.push({ name: 'portal' });
  message.success('登录成功！');
};
</script>
<style scoped lang="less">
div {
  display: block;
}

.container {
  //background-color: #f1f1f1;
  background-image: url('../images/login-background.jpg'); // 使用 @ 符号表示 src 目录
  background-size: cover;
  object-fit: cover;
  height: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.new-content {
  position: absolute;
  left: 0;
  right: 0;
  margin: 80px auto 0;
  width: 980px;
}

.logo-img {
  width: 125px;
  display: block;
  margin-left: 137.5px;
}

.login-page {
  overflow: hidden;
  background: #fff;

  .logo-icon {
    margin-top: 7px;
    margin-left: 153px;
    width: 100px;
    height: 104px;
  }
}

.pc-style {
  position: relative;
  width: 420px;
  height: 530px;
  background:#faf4eb;
  border-radius: 4px;
  -webkit-box-shadow: 2px 2px 6px #aaa;
  box-shadow:  7px 8px 6px #fcf7f7;
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/public/images/login_register_background.jpg');
    background-size: cover;
    opacity: 0.5; // 设置透明度
    z-index: -1;
  }
}

.login-tab {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  // color: #1e1e1e;
  font-size: 14px;
  color: #0afc8b;
  font-weight: 500;
  height: 46px;
  line-height: 44px;
  margin-bottom: 24px;
  border-bottom: 2px solid #c3c9d5;
  font-size: 28px;

  div {
    position: relative;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    text-align: center;
    cursor: pointer;
  }

  .tabline {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: inline-block;
    width: 0;
    height: 2px;
    background: #3d5b96;
    -webkit-transition: width 0.5s cubic-bezier(0.46, 1, 0.23, 1.52);
    transition: width 0.5s cubic-bezier(0.46, 1, 0.23, 1.52);
  }

  tab-selected {
    color: #1e1e1e;
    font-weight: 500;
  }

  .mail-login,
  .tel-login {
    padding: 0 28px;
  }
}

.mail-login {
  margin: 0px 24px;
}

.common-input {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: start;
  -ms-flex-align: start;
  align-items: flex-start;
  margin-top: 20px;

  .left-icon {
    margin-right: 12px;
    width: 24px;
  }

  .input-view {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;

    .input {
      font-weight: 500;
      font-size: 14px;
      color: #836666;
      height: 40px;
      line-height: 26px;
      border: none;
      padding: 13px;
      display: block;
      width: 100%;
      letter-spacing: 1.5px;
    }

    err-view {
      margin-top: 4px;
      height: 16px;
      line-height: 16px;
      font-size: 12px;
      color: #f62a2a;
    }
  }
}

.next-btn {
  background: #3d5b96;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  height: 40px;
  line-height: 40px;
  text-align: center;
  width: 100%;
  outline: none;
  cursor: pointer;
}

button {
  background: transparent;
  padding: 0;
  border-width: 0px;
}

button,
input,
select,
textarea {
  margin: 0;
  padding: 0;
  outline: none;
}

.operation {
  display: flex;
  flex-direction: row;
  margin: 0 24px;
}

.forget-pwd {
  //text-align: center;
  display: block;
  overflow: hidden;
  flex: 1;
  margin: 0 auto;
  color: #3d5b96;
  font-size: 14px;
  cursor: pointer;
}

.qq-login {
  display: flex;
  justify-content: center;
  margin-top: 20px;

  .qq-icon {
    width: 48px;
    height: 48px;
    cursor: pointer;
  }
}

.captcha-img{
  margin-right: 20px;
}

.third_party{border-top:1px solid #e0e0e0;margin-top:44px}
.qq_login,.weixin_login,.register_btn{float:left;line-height:30px;margin-left:15px;margin-top:15px;color:#666;font-size:14px;text-indent:22px;background:url(../images/QQ-weixin.png) left 7px no-repeat;}
.qq_login:hover,.weixin_login:hover,.register_btn:hover{color:#e3101e;text-decoration:underline}
.weixin_login{background-position:left -35px;}
.register_btn{background:url(../images/icons02.png) left 9px no-repeat;float:right;margin-right:15px}

.more_input{position:absolute;left:0;bottom: 120px;width:100%}

.more_input input{float:left;margin-top:6px;margin-left: 20px;}
.more_input label{float:left;margin-left:10px;font-size: 16px;}
.more_input a{float:right;color:#666;margin-right: 26px;font-size: 16px;}
.more_input a:hover{color:#ff8800}
</style>
