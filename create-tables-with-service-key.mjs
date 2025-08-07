#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://soghyilhoxjuvgrrszcy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2h5aWxob3hqdXZncnJzemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUzMDQyNiwiZXhwIjoyMDcwMTA2NDI2fQ.KD10WJBS9vXrjWl34Z8KzGnJkX0zImuLcYvnMr4DsTQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('🚀 Supabase 테이블 생성 시작...\n');

  try {
    // SQL 쿼리들
    const queries = [
      // 기존 테이블 삭제
      `DROP TABLE IF EXISTS reviews CASCADE;`,
      `DROP TABLE IF EXISTS daily_selections CASCADE;`,
      `DROP TABLE IF EXISTS snacks CASCADE;`,
      `DROP TABLE IF EXISTS users CASCADE;`,
      
      // Users 테이블
      `CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Snacks 테이블
      `CREATE TABLE snacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
      );`,
      
      // Daily Selections 테이블
      `CREATE TABLE daily_selections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        snack_id UUID REFERENCES snacks(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT CHECK (status IN ('selected', 'delivered', 'completed')) DEFAULT 'selected',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      );`,
      
      // Reviews 테이블
      `CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        selection_id UUID REFERENCES daily_selections(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(selection_id)
      );`,
      
      // 인덱스
      `CREATE INDEX idx_snacks_active ON snacks(is_active);`,
      `CREATE INDEX idx_daily_selections_user_date ON daily_selections(user_id, date);`,
      `CREATE INDEX idx_daily_selections_date ON daily_selections(date);`,
      `CREATE INDEX idx_reviews_user ON reviews(user_id);`
    ];

    // 각 쿼리 실행
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) {
        console.log(`쿼리 실행 실패: ${query.substring(0, 50)}...`);
        console.log(`에러: ${error.message}`);
      }
    }

    console.log('✅ 테이블 구조 생성 완료!\n');

    // 샘플 데이터 삽입
    console.log('📋 샘플 데이터 생성 중...\n');

    // Users 생성
    const users = [
      { name: '아빠', role: 'admin' },
      { name: '아들', role: 'user' },
      { name: '엄마', role: 'user' }
    ];

    for (const user of users) {
      const { error } = await supabase
        .from('users')
        .insert(user);
      
      if (error) {
        console.log(`❌ ${user.name} 생성 실패:`, error.message);
      } else {
        console.log(`✅ ${user.name} (${user.role}) 생성 완료`);
      }
    }

    // 관리자 ID 가져오기
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', '아빠')
      .single();

    if (adminUser) {
      // Snacks 생성
      const snacks = [
        { name: '초콜릿 쿠키', description: '달콤한 초콜릿이 들어간 바삭한 쿠키', created_by: adminUser.id },
        { name: '과일 젤리', description: '여러 과일 맛이 나는 쫀득한 젤리', created_by: adminUser.id },
        { name: '감자칩', description: '바삭바삭한 감자로 만든 칩', created_by: adminUser.id },
        { name: '초코파이', description: '부드러운 마시멜로가 들어간 초코파이', created_by: adminUser.id },
        { name: '아이스크림', description: '시원하고 달콤한 아이스크림', created_by: adminUser.id },
        { name: '포카칩', description: '양파맛이 나는 바삭한 과자', created_by: adminUser.id }
      ];

      for (const snack of snacks) {
        const { error } = await supabase
          .from('snacks')
          .insert(snack);
        
        if (error) {
          console.log(`❌ ${snack.name} 생성 실패:`, error.message);
        } else {
          console.log(`✅ ${snack.name} 생성 완료`);
        }
      }
    }

    console.log('\n🎉 데이터베이스 설정 완료!');
    console.log('👉 http://localhost:5173 에서 앱을 사용할 수 있습니다.');
    console.log('👉 "아빠"로 로그인하면 관리자, "아들"로 로그인하면 사용자입니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
createTables();