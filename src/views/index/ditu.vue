<template>
    <div class="map-page">
        <Header />
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
import markerIcon from '/src/assets/icons/svg/地图标记.svg';

// const DEFAULT_CENTER = { lng: 113.86689, lat: 39.915 };

export default {
    components: { Footer, Header },
    data() {
        return {
            map: null,
            markers: [],
            thingData: [],
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
                await this.getThingList();
                await this.startLocationFlow();
            } catch (error) {
                console.error('地图初始化失败:', error);
                this.$alert('地图加载失败，请刷新页面重试');
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
                this.map.centerAndZoom(new BMapGL.Point(lng, lat), this.zoomLevel);
                
                // 获取详细地理信息
                this.locationDetail = await this.reverseGeocode(lng, lat);
                this.currentAddress = this.locationDetail?.formatted || '未知位置';
                
                // 添加标记和信息窗口
                this.addLocationMarker(lng, lat);
                this.addMarkers();
            } catch (error) {
                console.error('位置处理失败:', error);
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
                icon: new BMapGL.Icon(markerIcon, new BMapGL.Size(36, 36)),
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
                const res = await listThingList();
                this.thingData = res.data.map(item => ({
                    lat: item.latitude,
                    lng: item.longitude,
                    title: item.title,
                    location: item.location,
                    time: item.timestamp
                }));
                this.addMarkers();
            } catch (error) {
                console.error('数据获取失败:', error);
            }
        },

        addMarkers() {
            this.clearAllMarkers();
            
            this.thingData.forEach(data => {
                const point = new BMapGL.Point(data.lng, data.lat);
                const marker = new BMapGL.Marker(point, {
                    icon: new BMapGL.Icon(markerIcon, new BMapGL.Size(32, 32))
                });
                
                marker.addEventListener('click', () => {
                    const content = `
                        <div class="info-window">
                            <h3>${data.title}</h3>
                            <p class="location">📍 ${data.location}</p>
                            <div class="details">
                                <p><strong>经度:</strong> ${data.lng.toFixed(6)}</p>
                                <p><strong>纬度:</strong> ${data.lat.toFixed(6)}</p>
                                ${data.time ? `<p><strong>时间:</strong> ${new Date(data.time).toLocaleString()}</p>` : ''}
                            </div>
                        </div>
                    `;
                    
                    const infoWindow = new BMapGL.InfoWindow(content, {
                        width: 280,
                        title: '物品详情'
                    });
                    
                    this.map.openInfoWindow(infoWindow, point);
                });

                this.markers.push(marker);
                this.map.addOverlay(marker);
            });
        },

        clearExistingMarker() {
            if (this.locationMarker) {
                this.map.removeOverlay(this.locationMarker);
                this.locationMarker = null;
            }
        },

        clearAllMarkers() {
            this.markers.forEach(marker => this.map.removeOverlay(marker));
            this.markers = [];
        },

        refreshLocation() {
            if (this.isLocating) return;
            this.isLocating = true;
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
</style>