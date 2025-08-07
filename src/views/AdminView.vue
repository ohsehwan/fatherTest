<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>관리자 페이지 - 간식 메뉴 관리</h1>
      <div class="header-actions">
        <span class="user-info">{{ authStore.currentUser?.name }}님</span>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
    </header>

    <div class="admin-content">
      <!-- 간식 추가 폼 -->
      <div class="add-snack-section">
        <h2>새 간식 추가</h2>
        <form @submit.prevent="addSnack" class="snack-form">
          <div class="form-row">
            <div class="form-group">
              <label>간식 이름</label>
              <input v-model="newSnack.name" type="text" required />
            </div>
            <div class="form-group">
              <label>설명</label>
              <input v-model="newSnack.description" type="text" required />
            </div>
            <div class="form-group">
              <label>이미지 URL (선택)</label>
              <input v-model="newSnack.image_url" type="url" />
            </div>
          </div>
          <button type="submit" class="add-btn">간식 추가</button>
        </form>
      </div>

      <!-- 간식 목록 -->
      <div class="snacks-list-section">
        <h2>등록된 간식 목록</h2>
        <div v-if="loading" class="loading">로딩 중...</div>
        <div v-else-if="snacks.length === 0" class="empty">등록된 간식이 없습니다.</div>
        <div v-else class="snacks-grid">
          <div v-for="snack in snacks" :key="snack.id" class="snack-card">
            <img v-if="snack.image_url" :src="snack.image_url" :alt="snack.name" />
            <div v-else class="no-image">이미지 없음</div>
            <div class="snack-info">
              <h3>{{ snack.name }}</h3>
              <p>{{ snack.description }}</p>
              <div class="snack-actions">
                <button 
                  @click="toggleActive(snack)" 
                  :class="['status-btn', snack.is_active ? 'active' : 'inactive']"
                >
                  {{ snack.is_active ? '활성' : '비활성' }}
                </button>
                <button @click="deleteSnack(snack.id)" class="delete-btn">삭제</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 오늘의 선택 현황 -->
      <div class="selections-section">
        <h2>오늘의 선택 현황</h2>
        <div v-if="todaySelections.length === 0" class="empty">오늘 선택된 간식이 없습니다.</div>
        <div v-else class="selections-list">
          <div v-for="selection in todaySelections" :key="selection.id" class="selection-item">
            <span class="user-name">{{ selection.user?.name }}</span>
            <span class="snack-name">{{ selection.snack?.name }}</span>
            <select 
              :value="selection.status" 
              @change="updateSelectionStatus(selection.id, $event)"
              class="status-select"
            >
              <option value="selected">선택됨</option>
              <option value="delivered">전달됨</option>
              <option value="completed">완료</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase, type Snack, type DailySelection } from '@/lib/supabase'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const snacks = ref<Snack[]>([])
const todaySelections = ref<DailySelection[]>([])
const loading = ref(false)

const newSnack = ref({
  name: '',
  description: '',
  image_url: ''
})

async function loadSnacks() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('snacks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    snacks.value = data || []
  } catch (error) {
    console.error('Error loading snacks:', error)
  } finally {
    loading.value = false
  }
}

async function loadTodaySelections() {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const { data, error } = await supabase
      .from('daily_selections')
      .select(`
        *,
        user:users(*),
        snack:snacks(*)
      `)
      .eq('date', today)

    if (error) throw error
    todaySelections.value = data || []
  } catch (error) {
    console.error('Error loading selections:', error)
  }
}

async function addSnack() {
  if (!authStore.currentUser) return

  try {
    const { error } = await supabase
      .from('snacks')
      .insert([{
        name: newSnack.value.name,
        description: newSnack.value.description,
        image_url: newSnack.value.image_url || null,
        created_by: authStore.currentUser.id
      }])

    if (error) throw error

    // 폼 초기화
    newSnack.value = { name: '', description: '', image_url: '' }
    
    // 목록 새로고침
    await loadSnacks()
  } catch (error) {
    console.error('Error adding snack:', error)
    alert('간식 추가에 실패했습니다.')
  }
}

async function toggleActive(snack: Snack) {
  try {
    const { error } = await supabase
      .from('snacks')
      .update({ is_active: !snack.is_active })
      .eq('id', snack.id)

    if (error) throw error
    
    snack.is_active = !snack.is_active
  } catch (error) {
    console.error('Error toggling snack status:', error)
  }
}

async function deleteSnack(id: string) {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    const { error } = await supabase
      .from('snacks')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    await loadSnacks()
  } catch (error) {
    console.error('Error deleting snack:', error)
    alert('간식 삭제에 실패했습니다.')
  }
}

async function updateSelectionStatus(id: string, event: Event) {
  const status = (event.target as HTMLSelectElement).value
  
  try {
    const { error } = await supabase
      .from('daily_selections')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    
    await loadTodaySelections()
  } catch (error) {
    console.error('Error updating selection status:', error)
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.checkAuth()
  loadSnacks()
  loadTodaySelections()
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.admin-header {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  color: #666;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.admin-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.add-snack-section,
.snacks-list-section,
.selections-section {
  background: white;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.snack-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.add-btn {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;
}

.snacks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.snack-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.snack-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.snack-card img,
.no-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
}

.snack-info {
  padding: 15px;
}

.snack-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.snack-info p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.snack-actions {
  display: flex;
  gap: 10px;
}

.status-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.status-btn.active {
  background: #28a745;
  color: white;
}

.status-btn.inactive {
  background: #ffc107;
  color: #333;
}

.delete-btn {
  padding: 5px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.selections-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.user-name {
  font-weight: 600;
  color: #333;
  min-width: 100px;
}

.snack-name {
  flex: 1;
  color: #666;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>