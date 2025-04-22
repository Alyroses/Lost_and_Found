import { get, post } from '/@/utils/http/axios';

enum URL {
    list = '/myapp/index/notice/list_api',
    byid = '/myapp/index/notice/get_by_id',
    unreadCount = '/myapp/index/notice/unreadCount', // 获取未读消息数
    markAsRead = '/myapp/index/notice/markAsRead', // 标记消息为已读
}

const listApi = async (params: any) =>
    get<any>({url: URL.list, params: params, data: {}, headers: {}});

const noticebyidApi = async (params: any) =>
    get<any>({url: URL.byid, params: params, data: {}, headers: {}});

// 获取未读消息数
const noticeUnreadCountApi = async (params: any) => get<any>({ url: URL.unreadCount , params: params, data: {}, headers: {}});

// 标记消息为已读
const markNoticeReadApi = async (params: any) => post<any>({ url: URL.markAsRead , params: params, data: {}, headers: {}});

export { listApi, noticebyidApi, noticeUnreadCountApi, markNoticeReadApi };

