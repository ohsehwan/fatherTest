<template>
  <div class="login-container">
    <div class="login-card">
      <h1>간식 선택 시스템</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="name">이름</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="이름을 입력하세요"
            required
          />
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      
      <div v-if="error" class="error">{{ error }}</div>
      
      <div class="admin-hint">
        <p>관리자(아빠)로 로그인하려면 "아빠"를 입력하세요</p>
        <p>사용자(아들)로 로그인하려면 이름을 입력하세요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!name.value.trim()) {
    error.value = '이름을 입력해주세요'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const success = await authStore.login(name.value)
    
    if (success) {
      // 권한에 따라 리다이렉트
      if (authStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/user')
      }
    } else {
      error.value = '로그인에 실패했습니다. 다시 시도해주세요.'
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = '서버 연결에 실패했습니다. Supabase 설정을 확인해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #5a67d8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-top: 15px;
  padding: 10px;
  background: #fee;
  color: #c33;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.admin-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.admin-hint p {
  margin: 5px 0;
  color: #666;
  font-size: 13px;
}
</style>