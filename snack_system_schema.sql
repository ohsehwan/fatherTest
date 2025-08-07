-- 간식 선택 시스템용 데이터베이스 스키마

-- 1. users 테이블 생성 (사용자 정보)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. snacks 테이블 생성 (간식 목록)
CREATE TABLE IF NOT EXISTS snacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. reviews 테이블 생성 (후기)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snack_id UUID NOT NULL REFERENCES snacks(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, snack_id) -- 한 사용자가 한 간식에 대해 하나의 리뷰만
);

-- 4. daily_selections 테이블 생성 (일일 선택)
CREATE TABLE IF NOT EXISTS daily_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snack_id UUID NOT NULL REFERENCES snacks(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'delivered', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date) -- 한 사용자가 하루에 하나의 선택만
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_snack_id ON reviews(snack_id);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_daily_selections_user_id ON daily_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_selections_date ON daily_selections(date);

-- 6. RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE snacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_selections ENABLE ROW LEVEL SECURITY;

-- 7. Users 테이블 정책
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- 누구나 새 사용자 생성 가능 (로그인 시)
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

-- 관리자만 사용자 정보 수정 가능
CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND role = 'admin'
    )
  );

-- 8. Snacks 테이블 정책
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view snacks" ON snacks
  FOR SELECT USING (true);

-- 관리자만 간식 추가 가능
CREATE POLICY "Only admins can insert snacks" ON snacks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND role = 'admin'
    )
  );

-- 관리자만 간식 수정 가능
CREATE POLICY "Only admins can update snacks" ON snacks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND role = 'admin'
    )
  );

-- 관리자만 간식 삭제 가능
CREATE POLICY "Only admins can delete snacks" ON snacks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND role = 'admin'
    )
  );

-- 9. Reviews 테이블 정책
-- 모든 리뷰 조회 가능
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- 로그인한 사용자만 리뷰 작성 가능
CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::uuid
  );

-- 자신의 리뷰만 수정 가능
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id')::uuid
  );

-- 자신의 리뷰만 삭제 가능
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (
    user_id = current_setting('app.current_user_id')::uuid
  );

-- 10. Daily Selections 테이블 정책
-- 모든 선택 조회 가능
CREATE POLICY "Anyone can view daily selections" ON daily_selections
  FOR SELECT USING (true);

-- 로그인한 사용자만 선택 가능
CREATE POLICY "Users can create their own selections" ON daily_selections
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id')::uuid
  );

-- 관리자만 상태 업데이트 가능
CREATE POLICY "Only admins can update selections" ON daily_selections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND role = 'admin'
    )
  );

-- 11. 초기 데이터 삽입 (선택사항)
-- 관리자 계정 생성
INSERT INTO users (name, role) 
VALUES ('아빠', 'admin') 
ON CONFLICT (name) DO NOTHING;

-- 샘플 간식 데이터
INSERT INTO snacks (name, description, image_url) VALUES
  ('초코파이', '달콤한 초콜릿 과자', 'https://via.placeholder.com/200'),
  ('새우깡', '바삭한 새우 스낵', 'https://via.placeholder.com/200'),
  ('포카칩', '감자칩 스낵', 'https://via.placeholder.com/200'),
  ('하리보 젤리', '과일맛 젤리', 'https://via.placeholder.com/200'),
  ('초코우유', '달콤한 초코 음료', 'https://via.placeholder.com/200'),
  ('바나나우유', '부드러운 바나나 음료', 'https://via.placeholder.com/200')
ON CONFLICT DO NOTHING;