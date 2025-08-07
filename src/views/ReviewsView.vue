<template>
  <div class="reviews-container">
    <header class="reviews-header">
      <h1>간식 후기</h1>
      <div class="header-actions">
        <router-link to="/user" class="back-link">← 간식 선택으로</router-link>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
    </header>

    <div class="reviews-content">
      <!-- 작성 가능한 후기 -->
      <div class="pending-reviews">
        <h2>후기 작성하기</h2>
        <div v-if="pendingReviews.length === 0" class="empty">
          아직 후기를 작성할 간식이 없습니다.
        </div>
        <div v-else class="review-cards">
          <div v-for="selection in pendingReviews" 
               :key="selection.id" 
               class="review-card">
            <div class="review-header">
              <img v-if="selection.snack?.image_url" 
                   :src="selection.snack.image_url" 
                   :alt="selection.snack.name" />
              <div v-else class="no-image">🍪</div>
              <div class="snack-info">
                <h3>{{ selection.snack?.name }}</h3>
                <p>{{ formatDate(selection.date) }}</p>
              </div>
            </div>
            
            <form @submit.prevent="submitReview(selection)" class="review-form">
              <div class="rating-section">
                <label>평점</label>
                <div class="rating-stars">
                  <span v-for="star in 5" 
                        :key="star"
                        @click="setRating(selection.id, star)"
                        :class="['star', { filled: (ratings[selection.id] || 0) >= star }]">
                    ★
                  </span>
                </div>
              </div>
              
              <div class="comment-section">
                <label>후기</label>
                <textarea 
                  v-model="comments[selection.id]"
                  placeholder="간식은 어땠나요?"
                  rows="3"
                ></textarea>
              </div>
              
              <button type="submit" 
                      :disabled="!ratings[selection.id]"
                      class="submit-btn">
                후기 작성
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- 작성한 후기 목록 -->
      <div class="completed-reviews">
        <h2>내가 쓴 후기</h2>
        <div v-if="completedReviews.length === 0" class="empty">
          아직 작성한 후기가 없습니다.
        </div>
        <div v-else class="completed-list">
          <div v-for="review in completedReviews" 
               :key="review.id" 
               class="completed-item">
            <div class="review-content">
              <div class="review-meta">
                <h4>{{ review.selection?.snack?.name }}</h4>
                <span class="review-date">{{ formatDate(review.selection?.date) }}</span>
              </div>
              <div class="review-rating">
                <span v-for="star in 5" 
                      :key="star"
                      :class="['star', { filled: review.rating >= star }]">
                  ★
                </span>
              </div>
              <p class="review-comment">{{ review.comment }}</p>
            </div>
            <button @click="deleteReview(review.id)" class="delete-btn">삭제</button>
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
import { supabase, type DailySelection, type Review } from '@/lib/supabase'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const pendingReviews = ref<DailySelection[]>([])
const completedReviews = ref<Review[]>([])
const ratings = ref<Record<string, number>>({})
const comments = ref<Record<string, string>>({})

async function loadPendingReviews() {
  if (!authStore.currentUser) return

  try {
    // 완료된 선택 중 리뷰가 없는 것들 조회
    const { data: selections, error: selectionsError } = await supabase
      .from('daily_selections')
      .select(`
        *,
        snack:snacks(*)
      `)
      .eq('user_id', authStore.currentUser.id)
      .eq('status', 'completed')
      .order('date', { ascending: false })

    if (selectionsError) throw selectionsError

    // 이미 리뷰가 있는 selection_id 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('selection_id')
      .eq('user_id', authStore.currentUser.id)

    if (reviewsError) throw reviewsError

    const reviewedSelectionIds = reviews?.map(r => r.selection_id) || []
    
    // 리뷰가 없는 선택들만 필터링
    pendingReviews.value = selections?.filter(
      s => !reviewedSelectionIds.includes(s.id)
    ) || []
  } catch (error) {
    console.error('Error loading pending reviews:', error)
  }
}

async function loadCompletedReviews() {
  if (!authStore.currentUser) return

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        selection:daily_selections(
          *,
          snack:snacks(*)
        )
      `)
      .eq('user_id', authStore.currentUser.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    completedReviews.value = data || []
  } catch (error) {
    console.error('Error loading completed reviews:', error)
  }
}

function setRating(selectionId: string, rating: number) {
  ratings.value[selectionId] = rating
}

async function submitReview(selection: DailySelection) {
  if (!authStore.currentUser) return
  
  const rating = ratings.value[selection.id]
  const comment = comments.value[selection.id] || ''
  
  if (!rating) {
    alert('평점을 선택해주세요.')
    return
  }

  try {
    const { error } = await supabase
      .from('reviews')
      .insert([{
        selection_id: selection.id,
        user_id: authStore.currentUser.id,
        rating,
        comment
      }])

    if (error) throw error
    
    // 폼 초기화
    delete ratings.value[selection.id]
    delete comments.value[selection.id]
    
    // 목록 새로고침
    await loadPendingReviews()
    await loadCompletedReviews()
    
    alert('후기가 작성되었습니다!')
  } catch (error) {
    console.error('Error submitting review:', error)
    alert('후기 작성에 실패했습니다.')
  }
}

async function deleteReview(id: string) {
  if (!confirm('정말 이 후기를 삭제하시겠습니까?')) return

  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    await loadPendingReviews()
    await loadCompletedReviews()
  } catch (error) {
    console.error('Error deleting review:', error)
    alert('후기 삭제에 실패했습니다.')
  }
}

function formatDate(date?: string) {
  if (!date) return ''
  return dayjs(date).format('YYYY년 MM월 DD일')
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.checkAuth()
  loadPendingReviews()
  loadCompletedReviews()
})
</script>

<style scoped>
.reviews-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.reviews-header {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reviews-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.reviews-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.pending-reviews,
.completed-reviews {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

h2 {
  margin: 0 0 20px;
  color: #333;
  font-size: 20px;
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.review-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.review-header img,
.no-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 30px;
}

.snack-info h3 {
  margin: 0 0 5px;
  color: #333;
  font-size: 16px;
}

.snack-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.rating-section label,
.comment-section label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.rating-stars {
  display: flex;
  gap: 5px;
}

.star {
  font-size: 30px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star.filled {
  color: #ffc107;
}

.star:hover {
  color: #ffc107;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
}

.submit-btn {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.completed-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.review-content {
  flex: 1;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.review-meta h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.review-date {
  color: #666;
  font-size: 14px;
}

.review-rating {
  margin-bottom: 10px;
}

.review-comment {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.delete-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}
</style>