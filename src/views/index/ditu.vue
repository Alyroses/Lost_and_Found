<template>
    <div class="map-page">
        <!-- 添加 style 确保 Header 在最上层 -->
        <Header style="position: relative; z-index: 1001;" />
        <div class="control-panel">
            <div class="location-info" v-if="currentAddress">
                <span class="address-tag">📍 当前定位：</span>
                <span class="address-text">{{ currentAddress }}</span>
            </div>
            <div class="control-buttons">
                <button @click="refreshLocation" class="btn primary">重新定位</button>
                <button @click="getMapCenter" class="btn">获取中心点</button>
                <div class="zoom-control">
                    <input v-model.number="zoomLevel" type="number" min="4" max="20" 
                           class="zoom-input" @keyup.enter="setNewZoom" />
                    <button @click="setNewZoom" class="btn">设置级别</button>
                </div>
                <button @click="zoomIn" class="btn">放大</button>
                <button @click="zoomOut" class="btn">缩小</button>
            </div>
        </div>
        <div id="map-container" ref="mapContainer" class="map-container"></div>
        <Footer />
    </div>
</template>

<script>
import { listApi as listThingList } from '/@/api/index/thing';
import Header from '/@/views/index/components/header.vue';
import Footer from '/@/views/index/components/footer.vue';
import redMarkerIcon from '/src/assets/icons/svg/red-marker.svg'; // 假设红色图标在此路径
import greenMarkerIcon from '/src/assets/icons/svg/green-marker.svg';
// 新增：导入拾物图标
import foundMarkerIcon from '/src/assets/icons/svg/拾物定位.svg';

