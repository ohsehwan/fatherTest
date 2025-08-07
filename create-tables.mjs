#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://soghyilhoxjuvgrrszcy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2h5aWxob3hqdXZncnJzemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzA0MjYsImV4cCI6MjA3MDEwNjQyNn0.N-84Bw7a7IoJKfKMk_6M9-2KwxyxOYxODHb0TFuW4QQ';

console.log('🚀 Supabase 테이블 생성 시도...\n');
console.log('⚠️  주의: 이 스크립트는 anon key로는 테이블을 생성할 수 없습니다.');
console.log('📌 대신 다음 방법을 사용하세요:\n');

console.log('방법 1: Supabase Dashboard에서 직접 SQL 실행');
console.log('  1. https://supabase.com/dashboard/project/soghyilhoxjuvgrrszcy/sql/new 접속');
console.log('  2. supabase_schema_fixed.sql 파일 내용 복사 & 붙여넣기');
console.log('  3. Run 버튼 클릭\n');

console.log('방법 2: Service Role Key 사용 (보안 주의!)');
console.log('  1. Supabase Dashboard > Settings > API');
console.log('  2. Service Role Key 복사 (시작: eyJhbGc...)');
console.log('  3. 이 파일의 supabaseKey를 Service Role Key로 교체');
console.log('  4. node create-tables.mjs 재실행\n');

// 테스트 연결
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 현재 테이블 상태 확인...\n');

// Users 테이블 확인
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*')
  .limit(1);

if (usersError) {
  console.log('❌ users 테이블이 없습니다. 생성이 필요합니다.');
} else {
  console.log('✅ users 테이블이 존재합니다.');
}

// Snacks 테이블 확인
const { data: snacks, error: snacksError } = await supabase
  .from('snacks')
  .select('*')
  .limit(1);

if (snacksError) {
  console.log('❌ snacks 테이블이 없습니다. 생성이 필요합니다.');
} else {
  console.log('✅ snacks 테이블이 존재합니다.');
}

// Daily Selections 테이블 확인
const { data: selections, error: selectionsError } = await supabase
  .from('daily_selections')
  .select('*')
  .limit(1);

if (selectionsError) {
  console.log('❌ daily_selections 테이블이 없습니다. 생성이 필요합니다.');
} else {
  console.log('✅ daily_selections 테이블이 존재합니다.');
}

// Reviews 테이블 확인
const { data: reviews, error: reviewsError } = await supabase
  .from('reviews')
  .select('*')
  .limit(1);

if (reviewsError) {
  console.log('❌ reviews 테이블이 없습니다. 생성이 필요합니다.');
} else {
  console.log('✅ reviews 테이블이 존재합니다.');
}

console.log('\n💡 테이블이 없다면 위의 방법 중 하나를 사용해서 생성해주세요!');