import { defineStore } from 'pinia';
import {loginApi as adminLogin} from '/@/api/admin/user';
import {userLoginApi} from '/@/api/index/user';
import { setToken, clearToken } from '/@/utils/auth';
import { UserState } from './types';
import {USER_ID, USER_NAME, USER_TOKEN, USER_AVATAR, ADMIN_USER_ID,ADMIN_USER_NAME,ADMIN_USER_TOKEN} from "/@/store/constants";

export const useUserStore = defineStore('user', {
  // 修改 state 初始化
  state: (): UserState => ({
    user_id: localStorage.getItem(USER_ID) || undefined, // 也从 localStorage 初始化
    user_name: localStorage.getItem(USER_NAME) || undefined, // 也从 localStorage 初始化
    user_token: localStorage.getItem(USER_TOKEN) || undefined, // 也从 localStorage 初始化
    user_avatar: localStorage.getItem(USER_AVATAR) || undefined, // 从 localStorage 初始化 avatar
    admin_user_id: localStorage.getItem(ADMIN_USER_ID) || undefined, // 同理
    admin_user_name: localStorage.getItem(ADMIN_USER_NAME) || undefined, // 同理
    admin_user_token: localStorage.getItem(ADMIN_USER_TOKEN) || undefined, // 同理
  }),
  getters: {},
  actions: {
    // 用户登录
    async login(loginForm) {
      const result = await userLoginApi(loginForm);
      console.log('login result==>', result)

      if(result.code === 0 && result.data) {
        this.$patch((state)=>{
          state.user_id = result.data.id
          state.user_name = result.data.username
          state.user_token = result.data.token
          state.user_avatar = result.data.avatar
          console.log('state after login patch==>', state)
        })

        localStorage.setItem(USER_TOKEN, result.data.token)
        localStorage.setItem(USER_NAME, result.data.username)
        localStorage.setItem(USER_ID, result.data.id)
        if (result.data.avatar) {
          localStorage.setItem(USER_AVATAR, result.data.avatar)
        } else {
          localStorage.removeItem(USER_AVATAR)
        }
      } else {
         console.error("Login failed or invalid data structure:", result);
      }

      return result;
    },
    // 用户登出
    async logout() {
      this.$patch((state)=>{
        localStorage.removeItem(USER_ID)
        localStorage.removeItem(USER_NAME)
        localStorage.removeItem(USER_TOKEN)
        localStorage.removeItem(USER_AVATAR)

        state.user_id = undefined
        state.user_name = undefined
        state.user_token = undefined
        state.user_avatar = undefined
      })
    },

    // 管理员登录
    async adminLogin(loginForm) {
      const result = await adminLogin(loginForm);
      console.log('result==>', result)

      if(result.code === 0) {
        this.$patch((state)=>{
          state.admin_user_id = result.data.id
          state.admin_user_name = result.data.username
          state.admin_user_token = result.data.admin_token
          console.log('state==>', state)
        })

        localStorage.setItem(ADMIN_USER_TOKEN, result.data.admin_token)
        localStorage.setItem(ADMIN_USER_NAME, result.data.username)
        localStorage.setItem(ADMIN_USER_ID, result.data.id)
      }

      return result;
    },
    // 管理员登出
    async adminLogout() {
      this.$patch((state)=>{
        localStorage.removeItem(ADMIN_USER_ID)
        localStorage.removeItem(ADMIN_USER_NAME)
        localStorage.removeItem(ADMIN_USER_TOKEN)

        state.admin_user_id = undefined
        state.admin_user_name = undefined
        state.admin_user_token = undefined
      })
    },

    // --- 新增：用于更新用户信息的 Action ---
    setUserInfo(userInfo) {
      if (!userInfo) return;
      console.log("Updating user store with:", userInfo);
      this.$patch((state) => {
        if (userInfo.id) state.user_id = userInfo.id;
        if (userInfo.username) state.user_name = userInfo.username;
        if (userInfo.token) state.user_token = userInfo.token;
        if (userInfo.avatar !== undefined) state.user_avatar = userInfo.avatar;

        if (userInfo.id) localStorage.setItem(USER_ID, userInfo.id);
        if (userInfo.username) localStorage.setItem(USER_NAME, userInfo.username);
        if (userInfo.token) localStorage.setItem(USER_TOKEN, userInfo.token);
        if (userInfo.avatar !== undefined) {
           if (userInfo.avatar) {
             localStorage.setItem(USER_AVATAR, userInfo.avatar);
           } else {
             localStorage.removeItem(USER_AVATAR);
           }
        }
      });
      console.log("User store updated:", this.$state);
    }
  },
});