export default {
    components: { Footer, Header },
    data() {
        return {
            map: null,
            markers: [], // 失物标记
            foundMarkers: [], // 新增：拾物标记
            thingData: [], // 失物数据
            foundThingData: [], // 新增：拾物数据
            zoomLevel: 7, // 默认缩放级别
            currentAddress: '',
            geocoder: null,
            locationMarker: null,
            isLocating: false,
            locationDetail: null
        };
    },
    mounted() {
        this.$nextTick(this.initMap);
    },
    methods: {
        async initMap() {
            try {
                if (!window.BMapGL) await this.loadBaiduMapSDK();
                this.createMapInstance();
                this.initGeocoder();
                // 修改：并行获取失物和拾物列表
                await Promise.all([
                    this.getThingList(),
                    this.getFoundThingList() // 新增调用
                ]);
                await this.startLocationFlow(); // 定位应在获取数据之后，以便添加标记时地图已初始化
            } catch (error) {
                console.error('地图初始化失败:', error);
                // 移除或替换 this.$alert，因为它可能不是 Vue 3 的标准方法
                // 使用 console.error 或其他 UI 库的提示方法
                console.error('地图加载失败，请刷新页面重试');
            }
        },

        loadBaiduMapSDK() {
            return new Promise((resolve, reject) => {
                if (window.BMapGL) return resolve();

                const script = document.createElement('script');
                script.src = "https://api.map.baidu.com/api?type=webgl&v=1.0&ak=iPOXvqEzgVCNdQOmHwudK3jmLdvjFPAo";
                script.onload = () => {
                    if (!window.BMapGL?.Geocoder) {
                        reject(new Error('地图API加载不完整'));
                        return;
                    }
                    resolve();
                };
                script.onerror = reject;
                document.body.appendChild(script);
            });
        },

        createMapInstance() {
            try {
                this.map = new BMapGL.Map('map-container', {
                    enableAutoResize: true,
                    maxZoom: 19,
                    minZoom: 5 // 设置最小缩放级别为 5（省级）
                });
                this.map.enableScrollWheelZoom(true);
                this.map.addControl(new BMapGL.NavigationControl());
            } catch (error) {
                throw new Error('地图实例创建失败: ' + error.message);
            }
        },

        initGeocoder() {
            this.geocoder = new BMapGL.Geocoder();
        },

        async startLocationFlow() {
            try {
                await this.getHighPrecisionLocation();
            } catch (error) {
                console.warn('定位失败:', error);
                await this.fallbackLocation();
            }
        },

        async getHighPrecisionLocation() {
            if (!window.isSecureContext) {
                console.warn('非安全上下文,使用IP定位');
                return this.getIpLocation();
            }

            return new Promise((resolve, reject) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            try {
                                await this.handleLocationSuccess(
                                    pos.coords.longitude,
                                    pos.coords.latitude,
                                    'GPS定位'
                                );
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        },
                        async (error) => {
                            console.warn('GPS定位失败:', error);
                            try {
                                await this.useBaiduGeolocation();
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                    );
                } else {
                    this.useBaiduGeolocation().then(resolve).catch(reject);
                }
            });
        },

        useBaiduGeolocation() {
            return new Promise((resolve, reject) => {
                const geolocation = new BMapGL.Geolocation();
                geolocation.getCurrentPosition(
                    async (result) => {
                        if (result?.point) {
                            try {
                                await this.handleLocationSuccess(
                                    result.point.lng,
                                    result.point.lat,
                                    '百度定位'
                                );
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            reject(new Error('百度定位失败'));
                        }
                    },
                    error => reject(error),
                    { provider: 'system' }
                );
            });
        },

        async handleLocationSuccess(lng, lat, source) {
            try {
                this.clearExistingMarker();
                const point = new BMapGL.Point(lng, lat);
                // --- 修改：先设置中心点和缩放级别 ---
                this.map.centerAndZoom(point, this.zoomLevel);
                // --- 修改结束 ---

                const detail = await this.reverseGeocode(lng, lat);
                if (detail) {
                    this.currentAddress = detail.formatted;
                    this.locationDetail = detail;
                    console.log(`定位成功 (${source}):`, detail);
                } else {
                    this.currentAddress = `经度: ${lng.toFixed(4)}, 纬度: ${lat.toFixed(4)}`;
                    this.locationDetail = null; // 清除旧详情
                    console.log(`定位成功 (${source}), 但逆地址解析失败`);
                }
                // --- 修改：在地图中心设置完成后再添加标记 ---
                this.addLocationMarker(lng, lat);
                // --- 修改结束 ---
            } catch (error) {
                console.error('处理定位结果时出错:', error);
                this.currentAddress = '定位处理失败';
                this.locationDetail = null;
                // 可以选择设置默认中心点
                // this.setDefaultCenter();
                // 抛出错误以便上层知道处理失败
                throw error;
            }
        },

        async reverseGeocode(lng, lat) {
            return new Promise((resolve) => {
                this.geocoder.getLocation(new BMapGL.Point(lng, lat), (result) => {
                    if (!result) return resolve(null);
                    
                    const detail = {
                        formatted: result.address,
                        province: result.addressComponents.province,
                        city: result.addressComponents.city,
                        district: result.addressComponents.district,
                        street: `${result.addressComponents.street || ''}${result.addressComponents.streetNumber || ''}`,
                        neighborhood: result.surroundingPois?.[0]?.title || '未知小区',
                        business: result.business || '未知商圈'
                    };
                    resolve(detail);
                });
            });
        },

        addLocationMarker(lng, lat) {
            const point = new BMapGL.Point(lng, lat);
            
            // 清除旧标记
            if (this.locationMarker) {
                this.map.removeOverlay(this.locationMarker);
            }

            // 创建新标记
            this.locationMarker = new BMapGL.Marker(point, {
                icon: new BMapGL.Icon(redMarkerIcon, new BMapGL.Size(36, 36)), // 使用红色图标
                enableMassClear: false
            });

            // 添加信息窗口
            this.locationMarker.addEventListener('click', () => {
                if (!this.locationDetail) return;
                
                const content = `
                    <div class="info-window">
                        <h3>定位详情</h3>
                        <p class="main-address">📍 ${this.locationDetail.formatted}</p>
                        <div class="detail-section">
                            <p><strong>省份:</strong> ${this.locationDetail.province}</p>
                            <p><strong>城市:</strong> ${this.locationDetail.city}</p>
                            <p><strong>区域:</strong> ${this.locationDetail.district}</p>
                            <p><strong>街道:</strong> ${this.locationDetail.street}</p>
                            <p><strong>商圈:</strong> ${this.locationDetail.business}</p>
                        </div>
                    </div>
                `;

                const infoWindow = new BMapGL.InfoWindow(content, {
                    width: 300,
                    height: 250,
                    title: '位置详情'
                });
                
                this.map.openInfoWindow(infoWindow, point);
            });

            this.locationMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
            this.map.addOverlay(this.locationMarker);
        },

        async getIpLocation() {
            try {
                const result = await new Promise(resolve => 
                    new BMapGL.LocalCity().get(resolve)
                );
                await this.handleLocationSuccess(
                    result.center.lng,
                    result.center.lat,
                    'IP定位'
                );
            } catch (error) {
                console.error('IP定位失败:', error);
                this.setDefaultCenter();
            }
        },

        async getThingList() {
            try {
                // 调用后端 API 获取失物列表
                const res = await listThingList({ type: 'lost', status: '1' }); // 明确获取已审核的失物
                // 确保后端返回的数据包含所需字段，包括嵌套的 user 信息 和 detail_location
                this.thingData = res.data.filter(item => item.longitude && item.latitude).map(item => ({
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    title: item.title || '无标题',
                    location: item.location || '未知地区', // 省市区
                    detailLocation: item.detail_location || '未提供', // 新增：详细地址
                    description: item.description || '无描述',
                    cover: item.cover, // 图片 URL
                    mobile: item.mobile || '未提供', // 联系电话
                    // 处理用户信息，优先用 nickname，否则用 username
                    userNickname: item.user?.nickname || item.user?.username || '匿名用户',
                    id: item.id,
                    type: 'lost' // 添加类型标识
                }));
                console.log("Fetched and processed LOST thing data:", this.thingData);
                this.addMarkers(); // 获取数据后添加失物标记
            } catch (error) {
                console.error('获取失物数据失败:', error);
                // this.$message.error('加载失物信息失败，请稍后重试');
            }
        },

        // --- 新增：获取拾物列表 ---
        async getFoundThingList() {
            try {
                // 调用后端 API 获取拾物列表
                const res = await listThingList({ type: 'found', status: '1' }); // 明确获取已审核的拾物
                // 处理返回的数据，包含 detail_location
                this.foundThingData = res.data.filter(item => item.longitude && item.latitude).map(item => ({
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    title: item.title || '无标题',
                    location: item.location || '未知地区', // 省市区
                    detailLocation: item.detail_location || '未提供', // 新增：详细地址
                    description: item.description || '无描述',
                    cover: item.cover, // 图片 URL
                    mobile: item.mobile || '未提供', // 联系电话
                    // 处理用户信息
                    userNickname: item.user?.nickname || item.user?.username || '匿名用户',
                    id: item.id,
                    type: 'found' // 添加类型标识
                }));
                console.log("Fetched and processed FOUND thing data:", this.foundThingData);
                this.addFoundMarkers(); // 获取数据后添加拾物标记
            } catch (error) {
                console.error('获取拾物数据失败:', error);
            }
        },
        // --- 获取拾物列表结束 ---

        addMarkers() {
            // this.clearAllMarkers(); // 不在此处清除，统一在需要时清除
            if (!this.thingData || this.thingData.length === 0) {
                console.log("没有失物数据可供标记");
                return;
            }

            this.thingData.forEach(data => {
                if (isNaN(data.lng) || isNaN(data.lat)) {
                    console.warn("无效的失物经纬度，跳过标记:", data);
                    return;
                }

                const point = new BMapGL.Point(data.lng, data.lat);
                const marker = new BMapGL.Marker(point, {
                    icon: new BMapGL.Icon(greenMarkerIcon, new BMapGL.Size(32, 32)) // 使用绿色图标表示失物
                });

                marker.addEventListener('click', () => {
                    // --- 修改：添加详细地址显示 ---
                    const content = `
                        <div class="info-window thing-info-window lost-info-window">
                            <h3>${data.title} (失物)</h3>
                            ${data.cover ? `<img src="${data.cover}" alt="${data.title}" style="height: 160px; width: 240px;">` : '<p class="no-cover">暂无图片</p>'}
                            <p class="location">📍 地区: ${data.location}</p>
                            <p class="detail-location">🗺️ 详细地点: ${data.detailLocation}</p> 
                            <p class="description">${data.description}</p>
                            <div class="details">
                                <p><strong>发布者:</strong> ${data.userNickname}</p>
                                <p><strong>联系电话:</strong> ${data.mobile}</p>
                            </div>
                            <!-- <button onclick="viewDetail(${data.id})">查看详情</button> -->
                        </div>
                    `;
                    // --- 修改结束 ---
                    const infoWindow = new BMapGL.InfoWindow(content, {
                        width: 280,
                        title: '失物详情'
                    });
                    this.map.openInfoWindow(infoWindow, point);
                });

                this.markers.push(marker);
                this.map.addOverlay(marker);
            });
            console.log(`添加了 ${this.markers.length} 个失物标记`);
        },

        // --- 新增：添加拾物标记 ---
        addFoundMarkers() {
            if (!this.foundThingData || this.foundThingData.length === 0) {
                console.log("没有拾物数据可供标记");
                return;
            }

            this.foundThingData.forEach(data => {
                if (isNaN(data.lng) || isNaN(data.lat)) {
                    console.warn("无效的拾物经纬度，跳过标记:", data);
                    return;
                }

                const point = new BMapGL.Point(data.lng, data.lat);
                // 使用导入的拾物图标
                const marker = new BMapGL.Marker(point, {
                    icon: new BMapGL.Icon(foundMarkerIcon, new BMapGL.Size(32, 32)) // 调整图标大小
                });

                marker.addEventListener('click', () => {
                    // --- 修改：添加详细地址显示 ---
                    const content = `
                        <div class="info-window thing-info-window found-info-window">
                            <h3>${data.title} (拾物)</h3>
                            ${data.cover ? `<img src="${data.cover}" alt="${data.title}" class="info-window-cover" style="height: 160px; width: 240px;">` : '<p class="no-cover">暂无图片</p>'}
                            <p class="location">📍 地区: ${data.location}</p>
                            <p class="detail-location">🗺️ 详细地点: ${data.detailLocation}</p>
                            <p class="description">${data.description}</p>
                            <div class="details">
                                <p><strong>拾得者:</strong> ${data.userNickname}</p>
                                <p><strong>联系电话:</strong> ${data.mobile}</p>
                            </div>
                            <!-- <button onclick="viewDetail(${data.id})">查看详情</button> -->
                        </div>
                    `;
                     // --- 修改结束 ---
                    const infoWindow = new BMapGL.InfoWindow(content, {
                        width: 280,
                        title: '拾物详情'
                    });
                    this.map.openInfoWindow(infoWindow, point);
                });

                this.foundMarkers.push(marker); // 添加到拾物标记数组
                this.map.addOverlay(marker);
            });
            console.log(`添加了 ${this.foundMarkers.length} 个拾物标记`);
        },
        // --- 添加拾物标记结束 ---

        clearExistingMarker() {
            if (this.locationMarker) {
                this.map.removeOverlay(this.locationMarker);
                this.locationMarker = null;
            }
        },

        // --- 修改：清除所有类型的标记 ---
        clearAllMarkers() {
            // 清除失物标记
            this.markers.forEach(marker => this.map.removeOverlay(marker));
            this.markers = [];
            // 清除拾物标记
            this.foundMarkers.forEach(marker => this.map.removeOverlay(marker));
            this.foundMarkers = [];
            console.log("Cleared all thing markers");
        },
        // --- 修改结束 ---

        refreshLocation() {
            if (this.isLocating) return;
            this.isLocating = true;
            // 清除旧的定位标记和详情
            this.clearExistingMarker();
            this.currentAddress = '正在重新定位...';
            this.locationDetail = null;
            // 重新开始定位流程
            this.startLocationFlow().finally(() => {
                this.isLocating = false;
            });
        },

        setDefaultCenter() {
            this.handleLocationSuccess(
                DEFAULT_CENTER.lng,
                DEFAULT_CENTER.lat,
                '默认中心'
            );
        },

        setNewZoom() {
            if (this.zoomLevel < 5 || this.zoomLevel > 19) {
                this.$alert('缩放级别必须在 5 到 19 之间');
                return;
            }
            this.map.setZoom(this.zoomLevel);
        },

        zoomIn() {
            const newZoom = Math.min(this.map.getZoom() + 1, 19);
            this.map.setZoom(newZoom);
        },

        zoomOut() {
            const newZoom = Math.max(this.map.getZoom() - 1, 5); // 确保最小缩放级别为 5
            this.map.setZoom(newZoom);
        }
    },
    beforeDestroy() {
        if (this.map) this.map.destroy();
    }
};
</script>

