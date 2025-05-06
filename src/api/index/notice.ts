import { get, post } from '/@/utils/http/axios';

enum URL {
    list = '/myapp/index/notice/list_api',
    unreadCount = '/myapp/index/notice/unread_count', // 获取未读消息数
    markAsRead = '/myapp/index/notice/mark_as_read', // 标记消息为已读
}

const listApi = async (params: any) =>
    get<any>({url: URL.list, params: params, data: {}, headers: {}});

// 获取未读消息数
const unreadCountApi = async (params: any) => get<any>({ url: URL.unreadCount , params: params, data: {}, headers: {}});

// 标记消息为已读
const markAsReadApi = async (params: any) => post<any>({ url: URL.markAsRead , params: params, data: {}, headers: {}});

export { listApi, unreadCountApi, markAsReadApi };

