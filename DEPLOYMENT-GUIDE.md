# studiojuai.club 배포 가이드

## 프로젝트 완료 상태

✅ **로컬 개발 환경**: 완전히 작동 중
✅ **GitHub 저장소**: https://github.com/ikjoobang/studiojuai-portfolio
✅ **샌드박스 URL**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai
✅ **프로젝트 백업**: https://www.genspark.ai/api/files/s/fdgxyvs8

---

## Cloudflare Pages 프로덕션 배포 단계

### ❶ Cloudflare API 토큰 권한 확인

현재 API 토큰에 D1 데이터베이스 생성 권한이 부족합니다.

**해결 방법**:
1. Cloudflare Dashboard 접속: https://dash.cloudflare.com
2. 프로필 → API Tokens
3. 새 토큰 생성 또는 기존 토큰 편집
4. 필요한 권한:
   - Account → D1 → Edit
   - Account → Cloudflare Pages → Edit
   - Account → Workers Scripts → Edit

### ❷ D1 데이터베이스 수동 생성

**방법 1: Cloudflare Dashboard에서 생성**
1. Dashboard → Workers & Pages → D1
2. "Create database" 클릭
3. Database name: `studiojuai-portfolio-db`
4. 생성된 Database ID 복사
5. `wrangler.jsonc` 파일 업데이트:
   ```jsonc
   "database_id": "복사한-database-id"
   ```

**방법 2: 권한이 있는 API 토큰으로 생성**
```bash
export CLOUDFLARE_API_TOKEN=your-correct-token
npx wrangler d1 create studiojuai-portfolio-db
```

### ❸ 프로덕션 데이터베이스 마이그레이션

```bash
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN=your-correct-token
npm run db:migrate:prod
```

### ❹ OpenAI API 키 시크릿 설정

```bash
npx wrangler pages secret put OPENAI_API_KEY
# 입력 프롬프트에서 제공된 OpenAI API 키 입력
```

### ❺ Cloudflare Pages 프로젝트 생성 및 배포

```bash
# 프로젝트 생성 (main 브랜치를 프로덕션으로)
npx wrangler pages project create studiojuai-portfolio \
  --production-branch main \
  --compatibility-date 2025-11-17

# 배포
npm run deploy
```

### ❻ R2 버킷 생성 (선택사항, 비디오 업로드 기능용)

```bash
npm run r2:create
```

R2 버킷 공개 액세스 설정:
1. Dashboard → R2 → studiojuai-videos
2. Settings → Public Access
3. "Allow Access" 활성화
4. 공개 URL: `https://studiojuai-videos.r2.dev`

### ❼ 커스텀 도메인 설정 (studiojuai.club)

```bash
npx wrangler pages domain add studiojuai.club --project-name studiojuai-portfolio
```

또는 Dashboard에서:
1. Workers & Pages → studiojuai-portfolio
2. Custom domains → Add domain
3. `studiojuai.club` 입력
4. DNS 레코드 추가 (Cloudflare에서 자동 안내)

---

## 배포 검증

### 배포 후 테스트할 항목

❶ **메인 페이지 접속**
- URL: https://studiojuai-portfolio.pages.dev
- 또는: https://studiojuai.club

❷ **API 헬스체크**
```bash
curl https://studiojuai-portfolio.pages.dev/api/health
```

❸ **Admin CMS 로그인**
- URL: https://studiojuai-portfolio.pages.dev/admin
- Username: admin
- Password: admin123

❹ **프로젝트 생성 테스트**
- Admin CMS에서 새 프로젝트 생성
- 메인 페이지에서 표시 확인

❺ **챗봇 테스트**
- 하단 우측 챗봇 버튼 클릭
- 메시지 전송 및 응답 확인

---

## 현재 작동 중인 기능

### ✅ 완전 작동

■ **메인 포트폴리오 페이지**
  - glovv.co.kr 스타일 디자인
  - 반응형 레이아웃
  - 비디오 그리드 표시
  - 섹션 스크롤 네비게이션

