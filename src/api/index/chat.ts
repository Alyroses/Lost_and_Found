import { get, post } from '/@/utils/http/axios';

// 定义聊天相关 API 的 URL
enum URL {
  getHistory = '/myapp/index/chat/getHistory', // 假设获取历史记录的后端 URL，请根据实际情况修改
  // 可以添加其他聊天相关的 API URL，例如标记已读等
}

/**
 * 获取聊天历史记录
 * @param params - 参数对象
 * @param params.recipientId - 对方用户的 ID
 * @param params.thingId - 相关物品的 ID (可选, 取决于后端如何组织聊天)
 * @param params.thingType - 相关物品的类型 (可选)
 * @param params.page - 页码 (可选, 用于分页)
 * @param params.pageSize - 每页数量 (可选, 用于分页)
 */
const getHistoryApi = async (params: any) => get<any>({ url: URL.getHistory, params: params, data: {}, headers: {} });

export { getHistoryApi };
