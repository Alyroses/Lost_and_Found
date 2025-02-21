import { get } from '/@/utils/http/axios';

enum URL {
    list = '/myapp/index/notice/list_api',
    byid = '/myapp/index/notice/get_by_id'
}

const listApi = async (params: any) =>
    get<any>({url: URL.list, params: params, data: {}, headers: {}});

const noticebyidApi = async (params: any) =>
    get<any>({url: URL.byid, params: params, data: {}, headers: {}});

export { listApi, noticebyidApi };

