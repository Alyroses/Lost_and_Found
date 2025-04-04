import { get, post } from '/@/utils/http/axios';

enum URL {
  create = '/myapp/index/comment/create',
  listThingComments = '/myapp/index/comment/list',
  listUserComments = '/myapp/index/comment/listMyComments',
  like = '/myapp/index/comment/like',
  deleteCommentsApi = '/myapp/index/comment/delete', // 添加删除评论的 URL
}

const createApi = async (data: any) =>
  post<any>({
    url: URL.create,
    params: {},
    data: data,
    headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' },
  });
const listThingCommentsApi = async (params: any) => get<any>({ url: URL.listThingComments, params: params, data: {}, headers: {} });
const listUserCommentsApi = async (params: any) => get<any>({ url: URL.listUserComments, params: params, data: {}, headers: {} });
const likeApi = async (params: any) => post<any>({ url: URL.like, params: params, headers: {} });
const deleteCommentsApi = async (params: any) => post<any>({ url: URL.deleteCommentsApi, params: params, headers: {} }); // 添加删除评论的 API

export { createApi, listThingCommentsApi, listUserCommentsApi, likeApi, deleteCommentsApi };
