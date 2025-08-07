<template>
  <div class="user-container">
    <header class="user-header">
      <h1>간식 선택하기</h1>
      <div class="header-actions">
        <span class="user-info">{{ authStore.currentUser?.name }}님</span>
        <router-link to="/reviews" class="reviews-link">내 후기 보기</router-link>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
    </header>

    <div class="user-content">
      <!-- 날짜 선택 -->
      <div class="date-selector">
        <button @click="changeDate(-1)" class="date-nav">◀</button>
        <div class="selected-date">
          <h2>{{ formattedDate }}</h2>
          <p>{{ dayOfWeek }}</p>
        </div>
        <button @click="changeDate(1)" class="date-nav">▶</button>
      </div>

      <!-- 오늘의 선택 상태 -->
      <div v-if="todaySelection" class="selection-status">
        <div class="status-card">
          <h3>오늘 선택한 간식</h3>
          <div class="selected-snack">
            <img v-if="todaySelection.snack?.image_url" 
                 :src="todaySelection.snack.image_url" 
                 :alt="todaySelection.snack.name" />
            <div class="snack-details">
              <h4>{{ todaySelection.snack?.name }}</h4>
              <p>{{ todaySelection.snack?.description }}</p>
              <span :class="['status', todaySelection.status]">
                {{ statusText(todaySelection.status) }}
              </span>
            </div>
          </div>
          <button v-if="todaySelection.status === 'selected'" 
                  @click="cancelSelection" 
                  class="cancel-btn">
            선택 취소
          </button>
        </div>
      </div>

      <!-- 간식 목록 -->
      <div v-else class="snacks-selection">
        <h3>간식을 선택해주세요</h3>
        <div v-if="loading" class="loading">로딩 중...</div>
        <div v-else-if="availableSnacks.length === 0" class="empty">
          선택 가능한 간식이 없습니다.
        </div>
        <div v-else class="snacks-grid">
          <div v-for="snack in availableSnacks" 
               :key="snack.id" 
               class="snack-card"
               @click="selectSnack(snack)">
            <div class="snack-image">
              <img v-if="snack.image_url" :src="snack.image_url" :alt="snack.name" />
              <div v-else class="no-image">🍪</div>
            </div>
            <div class="snack-info">
              <h4>{{ snack.name }}</h4>
              <p>{{ snack.description }}</p>
            </div>
            <button class="select-btn">선택하기</button>
          </div>
        </div>
      </div>

      <!-- 이번 주 선택 내역 -->
      <div class="week-history">
        <h3>이번 주 선택 내역</h3>
        <div class="history-grid">
          <div v-for="day in weekDays" :key="day.date" class="history-item">
            <div class="day-label">{{ day.label }}</div>
            <div v-if="day.selection" class="day-selection">
              <span class="snack-name">{{ day.selection.snack?.name }}</span>
              <span :class="['status-badge', day.selection.status]">
                {{ statusText(day.selection.status) }}
              </span>
            </div>
            <div v-else class="no-selection">-</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase, type Snack, type DailySelection } from '@/lib/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

const router = useRouter()
const authStore = useAuthStore()

const selectedDate = ref(dayjs())
const availableSnacks = ref<Snack[]>([])
const todaySelection = ref<DailySelection | null>(null)
const weekSelections = ref<DailySelection[]>([])
const loading = ref(false)

const formattedDate = computed(() => selectedDate.value.format('YYYY년 MM월 DD일'))
const dayOfWeek = computed(() => selectedDate.value.format('dddd'))

const weekDays = computed(() => {
  const startOfWeek = selectedDate.value.startOf('week')
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const selection = weekSelections.value.find(s => s.date === dateStr)
    
    days.push({
      date: dateStr,
      label: date.format('MM/DD (ddd)'),
      selection
    })
  }
  
  return days
})

function changeDate(days: number) {
  selectedDate.value = selectedDate.value.add(days, 'day')
}

async function loadSnacks() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('snacks')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    availableSnacks.value = data || []
  } catch (error) {
    console.error('Error loading snacks:', error)
  } finally {
    loading.value = false
  }
}

