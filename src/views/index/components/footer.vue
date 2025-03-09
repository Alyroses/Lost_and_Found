<template>
  <div class ="line-border"></div>
  <div class="footer-view">
    <div class="foot-link-box flex-view">
      <a class="foot-link" @click="handleSource">关于我的毕设</a>
    </div>
    <div class="footer-infos">
      <span>
        <a style="color: #090909">XXX备123456789号</a>
      </span>
      <span>&nbsp;&nbsp;张家界学院计算机科学与技术专业三班&nbsp;&nbsp;2021210307&nbsp;&nbsp;十分感谢您的使用</span>
    </div>
    <div class="address">基于Django的失物招领系统设计与实现项目</div>
  </div>
</template>

<script>
  import { Modal } from 'ant-design-vue';

  export default {
    name: 'Footer',
    data() {
      return {};
    },
    methods: {
      handleSource() {
        Modal.info({
          title: '欢迎体验',
          content: '随时随地帮你找回失物',
          onOk() {},
        });
      },
    },
  };
</script>

<style scoped lang="less">
  .flex-view {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
  }

  .footer-view {
    max-width: 100%;
    margin: 0 auto;
    padding: 0px 0 20px 54px;
    // border: 2px solid #000;

    .foot-link-box {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      overflow: hidden;
      margin: 24px auto 16px;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      justify-content: center;

      .foot-link {
        margin: 0 16px;
        color: #090909;
      }
      a {
        background-color: transparent;
        text-decoration: none;
        color: var(--mid-blue);
      }
    }

    .footer-infos {
      height: 16px;
      line-height: 16px;
      font-size: 12px;
      padding-left: 63px;
      color: #090909;
      margin-top: 16px;
      text-align: center;
    }
    .address {
      text-align: center;
      height: 16px;
      line-height: 16px;
      font-size: 12px;
      color: #090909;
      margin-top: 8px;
    }
  }

  .copyright {
    display: block;
    width: 100%; // 设置宽度为100%
    height: 2px;
    background-color: #000; // 设置为黑色
  }
  .line-border{
    border: 1px solid #bfb7b7e5;
    width: 100%;
  }
</style>
