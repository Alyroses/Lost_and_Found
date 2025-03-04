<template>
    <div class="ditu">
        <Header />
        <div class="map-container">
            <div id="map"></div>
        </div>
        <Footer />
    </div>

</template>

<script>
import { listApi as listThingList } from '/@/api/index/thing';
import { BASE_URL } from '/@/store/constants';
import Footer from '/@/views/index/components/footer.vue';
import Header from '/@/views/index/components/header.vue';
import itemIcon from '/src/assets/icons/svg/地图标记.svg'; // 引入自定义图标

export default {
    components: {
        Footer,
        Header,
    },
    mounted() {
        this.loadBaiduMap();
        this.getThingList();
    },
    methods: {
        loadBaiduMap() {
            if (typeof window.BMapGL !== "undefined") {
                this.initMap();
            } else {
                const checkBMapGL = setInterval(() => {
                    if (typeof window.BMapGL !== "undefined") {
                        clearInterval(checkBMapGL);
                        this.initMap();
                    }
                }, 100);
            }
        },
        initMap() {
            // 获取用户当前位置并设置为地图中心点
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        const centerPoint = new window.BMapGL.Point(longitude, latitude); // 使用当前位置

                        this.map = new window.BMapGL.Map("map");
                        this.map.centerAndZoom(centerPoint, 15); // 设置地图中心点为当前位置
                        this.map.enableScrollWheelZoom(true); // 启用滚轮缩放

                        // 添加当前位置标记
                        const marker = new window.BMapGL.Marker(centerPoint);
                        this.map.addOverlay(marker);
                        marker.setAnimation(window.BMAP_ANIMATION_BOUNCE); // 设置标记点跳动动画

                        // 添加数据库中的地址标记
                        this.addMarkers();
                    },
                    (error) => {
                        console.error("获取位置信息失败：", error);
                        this.setDefaultCenter(); // 如果获取当前位置失败，则使用默认中心点
                    }
                );
            } else {
                alert("浏览器不支持地理位置功能");
                this.setDefaultCenter(); // 如果浏览器不支持定位，使用默认中心点
            }
        },
        setDefaultCenter() {
            const defaultPoint = new window.BMapGL.Point(116.404, 39.915); // 默认中心点（北京）
            this.map = new window.BMapGL.Map("map");
            this.map.centerAndZoom(defaultPoint, 15);
            this.map.enableScrollWheelZoom(true);

            // 添加数据库中的地址标记
            this.addMarkers();
        },
        addMarkers() {
            const iconSize = new window.BMapGL.Size(32, 32); // 图标大小
            const icon = new window.BMapGL.Icon(itemIcon, iconSize);

            this.locations.forEach(location => {
                const point = new window.BMapGL.Point(location.lng, location.lat);
                const marker = new window.BMapGL.Marker(point, { icon: icon });
                this.map.addOverlay(marker);
                this.markers.push(marker);

                // 点击标记点时显示自定义信息
                marker.addEventListener('click', () => {
                    const infoWindow = new window.BMapGL.InfoWindow(location.info, {
                        width: 200,
                        height: 100,
                        title: "物品信息详情",
                    });
                    this.map.openInfoWindow(infoWindow, point); // 在点击的标记点打开信息窗口
                });
            });
        },
        getThingList() {
            listThingList()
                .then((res) => {
                    res.data.forEach((item) => {
                        if (item.cover) {
                            item.cover = BASE_URL + item.cover;
                        }
                    });
                    console.log(res);
                    this.thingData = res.data;
                    console.log(this.thingData)

                    // 构建 locations 数组
                    this.locations = this.thingData.map(item => {
                        return {
                            lat: item.latitude,
                            lng: item.longitude,
                            info: `标题：${item.title} <br>
                            地点：${item.location}` // 组合 title 和 location
                        };
                    });

                    // 添加标记到地图上
                    this.addMarkers();

                })
                .catch((err) => {
                    console.log(err);
                });
        },
    },
    data() {
        return {
            map: null,
            markers: [],
            thingData: [],
            locations: [],
        };
    },
};


</script>

<style>
.map-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}

#map {
    width: 90%;
    height: 90%;
    border: 1px solid #ccc;
}

button {
    margin-top: 10px;
}
</style>