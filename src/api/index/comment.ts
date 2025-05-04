import { get, post } from '/@/utils/http/axios';

enum URL {
  create = '/myapp/index/comment/create',
  listThingComments = '/myapp/index/comment/list',
  listUserComments = '/myapp/index/comment/listMyComments',
  like = '/myapp/index/comment/like',
  deleteCommentsApi = '/myapp/index/comment/delete', // 添加删除评论的 URL
}

// 修改 createApi 的参数类型和传递方式
const createApi = async (data: {
  content: string;
  thingId: string;
  itemType: string;
  user_id: string | number; // 根据实际类型调整
  parentCommentId?: string | number | null; // 可选
}) => {
  // 创建发送给后端的数据对象，进行键名映射
  const requestData = {
    content: data.content,
    thingId: data.thingId, // 将 itemId 映射为 thingId
    itemType: data.itemType,
    user_id: data.user_id,
    parentCommentId: data.parentCommentId,
  };

  return post<any>({
    url: URL.create,
    data: requestData, // 发送包含 thingId 的数据对象
  });
};

const listThingCommentsApi = async (params: any) => get<any>({ url: URL.listThingComments, params: params, data: {}, headers: {} });
const listUserCommentsApi = async (params: any) => get<any>({ url: URL.listUserComments, params: params, data: {}, headers: {} });
const likeApi = async (params: any) => post<any>({ url: URL.like, params: params, headers: {} });
const deleteCommentsApi = async (params: any) => post<any>({ url: URL.deleteCommentsApi, params: params, headers: {} }); // 添加删除评论的 API

export { createApi, listThingCommentsApi, listUserCommentsApi, likeApi, deleteCommentsApi };
