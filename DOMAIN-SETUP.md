# studiojuai.club 도메인 연결 가이드

## 가비아 → Cloudflare Pages 연결

### ❶ Cloudflare Pages 커스텀 도메인 추가

**명령어 방식**:
```bash
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN=aP7uAMDka8EbS5zW6g7YECObqa1QXoZ7HVkiLMme
npx wrangler pages domain add studiojuai.club --project-name studiojuai-portfolio
```

**Dashboard 방식**:
1. https://dash.cloudflare.com 접속
2. Workers & Pages → studiojuai-portfolio 선택
3. Custom domains 탭
4. "Add domain" 클릭
5. `studiojuai.club` 입력
6. DNS 레코드 정보 복사

---

### ❷ 가비아 DNS 설정

#### 방법 A: CNAME 방식 (권장)

**가비아 DNS 관리 페이지에서**:
1. https://dns.gabia.com 접속
2. studiojuai.club 선택
3. 레코드 추가:

```
타입: CNAME
호스트: @
값: studiojuai-portfolio.pages.dev
TTL: 3600
```

또는 www 서브도메인:
```
타입: CNAME
호스트: www
값: studiojuai-portfolio.pages.dev
TTL: 3600
```

#### 방법 B: A 레코드 방식

Cloudflare Pages IP 주소가 제공되면:
```
타입: A
호스트: @
값: [Cloudflare가 제공한 IP 주소]
TTL: 3600
```

---

### ❸ SSL 인증서 자동 발급

Cloudflare가 자동으로 SSL 인증서를 발급합니다:
- 발급 시간: 5분~24시간
- 확인: https://studiojuai.club 접속

---

### ❹ 도메인 전파 확인

```bash
# DNS 전파 확인
dig studiojuai.club

# 또는
nslookup studiojuai.club

# 접속 테스트
curl -I https://studiojuai.club
```

전파 시간: 5분~48시간 (보통 1~2시간)

---

## 현재 접속 URL

### 임시 URL (현재)
- https://695638ba.studiojuai-portfolio.pages.dev
- https://695638ba.studiojuai-portfolio.pages.dev/admin

### 최종 URL (도메인 연결 후)
- https://studiojuai.club
- https://studiojuai.club/admin

---

## 문제 해결

### DNS가 전파되지 않는 경우

1. 가비아 DNS 레코드 재확인
2. TTL 값을 300으로 변경 (빠른 전파)
3. DNS 캐시 초기화:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL 인증서 오류

1. Cloudflare SSL/TLS 설정 확인
2. 암호화 모드: "Full" 또는 "Full (strict)" 선택
3. 24시간 대기 후 재시도

---

## 참고

**가비아 고객센터**: 1544-4755  
**Cloudflare 지원**: https://dash.cloudflare.com  
