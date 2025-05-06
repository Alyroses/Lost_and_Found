import { defineStore } from 'pinia';
import {loginApi as adminLogin} from '/@/api/admin/user';
import {userLoginApi, userLogoutApi} from '/@/api/index/user';
import { setToken, clearToken } from '/@/utils/auth';
import { UserState } from './types';
import {USER_ID, USER_NAME, USER_TOKEN, USER_AVATAR, ADMIN_USER_ID,ADMIN_USER_NAME,ADMIN_USER_TOKEN, USER_LOGIN_STATUS} from "/@/store/constants";
import { message } from 'ant-design-vue'; // 假设用于提示

export const useUserStore = defineStore('user', {
  // 修改 state 初始化
  state: (): UserState => ({
    user_id: localStorage.getItem(USER_ID) || undefined, // 也从 localStorage 初始化
    user_name: localStorage.getItem(USER_NAME) || undefined, // 也从 localStorage 初始化
    user_token: localStorage.getItem(USER_TOKEN) || undefined, // 也从 localStorage 初始化
    user_avatar: localStorage.getItem(USER_AVATAR) || undefined, // 从 localStorage 初始化 avatar
    user_login_status: localStorage.getItem(USER_LOGIN_STATUS) || undefined,
    admin_user_id: localStorage.getItem(ADMIN_USER_ID) || undefined, // 同理
    admin_user_name: localStorage.getItem(ADMIN_USER_NAME) || undefined, // 同理
    admin_user_token: localStorage.getItem(ADMIN_USER_TOKEN) || undefined // 同理

  }),
  getters: {
    getUserId(): string | number | undefined {
      return this.user_id || localStorage.getItem(USER_ID) || undefined;
    },
    getUserLoginStatus(): boolean {
      return this.user_login_status || localStorage.getItem(USER_LOGIN_STATUS) || undefined;
    },
  },
  actions: {
    // 用户登录
    async login(loginForm) {
      try {
        console.log('Attempting login with form data:', loginForm);
        const res = await userLoginApi(loginForm);
        // --- 日志 1: 打印完整的 API 响应 ---
        console.log('Login API response received:', res);

        if (res.code === 0 && res.data) {
          console.log('Login successful, processing data...'); // <-- 日志 2: 确认进入成功处理块
          const { id, username, token, avatar, login_status } = res.data; // 解构响应数据

          // --- 日志 3: 打印解构出的 login_status ---
          console.log('Extracted login_status from response:', login_status);

          // --- 更新 state (保持不变) ---
          this.$patch((state) => {
            state.user_id = id;
            state.user_name = username;
            state.user_token = token;
            state.user_avatar = avatar;
            state.user_login_status = login_status ;
          });

          // --- 日志 4: 准备存储到 localStorage ---
          const statusToStore = String(login_status === true);
          console.log(`Preparing to set localStorage item: Key='${USER_LOGIN_STATUS}', Value='${statusToStore}'`);

          // --- 更新 localStorage ---
          localStorage.setItem(USER_ID, id);
          localStorage.setItem(USER_NAME, username);
          localStorage.setItem(USER_TOKEN, token);
          if (avatar) localStorage.setItem(USER_AVATAR, avatar); else localStorage.removeItem(USER_AVATAR);
          // --- 执行存储 ---
          localStorage.setItem(USER_LOGIN_STATUS, login_status);
          // --- 日志 5: 确认存储操作已调用 ---
          console.log(`localStorage.setItem for '${USER_LOGIN_STATUS}' called.`);

          console.log('User state and localStorage updated after login.');
          message.success('登录成功');
          return Promise.resolve(res); // 返回成功结果
        } else {
          // --- 日志 6: 登录失败或响应数据不符合预期 ---
          console.warn('Login API call did not return success code or data:', res);
          message.error(res.msg || '登录失败');
          return Promise.reject(res); // 返回失败结果
        }
      } catch (error: any) {
        // --- 日志 7: 捕获到 API 调用或处理过程中的错误 ---
        console.error('Login action failed with error:', error);
        const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || '登录请求失败';
        message.error(errorMsg);
        return Promise.reject(error); // 抛出错误
      }
    },
    // 用户登出
    async logout() {
      const currentUserId = this.getUserId; // 使用 getter 获取当前用户的 ID
      console.log('userStore logout action started.');
      console.log('Current User ID for logout:', currentUserId);

      try {
        if (currentUserId) {
          console.log('Calling userLogoutApi...');
          // *** 确保这里的 await 很重要 ***
          await userLogoutApi({ user_id: currentUserId });
          console.log('Backend logout notified successfully for user:', currentUserId); // <-- 修改日志确认成功
        } else {
          console.warn('User ID not found, skipping backend logout notification.');
        }
      } catch (error) {
        // *** 确认这里会记录详细错误 ***
        console.error('!!! Error calling userLogoutApi:', error);
        // 你可以选择在这里向上抛出错误，或者根据错误类型决定是否继续
        // throw error; // 如果希望阻止 .then() 执行
      } finally {
        console.log('Cleaning up local state and cache.');
        // 清理本地状态... (保持不变)
        this.$patch((state)=>{
          localStorage.removeItem(USER_ID)
          localStorage.removeItem(USER_NAME)
          localStorage.removeItem(USER_TOKEN)
          localStorage.removeItem(USER_AVATAR)
          localStorage.removeItem(USER_LOGIN_STATUS)

          state.user_id = undefined
          state.user_name = undefined
          state.user_token = undefined
          state.user_avatar = undefined
          state.user_login_status = false
        })
      }
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