<style scoped>
.map-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.map-container {
    flex: 1;
    min-height: 500px;
    background: #f0f2f5;
}

.control-panel {
    padding: 1rem;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 1000;
    position: relative; /* 使 z-index 生效 */
}

.location-info {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 12px;
}

.address-tag {
    font-weight: 600;
    color: #409eff;
}

.control-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn {
    padding: 8px 12px;
    border-radius: 4px;
    transition: all 0.2s;
}

.btn.primary {
    background: #409eff;
    color: white;
}

.zoom-control {
    display: flex;
    gap: 4px;
    align-items: center;
}

.zoom-input {
    width: 60px;
    padding: 6px;
    text-align: center;
    border: 1px solid #ddd;
}

/* 信息窗口样式 */
:deep(.info-window) {
    font-family: system-ui, sans-serif;
    line-height: 1.6;
    
    h3 {
        margin: 0 0 8px;
        color: #333;
        font-size: 16px;
    }
    
    .main-address {
        color: #666;
        margin: 0 0 12px;
    }
    
    .detail-section {
        color: #444;
        
        p {
            margin: 4px 0;
            font-size: 14px;
            
            strong {
                color: #333;
                margin-right: 6px;
            }
        }
    }
    
    .location {
        color: #409eff;
        font-weight: 500;
    }
    
    .details {
        margin-top: 8px;
        color: #666;
    }
}

