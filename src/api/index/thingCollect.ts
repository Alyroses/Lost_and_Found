import { get, post } from '/@/utils/http/axios';
import { UserState } from '/@/store/modules/user/types';

enum URL {
    userCollectList = '/api/thingCollect/getUserCollectList',
    collect = '/api/thingCollect/collect',
    unCollect = '/api/thingCollect/unCollect',
    toggleCollect = '/myapp/index/collect/toggle/', // 新增切换收藏状态的 URL
}

const collectApi = async (data: any) => post<any>({ url: URL.collect, params: {}, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } });
const unCollectApi = async (params: any) => post<any>({ url: URL.unCollect, params: params, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } });
const userCollectListApi = async (params: any) => get<any>({ url: URL.userCollectList, params: params });
const toggleCollectApi = async (data: any) => post<any>({ url: URL.toggleCollect, data: data, headers: { 'Content-Type': 'application/json' } }); // 新增切换收藏状态的 API

export { collectApi, unCollectApi, userCollectListApi, toggleCollectApi };