async function loadTodaySelection() {
  if (!authStore.currentUser) return

  try {
    const { data, error } = await supabase
      .from('daily_selections')
      .select(`
        *,
        snack:snacks(*)
      `)
      .eq('user_id', authStore.currentUser.id)
      .eq('date', selectedDate.value.format('YYYY-MM-DD'))
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading selection:', error)
    }
    
    todaySelection.value = data
  } catch (error) {
    console.error('Error loading selection:', error)
  }
}

async function loadWeekSelections() {
  if (!authStore.currentUser) return

  try {
    const startOfWeek = selectedDate.value.startOf('week').format('YYYY-MM-DD')
    const endOfWeek = selectedDate.value.endOf('week').format('YYYY-MM-DD')
    
    const { data, error } = await supabase
      .from('daily_selections')
      .select(`
        *,
        snack:snacks(*)
      `)
      .eq('user_id', authStore.currentUser.id)
      .gte('date', startOfWeek)
      .lte('date', endOfWeek)

    if (error) throw error
    weekSelections.value = data || []
  } catch (error) {
    console.error('Error loading week selections:', error)
  }
}

async function selectSnack(snack: Snack) {
  if (!authStore.currentUser) return

  try {
    const { error } = await supabase
      .from('daily_selections')
      .insert([{
        user_id: authStore.currentUser.id,
        snack_id: snack.id,
        date: selectedDate.value.format('YYYY-MM-DD'),
        status: 'selected'
      }])

    if (error) throw error
    
    await loadTodaySelection()
    await loadWeekSelections()
  } catch (error) {
    console.error('Error selecting snack:', error)
    alert('간식 선택에 실패했습니다. 이미 오늘 간식을 선택하셨나요?')
  }
}

async function cancelSelection() {
  if (!todaySelection.value) return
  
  if (!confirm('정말 선택을 취소하시겠습니까?')) return

  try {
    const { error } = await supabase
      .from('daily_selections')
      .delete()
      .eq('id', todaySelection.value.id)

    if (error) throw error
    
    todaySelection.value = null
    await loadWeekSelections()
  } catch (error) {
    console.error('Error canceling selection:', error)
  }
}

function statusText(status: string) {
  const statusMap: Record<string, string> = {
    'selected': '선택됨',
    'delivered': '전달됨',
    'completed': '완료'
  }
  return statusMap[status] || status
}

function logout() {
  authStore.logout()
  router.push('/login')
}

watch(selectedDate, () => {
  loadTodaySelection()
  loadWeekSelections()
})

onMounted(() => {
  authStore.checkAuth()
  loadSnacks()
  loadTodaySelection()
  loadWeekSelections()
})
</script>

<style scoped>
.user-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-header {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.reviews-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.reviews-link:hover {
  text-decoration: underline;
}

.user-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.date-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.date-nav {
  width: 40px;
  height: 40px;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
}

.date-nav:hover {
  background: #5a67d8;
  transform: scale(1.1);
}

.selected-date {
  text-align: center;
}

.selected-date h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.selected-date p {
  margin: 5px 0 0;
  color: #666;
  font-size: 16px;
}

.selection-status,
.snacks-selection,
.week-history {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.status-card {
  text-align: center;
}

.selected-snack {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.selected-snack img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.snack-details {
  flex: 1;
  text-align: left;
}

.snack-details h4 {
  margin: 0 0 10px;
  color: #333;
  font-size: 20px;
}

.snack-details p {
  margin: 0 0 10px;
  color: #666;
}

.status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status.selected {
  background: #e3f2fd;
  color: #1976d2;
}

.status.delivered {
  background: #fff3e0;
  color: #f57c00;
}

.status.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.cancel-btn {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.snacks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.snack-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.snack-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  border-color: #667eea;
}

.snack-image {
  height: 150px;
  overflow: hidden;
}

.snack-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 60px;
}

.snack-info {
  padding: 15px;
}

.snack-info h4 {
  margin: 0 0 8px;
  color: #333;
  font-size: 18px;
}

.snack-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.select-btn {
  width: calc(100% - 30px);
  margin: 0 15px 15px;
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.week-history h3 {
  margin: 0 0 20px;
  color: #333;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.history-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.day-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.day-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snack-name {
  color: #666;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.selected {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.delivered {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.no-selection {
  color: #999;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>