# 간식 선택 시스템 - 데이터베이스 설정 가이드

## 🚀 빠른 설정 (3분 소요)

### 1단계: Supabase SQL Editor 접속
👉 **[클릭해서 SQL Editor 열기](https://supabase.com/dashboard/project/soghyilhoxjuvgrrszcy/sql/new)**

### 2단계: SQL 실행
아래 SQL 전체를 복사해서 SQL Editor에 붙여넣고 **Run** 버튼을 클릭하세요:

```sql
-- 기존 테이블 삭제 (재실행 시)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS daily_selections CASCADE;
DROP TABLE IF EXISTS snacks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 간식 테이블
CREATE TABLE snacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 일일 선택 테이블
CREATE TABLE daily_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snack_id UUID REFERENCES snacks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('selected', 'delivered', 'completed')) DEFAULT 'selected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 리뷰 테이블
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    selection_id UUID REFERENCES daily_selections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(selection_id)
);

-- 인덱스 생성
CREATE INDEX idx_snacks_active ON snacks(is_active);
CREATE INDEX idx_daily_selections_user_date ON daily_selections(user_id, date);
CREATE INDEX idx_daily_selections_date ON daily_selections(date);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- 샘플 데이터 삽입
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
```

### 3단계: 앱 실행
터미널에서:
```bash
npm run dev
```

### 4단계: 앱 사용
👉 **[http://localhost:5173](http://localhost:5173)** 접속

- **관리자 로그인**: "아빠" 입력
- **사용자 로그인**: "아들" 또는 다른 이름 입력

## 📱 주요 기능

### 관리자 (아빠)
- 간식 메뉴 등록/수정/삭제
- 오늘의 선택 현황 확인
- 선택 상태 변경 (선택됨 → 전달됨 → 완료)

### 사용자 (아들)
- 날짜별 간식 선택
- 주간 계획 확인
- 선택 취소 (당일만 가능)

### 후기 시스템
- 완료된 간식에 대한 평점 (1-5점)
- 텍스트 후기 작성
- 작성한 후기 관리

## 🔧 문제 해결

### 데이터베이스 연결 실패
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. SQL이 성공적으로 실행되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 로그인 실패
1. 데이터베이스에 users 테이블이 생성되었는지 확인
2. 샘플 데이터가 삽입되었는지 확인
3. setup-database.js 실행으로 데이터 확인:
```bash
node setup-database.js
```

## 📞 지원
문제가 있으면 콘솔 로그를 확인하세요!