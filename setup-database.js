import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://soghyilhoxjuvgrrszcy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2h5aWxob3hqdXZncnJzemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzA0MjYsImV4cCI6MjA3MDEwNjQyNn0.N-84Bw7a7IoJKfKMk_6M9-2KwxyxOYxODHb0TFuW4QQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 데이터베이스 설정 시작...\n');

  try {
    // 1. 사용자 생성
    console.log('📋 사용자 생성 중...');
    const users = [
      { name: '아빠', role: 'admin' },
      { name: '아들', role: 'user' },
      { name: '엄마', role: 'user' }
    ];

    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error(`❌ ${user.name} 생성 실패:`, error.message);
      } else {
        console.log(`✅ ${user.name} (${user.role}) 생성/업데이트 완료`);
      }
    }

    // 2. 관리자 ID 가져오기
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('name', '아빠')
      .single();

    if (adminError) {
      console.error('❌ 관리자 조회 실패:', adminError);
      return;
    }

    // 3. 간식 메뉴 생성
    console.log('\n🍪 간식 메뉴 생성 중...');
    const snacks = [
      { name: '초콜릿 쿠키', description: '달콤한 초콜릿이 들어간 바삭한 쿠키', created_by: adminUser.id },
      { name: '과일 젤리', description: '여러 과일 맛이 나는 쫀득한 젤리', created_by: adminUser.id },
      { name: '감자칩', description: '바삭바삭한 감자로 만든 칩', created_by: adminUser.id },
      { name: '초코파이', description: '부드러운 마시멜로가 들어간 초코파이', created_by: adminUser.id },
      { name: '아이스크림', description: '시원하고 달콤한 아이스크림', created_by: adminUser.id },
      { name: '포카칩', description: '양파맛이 나는 바삭한 과자', created_by: adminUser.id }
    ];

    for (const snack of snacks) {
      const { data, error } = await supabase
        .from('snacks')
        .upsert(snack, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error(`❌ ${snack.name} 생성 실패:`, error.message);
      } else {
        console.log(`✅ ${snack.name} 생성/업데이트 완료`);
      }
    }

    console.log('\n🎉 데이터베이스 설정 완료!');
    console.log('👉 http://localhost:5173 에서 앱을 사용할 수 있습니다.');
    console.log('👉 "아빠"로 로그인하면 관리자, 다른 이름으로 로그인하면 사용자입니다.');

  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error);
  }
}

// 데이터 확인 함수
async function checkData() {
  console.log('\n📊 현재 데이터 확인...\n');

  // 사용자 목록
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
  
  if (usersError) {
    console.error('❌ 사용자 조회 실패:', usersError);
  } else {
    console.log('👥 사용자 목록:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role})`);
    });
  }

  // 간식 목록
  const { data: snacks, error: snacksError } = await supabase
    .from('snacks')
    .select('*');
  
  if (snacksError) {
    console.error('❌ 간식 조회 실패:', snacksError);
  } else {
    console.log('\n🍿 간식 목록:');
    snacks.forEach(snack => {
      console.log(`   - ${snack.name}: ${snack.description}`);
    });
  }
}

// 실행
setupDatabase().then(() => checkData());