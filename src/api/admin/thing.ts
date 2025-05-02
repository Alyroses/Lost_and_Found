// 权限问题后期增加
import { get, post } from '/@/utils/http/axios';
import { UserState } from '/@/store/modules/user/types';
// import axios from 'axios';
enum URL {
  list = '/myapp/admin/thing/list',
  create = '/myapp/admin/thing/create',
  update = '/myapp/admin/thing/update',
  delete = '/myapp/admin/thing/delete',
  detail = '/api/thing/detail',
  // 移除 found_thing_list，因为 list 接口可以通过参数区分
  // found_thing_list = '/myapp/admin/thing/found_thing_list',
}

const listApi = async (params: any) => get<any>({ url: URL.list, params: params, data: {}, headers: {} });
// 移除 found_thing_listApi 的导出
// const found_thing_listApi = async (params: any) => get<any>({ url: URL.list, params: params, data: {}, headers: {} });
const createApi = async (data: any) =>
  post<any>({ url: URL.create, params: {}, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } });
const updateApi = async (params: any, data: any) =>
  post<any>({ url: URL.update, params: params, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } });
const deleteApi = async (params: any) => post<any>({ url: URL.delete, params: params, headers: {} });
const detailApi = async (params: any) => get<any>({ url: URL.detail, params: params, headers: {} });

// 移除 found_thing_listApi 的导出
export { listApi, createApi, updateApi, deleteApi, detailApi };