■ **Admin CMS**
  - 로그인 인증
  - CRUD 작업 (생성/읽기/수정/삭제)
  - 프로젝트 발행/미발행 제어
  - 표시 순서 관리

■ **API 엔드포인트**
  - `/api/health` - 헬스체크
  - `/api/projects` - 공개 프로젝트 목록
  - `/api/projects/:id` - 프로젝트 상세
  - `/api/admin/*` - CMS 관리 API
  - `/api/chat` - GPT 챗봇

■ **GPT-4 mini 챗봇**
  - 하단 우측 플로팅 버튼
  - 실시간 대화
  - studiojuai.club 맞춤 프롬프트

■ **데이터베이스 (D1)**
  - 로컬 환경 완전 작동
  - 마이그레이션 적용 완료
  - 프로젝트 저장/조회 정상

### ⏳ 준비 완료 (프로덕션 설정 필요)

■ **Cloudflare R2 비디오 스토리지**
  - 코드 통합 완료
  - 업로드 API 준비
  - R2 버킷 생성만 필요

■ **프로덕션 배포**
  - 빌드 시스템 완료
  - wrangler 설정 완료
  - API 토큰 권한 이슈만 해결 필요

---

## 개발 환경 정보

### 로컬 샌드박스
- **URL**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai
- **Admin**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai/admin
- **API**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai/api/health

### GitHub 저장소
- **URL**: https://github.com/ikjoobang/studiojuai-portfolio
- **Branch**: main
- **커밋**: 초기 커밋 완료

### 프로젝트 백업
- **다운로드**: https://www.genspark.ai/api/files/s/fdgxyvs8
- **크기**: 82 KB
- **포함 내용**: 전체 소스코드, 설정파일, 마이그레이션

---

## 문제 해결

### D1 데이터베이스 생성 실패

**문제**: API 토큰 권한 부족
```
Authentication error [code: 10000]
```

**해결**:
1. Dashboard에서 수동으로 D1 데이터베이스 생성
2. 또는 올바른 권한의 새 API 토큰 생성

### R2 버킷 접근 오류

**문제**: R2 버킷 공개 액세스 미설정

**해결**:
1. Dashboard → R2 → studiojuai-videos
2. Settings → Public Access 활성화

### 챗봇 응답 없음

**문제**: OpenAI API 키 미설정

**해결**:
```bash
npx wrangler pages secret put OPENAI_API_KEY
```

---

## 다음 단계 권장사항

### 즉시 실행 가능

❶ **샘플 프로젝트 추가**
   - Admin CMS에서 3-5개 샘플 프로젝트 생성
   - 비디오 URL은 임시 YouTube/Vimeo 링크 사용 가능

❷ **디자인 미세 조정**
   - 색상/폰트 최종 확인
   - 모바일 반응형 테스트

❸ **보안 강화**
   - Admin 비밀번호 bcrypt 해싱
   - JWT 토큰 기반 인증 구현

### 단기 (1-2주)

❹ **비디오 업로드 기능**
   - CMS에서 직접 비디오 파일 업로드
   - R2 자동 업로드 및 URL 생성
   - 썸네일 자동 생성

❺ **비디오 최적화**
   - 다중 해상도 트랜스코딩
   - HLS 적응형 스트리밍
   - CDN 캐싱 설정

❻ **SEO 최적화**
   - 메타 태그 추가
   - Open Graph 이미지
   - Sitemap 생성

### 중기 (1개월)

❼ **고급 CMS 기능**
   - 이미지 갤러리
   - 카테고리 관리 UI
   - 일괄 업로드

❽ **분석 통합**
   - Google Analytics
   - 방문자 통계
   - 비디오 재생 분석

❾ **성능 최적화**
   - 이미지 lazy loading
   - 비디오 preload 최적화
   - Cloudflare Cache 설정

---

## 연락처

**이메일**: studio.ikjoo@gmail.com
**GitHub**: https://github.com/ikjoobang/studiojuai-portfolio
**웹사이트**: studiojuai.club (배포 후)

---

**작성일**: 2025-11-17
**버전**: 1.0.0
**상태**: 로컬 개발 완료, 프로덕션 배포 대기
