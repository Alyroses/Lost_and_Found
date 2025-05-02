<template>
  <div class="content-margin">
    <h1 class="search-name-box">{{ tData.keyword }}</h1>
    <div class="search-tab-nav clearfix">
      <div class="tab-text">
        <span>与</span>
        <span class="strong">{{ tData.keyword }}</span>
        <span>相关的内容</span>
      </div>
    </div>
    <div class="content-list">
      <div class="thing-list">
        <a-spin :spinning="tData.loading" style="min-height: 200px">
          <div class="things flex-view">
            <div class="thing-item item-column-4" v-for="item in tData.pageData" @click="handleDetail(item)">
              <div class="img-view">
                <img
                  :src="item.cover"
                  @error="handleImageError(item.cover, $event)"
                  :alt="item.title"
                />
              </div>
              <div class="info-view">
                <h3 class="thing-name">{{ item.title.substring(0, 12) }}</h3>
                <span>
                  <span class="a-price-symbol"></span>
                  <span class="a-price">地点：{{ item.location }}</span><br>
                  <span class="a-price">积分奖励：{{ item.price }} 积分</span>  
                </span>
              </div>
            </div>
          </div>
        </a-spin>
        <div class="page-view" style="">
          <a-pagination
            v-model:value="tData.page"
            size="small"
            @change="changePage"
            :hideOnSinglePage="true"
            :defaultPageSize="tData.pageSize"
            :total="tData.total"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { listApi as listThingList } from '/@/api/index/thing'; 
  import { useUserStore } from '/@/store';
  import Header from '/@/views/index/components/header.vue';
  import Footer from '/@/views/index/components/footer.vue';
  import { reactive, onMounted, watch } from 'vue'; 
  import { useRouter, useRoute } from 'vue-router'; 

  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();

  const tData = reactive({
    loading: false,
    keyword: '',
    thingData: [],
    pageData: [],
    page: 1,
    total: 0,
    pageSize: 20,
  });

  onMounted(() => {
    search();
  });

  watch(
    () => route.query,
    (newPath, oldPath) => {
      search();
    },
    { immediate: false },
  );

  const search = () => {
    tData.keyword = route.query.keyword?.trim() || '未定义关键词';
    getThingList({ keyword: tData.keyword });
  };

  const changePage = (page) => {
    tData.page = page;
    let start = (tData.page - 1) * tData.pageSize;
    const currentPageData = tData.thingData.slice(start, start + tData.pageSize);
    console.log('Data being assigned to pageData (from changePage):', JSON.stringify(currentPageData, null, 2)); 
    if (currentPageData.length > 0) {
      console.log('First item cover URL before rendering (from changePage):', currentPageData[0].cover);
    }
    tData.pageData = currentPageData;
    console.log('第' + tData.page + '页');
  };

  const handleDetail = (item) => {
    let text = router.resolve({ name: 'detail', query: { id: item.id } });
    window.open(text.href, '_blank');
  };

  const getThingList = async (data) => { 
    tData.loading = true;
    try {
      const res = await listThingList(data);
      console.log('API Response in getThingList:', JSON.stringify(res, null, 2)); 

      if (res && res.code === 0 && Array.isArray(res.data)) {
        tData.thingData = res.data;
        tData.total = tData.thingData.length;
        if (tData.thingData.length > 0) {
            console.log('First item cover URL after assignment:', tData.thingData[0].cover);
        }
        changePage(1); 
      } else {
        console.error('获取列表失败或数据格式无效:', res);
        tData.thingData = []; 
        tData.total = 0;
        tData.pageData = [];
      }
    } catch (err) {
      console.error('请求出错:', err);
      tData.thingData = []; 
      tData.total = 0;
      tData.pageData = [];
    } finally {
      tData.loading = false; 
    }
  };

  const handleImageError = (url, event) => {
    console.error(`图片加载失败: ${url}`, event);
  };

</script>
<style scoped lang="less">
  .content-margin {
    margin: 141px 0 100px;
  }

  .page-view {
    width: 100%;
    text-align: center;
    margin-top: 48px;
  }

  .search-name-box {
    background: #ecf4f491;
    height: 82px;
    line-height: 100px;
    font-size: 36px;
    color: #d71313;
    text-align: center;
    position: fixed;
    font-family: '方正剪纸简体';
    top: 56px;
    left: 0;
    z-index: 1;
    width: calc(100% - 8px);
  }

  .search-tab-nav {
    position: relative;
    padding: 24px 0 16px;
    text-align: center;

    .tab-text {
      float: left;
      color: #7ef864;
      font-size: 20px;
    }

    .strong {
      color: #f01212;
      font-weight: 600;
      margin: 0 4px;
    }
  }

  .things {
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
  }

  .flex-view {
    display: flex;
  }

  .thing-item {
    min-width: 255px;
    max-width: 255px;
    position: relative;
    flex: 1;
    margin-right: 20px;
    height: fit-content;
    overflow: hidden;
    margin-top: 26px;
    margin-bottom: 36px;
    cursor: pointer;

    .img-view {
      height: 200px;
      width: 255px;

      img {
        height: 200px;
        width: 186px;
        margin: 0 auto;
        background-size: cover;
        object-fit: cover;
      }
    }

    .info-view {
      overflow: hidden;
      padding: 0 16px;

      .thing-name {
        line-height: 32px;
        margin-top: 12px;
        color: #0f1111 !important;
        font-size: 15px !important;
        font-weight: 400 !important;
        font-style: normal !important;
        text-transform: none !important;
        text-decoration: none !important;
      }

      .price {
        color: #ff7b31;
        font-size: 20px;
        line-height: 20px;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .translators {
        color: #6f6f6f;
        font-size: 12px;
        line-height: 14px;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .a-price-symbol {
    top: -0.5em;
    font-size: 12px;
  }

  .a-price {
    color: #0f1111;
    font-size: 14px;
  }
</style>
