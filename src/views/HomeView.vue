<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="title">🍪 간식 선택 시스템 🍰</h1>
      <p class="subtitle">매일 먹고 싶은 간식을 선택하고 후기를 남겨보세요!</p>
      
      <div class="action-buttons">
        <router-link v-if="!authStore.isLoggedIn" to="/login" class="btn btn-primary">
          시작하기
        </router-link>
        
        <template v-else>
          <router-link v-if="authStore.isAdmin" to="/admin" class="btn btn-admin">
            관리자 페이지
          </router-link>
          <router-link v-else to="/user" class="btn btn-user">
            간식 선택하기
          </router-link>
          
          <button @click="logout" class="btn btn-logout">
            로그아웃
          </button>
        </template>
      </div>
      
      <div v-if="authStore.isLoggedIn" class="user-info">
        <p>{{ authStore.currentUser?.name }}님 환영합니다!</p>
        <p class="role">{{ authStore.isAdmin ? '관리자' : '사용자' }} 권한</p>
      </div>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <span class="feature-icon">📋</span>
        <h3>간식 메뉴 관리</h3>
        <p>관리자가 다양한 간식 메뉴를 등록하고 관리할 수 있어요</p>
      </div>
      
      <div class="feature-card">
        <span class="feature-icon">📅</span>
        <h3>날짜별 선택</h3>
        <p>매일 원하는 간식을 선택하고 일주일 계획을 세울 수 있어요</p>
      </div>
      
      <div class="feature-card">
        <span class="feature-icon">⭐</span>
        <h3>후기 작성</h3>
        <p>먹은 간식에 대한 평점과 후기를 남길 수 있어요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.checkAuth()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  color: white;
  margin-bottom: 60px;
}

.title {
  font-size: 48px;
  margin: 0 0 20px;
  animation: fadeInDown 0.8s ease;
}

.subtitle {
  font-size: 20px;
  margin: 0 0 40px;
  opacity: 0.9;
  animation: fadeInUp 0.8s ease;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.btn {
  padding: 12px 30px;
  border-radius: 50px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.btn-admin {
  background: #28a745;
  color: white;
}

.btn-user {
  background: white;
  color: #667eea;
}

.btn-logout {
  background: #dc3545;
  color: white;
}

.user-info {
  background: rgba(255,255,255,0.2);
  padding: 20px;
  border-radius: 10px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

.user-info p {
  margin: 5px 0;
}

.role {
  font-size: 14px;
  opacity: 0.9;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 20px;
}

.feature-card h3 {
  margin: 0 0 15px;
  color: #333;
  font-size: 20px;
}

.feature-card p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>