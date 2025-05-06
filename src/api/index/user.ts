import { get, post } from '/@/utils/http/axios';
// import axios from 'axios';
enum URL {
    userLogin = '/myapp/index/user/login',
    userRegister = '/myapp/index/user/register',
    detail = '/myapp/index/user/info',
    updateUserPwd = '/myapp/index/user/updatePwd',
    updateUserInfo = '/myapp/index/user/update',
    captchaurl = '/myapp/index/user/generateCaptcha',
    userRanking = '/myapp/index/user/ranking',  // 获取用户积分排名
    sendEmailCode = '/myapp/index/user/sendEmailCode', // 添加获取邮箱验证码的 URL
    qqLogin = '/myapp/index/user/qq/authorization', // 添加 QQ 登录的 URL
    oauthCallback = '/myapp/index/user/oauth_callback', // 添加 OAuth 回调的 URL
    userLogout = '/myapp/index/user/logout' // 新增登出接口 URL
}
interface LoginRes {
    token: string;
}

export interface LoginData {
    username: string;
    password: string;
    captcha: string;
}

const detailApi = async (params: any) => get<any>({ url: URL.detail, params: params, data: {}, headers: {} });
const userLoginApi = async (data: LoginData) => post<any>({ url: URL.userLogin, data, headers: { 'Content-Type': 'multipart/form-data'} ,withCredentials: true});
const userRegisterApi = async (data: any) => post<any>({ url: URL.userRegister, params: {}, data: data });
const sendEmailCodeApi = async (data: any) => post<any>({ url: URL.sendEmailCode, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } }); // 添加获取邮箱验证码的 API
const qqLoginApi = async (params: any) => get<any>({ url: URL.qqLogin, params: params, withCredentials: true }); // 添加 QQ 登录的 API
const oauthCallbackApi = async (params: any) => get<any>({ url: URL.oauthCallback, params: params, withCredentials: true }); // 添加 OAuth 回调的 API
const updateUserPwdApi = async (params: any, data:any) => post<any>({ url: URL.updateUserPwd, params: params, data:data });
const updateUserInfoApi = async (params: any,data: any) => post<any>({ url: URL.updateUserInfo, params:params, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } }); // Token 认证通常由 /@/utils/http/axios 中的请求拦截器自动处理。拦截器会从 userStore 或 localStorage 获取 Token 并添加到请求头 (例如 'Authorization': 'Bearer ' + token)。因此，这里通常不需要显式添加 Token。
const getUserRankingApi = async (params?: any) => get<any>({ url: URL.userRanking,params:params }); // 移除 data 参数，headers 通常不需要为 GET multipart
const userLogoutApi = async (data: { user_id: string | number | undefined }) => { // 确保参数类型允许 undefined
  console.log('userLogoutApi function called with data:', data);
  // 使用 URL.userLogout，并将 data 作为 POST 请求的请求体
  return post<any>({ url: URL.userLogout, data });
}

// 从导出中移除 getUserAvatarApi
export { detailApi, updateUserInfoApi, updateUserPwdApi, userLoginApi, userRegisterApi, sendEmailCodeApi, qqLoginApi, oauthCallbackApi ,getUserRankingApi, userLogoutApi };

