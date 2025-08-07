#!/usr/bin/env node
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://soghyilhoxjuvgrrszcy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2h5aWxob3hqdXZncnJzemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUzMDQyNiwiZXhwIjoyMDcwMTA2NDI2fQ.KD10WJBS9vXrjWl34Z8KzGnJkX0zImuLcYvnMr4DsTQ';

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }
}

async function createTables() {
  console.log('🚀 Supabase 테이블 생성 시작...\n');

  const sqlScript = `
    -- 기존 테이블 삭제
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS daily_selections CASCADE;
    DROP TABLE IF EXISTS snacks CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- Users 테이블
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Snacks 테이블
    CREATE TABLE snacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL
    );

    -- Daily Selections 테이블
    CREATE TABLE daily_selections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      snack_id UUID REFERENCES snacks(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT CHECK (status IN ('selected', 'delivered', 'completed')) DEFAULT 'selected',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, date)
    );

    -- Reviews 테이블
    CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      selection_id UUID REFERENCES daily_selections(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(selection_id)
    );

    -- 인덱스
    CREATE INDEX idx_snacks_active ON snacks(is_active);
    CREATE INDEX idx_daily_selections_user_date ON daily_selections(user_id, date);
    CREATE INDEX idx_daily_selections_date ON daily_selections(date);
    CREATE INDEX idx_reviews_user ON reviews(user_id);

    -- 샘플 데이터
    INSERT INTO users (name, role) VALUES 
      ('아빠', 'admin'),
      ('아들', 'user'),
      ('엄마', 'user');

    INSERT INTO snacks (name, description, created_by) VALUES 
      ('초콜릿 쿠키', '달콤한 초콜릿이 들어간 바삭한 쿠키', (SELECT id FROM users WHERE name = '아빠')),
      ('과일 젤리', '여러 과일 맛이 나는 쫀득한 젤리', (SELECT id FROM users WHERE name = '아빠')),
      ('감자칩', '바삭바삭한 감자로 만든 칩', (SELECT id FROM users WHERE name = '아빠')),
      ('초코파이', '부드러운 마시멜로가 들어간 초코파이', (SELECT id FROM users WHERE name = '아빠')),
      ('아이스크림', '시원하고 달콤한 아이스크림', (SELECT id FROM users WHERE name = '아빠')),
      ('포카칩', '양파맛이 나는 바삭한 과자', (SELECT id FROM users WHERE name = '아빠'));
  `;

  // Supabase Dashboard SQL Editor URL로 안내
  console.log('📌 Service Key로 직접 테이블을 생성하려면:');
  console.log('1. Supabase Dashboard에서 SQL Editor 열기:');
  console.log('   https://supabase.com/dashboard/project/soghyilhoxjuvgrrszcy/sql/new\n');
  console.log('2. 아래 SQL 전체를 복사해서 붙여넣고 Run 클릭:\n');
  console.log('='.repeat(60));
  console.log(sqlScript);
  console.log('='.repeat(60));
  console.log('\n✅ SQL 실행 후 http://localhost:5173 에서 앱을 사용할 수 있습니다!');
}

createTables();