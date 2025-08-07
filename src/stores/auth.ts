import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type User } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)

  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isLoggedIn = computed(() => !!currentUser.value)

  async function login(name: string) {
    isLoading.value = true
    try {
      // 사용자 조회
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .maybeSingle() // single() 대신 maybeSingle() 사용

      if (!data) {
        // 사용자가 없으면 새로 생성 (기본적으로 user 권한)
        const role = name === '아빠' ? 'admin' : 'user'
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ name, role }])
          .select()
          .single()

        if (createError) {
          console.error('User creation error:', createError)
          throw createError
        }
        currentUser.value = newUser
      } else {
        currentUser.value = data
      }

      // localStorage에 저장
      if (currentUser.value) {
        localStorage.setItem('user', JSON.stringify(currentUser.value))
        return true
      }
      return false
    } catch (error) {
      console.error('Login error details:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    currentUser.value = null
    localStorage.removeItem('user')
  }

  async function checkAuth() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser)
    }
  }

  async function makeAdmin() {
    if (!currentUser.value) return false
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', currentUser.value.id)

      if (error) throw error
      
      currentUser.value.role = 'admin'
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      return true
    } catch (error) {
      console.error('Make admin error:', error)
      return false
    }
  }

  return {
    currentUser,
    isLoading,
    isAdmin,
    isLoggedIn,
    login,
    logout,
    checkAuth,
    makeAdmin
  }
})