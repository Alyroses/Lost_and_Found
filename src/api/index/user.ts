import { get, post } from '/@/utils/http/axios';
// import axios from 'axios';
enum URL {
    userLogin = '/myapp/index/user/login',
    userRegister = '/myapp/index/user/register',
    detail = '/myapp/index/user/info',
    updateUserPwd = '/myapp/index/user/updatePwd',
    updateUserInfo = '/myapp/index/user/update',
    captchaurl = '/myapp/index/user/generateCaptcha',
    sendEmailCode = '/myapp/index/user/sendEmailCode', // 添加获取邮箱验证码的 URL
    qqLogin = '/myapp/index/user/qqLogin' // 添加 QQ 登录的 URL
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
const updateUserPwdApi = async (params: any, data:any) => post<any>({ url: URL.updateUserPwd, params: params, data:data });
const updateUserInfoApi = async (params: any,data: any) => post<any>({ url: URL.updateUserInfo, params:params, data: data, headers: { 'Content-Type': 'multipart/form-data;charset=utf-8' } });

export { detailApi, updateUserInfoApi, updateUserPwdApi, userLoginApi, userRegisterApi, sendEmailCodeApi, qqLoginApi }; // 导出 QQ 登录的 API