:deep(.thing-info-window) {
    max-height: 250px; /* 设置一个最大高度，例如 250px */
    overflow-y: auto;  /* 允许垂直滚动 */
    padding-right: 5px; /* 为滚动条留出一点空间 */

    h3 { /* content 内部的标题 */
        margin: 0 0 8px;
        color: #333;
        font-size: 16px;
        position: sticky; /* 让标题在滚动时置顶 */
        top: -1px; /* 微调位置，防止被边框遮挡 */
        background: white;
        padding-bottom: 5px;
        z-index: 1;
    }

    .info-window-cover {
        /* 修改：设置指定的宽度和高度 */
        
        object-fit: cover; /* 保持 cover 以填充区域，可能会裁剪 */
        margin-bottom: 8px;
        border-radius: 4px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
    .no-cover {
        color: #999;
        font-style: italic;
        text-align: center;
        margin-bottom: 8px;
        /* 修改：匹配新的图片高度 */
        height: 150px;
        line-height: 150px;
    }
    .location {
        color: #409eff;
        font-weight: 500;
        margin-bottom: 5px;
        font-size: 14px; /* 稍大一点 */
    }
    .description {
        font-size: 13px;
        color: #555;
        margin-top: 5px;
        margin-bottom: 10px;
        line-height: 1.5;
    }
    .details {
        margin-top: 8px;
        color: #666;
        font-size: 13px;
        p {
            margin: 3px 0;
        }
    }
}

/* 可以为不同类型的 InfoWindow 添加特定样式 */
:deep(.lost-info-window) {
    /* 失物窗口特定样式 */
    border-left: 4px solid #4CAF50; /* 绿色边框 */
}

:deep(.found-info-window) {
    /* 拾物窗口特定样式 */
    border-left: 4px solid #ff9800; /* 橙色边框 */
}

:deep(.thing-info-window) {
    /* ... existing common styles ... */

    h3 { /* content 内部的标题 */
        /* ... existing h3 styles ... */
        border-bottom: 1px solid #eee; /* 添加下边框 */
    }

    /* ... other existing styles ... */
    .location, .detail-location { /* 同时为地区和详细地点设置样式 */
        color: #409eff;
        font-weight: 500;
        margin-bottom: 5px;
        font-size: 14px; /* 稍大一点 */
    }
    .detail-location {
        color: #67C23A; /* 可以给详细地点一个不同的颜色 */
    }
}
</style>