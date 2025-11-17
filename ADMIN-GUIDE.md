# studiojuai.club Admin 페이지 사용 가이드

## 📍 Admin 페이지 접속

### URL
- **샌드박스**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai/admin
- **프로덕션**: https://695638ba.studiojuai-portfolio.pages.dev/admin
- **도메인 연결 후**: https://studiojuai.club/admin

### 로그인 정보
```
Username: admin
Password: admin123
```

---

## 🎬 비디오 업로드 및 관리 방법

### ❶ Admin 페이지 로그인

1. /admin 접속
2. Username: `admin` 입력
3. Password: `admin123` 입력
4. "Login" 버튼 클릭

### ❷ 새 프로젝트 생성

1. "New Project" 버튼 클릭
2. 모달 창에서 정보 입력:

**필수 항목**:
- **Title** (제목): 프로젝트 이름
- **Video URL** (비디오 URL): 비디오 파일 직접 링크

**선택 항목**:
- **Description** (설명): 프로젝트 설명
- **Thumbnail URL** (썸네일 URL): 썸네일 이미지 링크
- **Category** (카테고리): Commercial, Product, Corporate 등
- **Display Order** (표시 순서): 숫자 (낮을수록 먼저 표시)
- **Published** (발행): 체크하면 메인 페이지에 표시

3. "Save Project" 클릭

---

## 🎥 비디오 URL 준비 방법

### 방법 1: 직접 URL 사용 (권장)

비디오 파일을 다음 서비스에 업로드하고 직접 링크를 사용:

**무료 호스팅 서비스**:
- **Google Drive**: 
  1. 비디오 업로드
  2. 공유 → "링크가 있는 모든 사용자" 선택
  3. 직접 링크 생성 (Drive 파일 ID 활용)
  
- **Dropbox**:
  1. 비디오 업로드
  2. 공유 링크 생성
  3. URL 끝의 `?dl=0`을 `?dl=1`로 변경

- **GitHub**:
  1. 저장소에 비디오 업로드 (최대 100MB)
  2. Raw 링크 복사

- **Cloudflare R2** (프로 방식):
  1. R2 버킷 생성
  2. 비디오 업로드
  3. 공개 URL 사용

**직접 링크 예시**:
```
https://drive.google.com/uc?id=YOUR_FILE_ID
https://www.dropbox.com/s/abc123/video.mp4?dl=1
https://github.com/user/repo/raw/main/video.mp4
```

### 방법 2: 샘플 비디오 사용 (테스트용)

```
Big Buck Bunny:
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

Elephants Dream:
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4

For Bigger Blazes:
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
```

---

## 📝 프로젝트 관리

### 프로젝트 수정

1. Admin 대시보드에서 프로젝트 목록 확인
2. 수정할 프로젝트의 "Edit" 버튼 클릭
3. 정보 수정
4. "Save Project" 클릭

### 프로젝트 삭제

1. Admin 대시보드에서 프로젝트 목록 확인
2. 삭제할 프로젝트의 "Delete" 버튼 클릭
3. 확인 다이얼로그에서 "OK" 클릭

### 발행/미발행 제어

- **Published 체크**: 메인 페이지에 표시됨
- **Published 해제**: 메인 페이지에 표시 안 됨 (Admin에서만 보임)

### 표시 순서 변경

- **Display Order**: 숫자가 낮을수록 먼저 표시
- 예: Order 1 → Order 2 → Order 3

---

## 🖼️ 썸네일 이미지 준비

썸네일도 비디오와 동일하게 이미지 파일의 직접 링크를 사용:

**이미지 호스팅 서비스**:
- **Imgur**: https://imgur.com (무료, 간편)
- **ImgBB**: https://imgbb.com
- **Cloudinary**: https://cloudinary.com
- **Google Drive/Dropbox** (비디오와 동일 방법)

**직접 링크 예시**:
```
https://i.imgur.com/abc123.jpg
https://ibb.co/abc123/image.png
```

**썸네일 크기 권장**:
- 해상도: 1280x720 (16:9 비율)
- 파일 크기: 500KB 이하
- 포맷: JPG, PNG, WebP

---

## 💡 실전 예시

### 예시 1: 브랜드 프로모션 영상

```
Title: 2025 신제품 프로모션 영상
Description: 감각적인 비주얼과 스토리텔링으로 제작된 브랜드 프로모션 영상
Video URL: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
Thumbnail URL: https://peach.blender.org/wp-content/uploads/title_anouncement.jpg
Category: Commercial
Display Order: 1
Published: ✅ 체크
```

### 예시 2: 제품 소개 영상

```
Title: 스마트폰 제품 소개
Description: 혁신적인 기능을 담은 신제품 소개 영상
Video URL: https://your-drive-link.com/video.mp4
Thumbnail URL: https://i.imgur.com/thumbnail.jpg
Category: Product
Display Order: 2
Published: ✅ 체크
```

---

## 🔒 보안

### 비밀번호 변경 (권장)

프로덕션 환경에서는 admin123 비밀번호를 변경하는 것을 권장합니다.

**현재**: 간단한 비밀번호 인증  
**향후 개선**: bcrypt 해싱 + JWT 토큰

---

## ❓ FAQ

### Q: 비디오가 재생되지 않아요
A: 비디오 URL이 직접 링크(.mp4, .webm 등)인지 확인하세요. YouTube/Vimeo 링크는 작동하지 않습니다.

### Q: 썸네일이 표시되지 않아요
A: 썸네일 URL이 이미지 직접 링크(.jpg, .png 등)인지 확인하세요.

### Q: 프로젝트를 만들었는데 메인 페이지에 안 보여요
A: "Published" 체크박스가 체크되어 있는지 확인하세요.

### Q: 프로젝트 순서를 바꾸고 싶어요
A: "Display Order" 숫자를 변경하세요. 낮은 숫자가 먼저 표시됩니다.

### Q: 여러 개를 한번에 업로드할 수 있나요?
A: 현재는 하나씩 생성해야 합니다. "New Project"를 반복해서 클릭하세요.

---

## 📞 문의

**이메일**: studio.ikjoo@gmail.com

---

**작성일**: 2025-11-17
