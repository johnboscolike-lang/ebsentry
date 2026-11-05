# 김포과기고 EBS 자기주도학습실 입반 신청

학생 휴대폰에서 작성하는 입반 신청 사이트입니다. React 화면과 Express API가 **한 포트(기본 3100)** 에서 함께 동작하고, 신청은 SQLite 파일에 저장됩니다. 선생님은 비밀번호로 명단, 학년·학과 수, 주간 시간 분포, 시간대 히트맵을 보고 CSV로 내려받을 수 있습니다.

## 로컬에서 실행

Node.js **22.13 이상**이 필요합니다. 데이터베이스는 Node 내장 `node:sqlite`를 쓰므로 별도 SQLite 설치나 컴파일러가 없어도 됩니다.

```bash
cp .env.example .env
# .env 의 ADMIN_PASSWORD 를 8자 이상으로 바꿉니다.
npm install
npm run dev
```

- 신청 화면: http://127.0.0.1:5173
- API는 3100에서 뜨고, 개발 서버가 `/api`를 그쪽으로 넘깁니다.
- 관리자: http://127.0.0.1:5173/admin

프로덕션과 같이 한 포트로 확인하려면:

```bash
npm run build
npm start
```

브라우저에서 http://127.0.0.1:3100 을 엽니다. `HOST=127.0.0.1`이면 이 서버 안에서만 접속됩니다.

검사:

```bash
npm test
```

`npm test`는 프론트를 빌드한 뒤 API, 검증, CSV, 관리자 로그인, 빌드된 화면 제공을 확인합니다.

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `PORT` | 수신 포트. 기본 `3100` |
| `HOST` | 기본 바인딩은 `0.0.0.0`. nginx 뒤에서는 `127.0.0.1` |
| `ADMIN_PASSWORD` | 관리자 비밀번호. **8자 이상**. 짧으면 로그인이 꺼집니다 |
| `DATA_DIR` | SQLite 디렉터리. 기본 `./data` |
| `COOKIE_SECURE` | `1`이면 관리자 쿠키에 Secure. HTTPS에서 사용 |
| `APPLY_RATE_LIMIT` | IP당 1시간 신청 수. 기본 `120` |

앱은 저장소 루트의 `.env`를 직접 읽습니다. 이미 설정된 환경 변수는 덮어쓰지 않습니다.

## 신청서 구성

1. 이름, 학년(`27 신입생` / `고1` / `고2`). 신입생은 학과(기계·전기·화공·전자)만 고릅니다. 고1·고2는 1–8반을 고르면 학과가 붙습니다. 1·2반 기계과, 3·4반 전기과, 5·6반 화공과, 7·8반 전자과.
2. 참여 요일, 귀가 가능 시간, 하루 공부 시간(1–4시간), 한 주 희망 시간. 월·수·금 15:50–20:50, 화·목 16:50–20:50을 30분 블록으로 누르거나 드래그합니다. 고른 시간과 희망 시간을 나란히 보여 줍니다.
3. 등교 수단(도보·버스·지하철, 복수 선택)과 편도 분.
4. 학원 여부. 다니면 과목과 학원 이름.
5. 진학 또는 취업. 취업이면 학과별 기능사와 공통 자격증, 기타 입력.
6. EBS센터 프로그램 참여 의향 5단계.
7. 입반 동기, 보완 과목, 현재 자습 시간, 어려운 점, 목표, 코치님께 바라는 점, 휴대폰 습관.
8. 요약 카드에서 확인하고 제출하면 접수번호가 나옵니다.

작성 중인 내용은 그 브라우저 탭에만 임시 저장되고, 제출하면 지워집니다.

## VPS에 배포

예시 경로는 `/opt/ebs-apply`입니다. nginx가 80/443을 받고 앱은 127.0.0.1:3100만 엽니다.

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin ebs || true
sudo mkdir -p /opt/ebs-apply /var/lib/ebs-apply
sudo chown -R ebs:ebs /var/lib/ebs-apply
# 저장소를 /opt/ebs-apply 에 받습니다.
sudo cp deploy/ebs-apply.env.example /etc/ebs-apply.env
sudoedit /etc/ebs-apply.env   # 비밀번호를 바꿉니다
sudo cp deploy/ebs-apply.service /etc/systemd/system/ebs-apply.service
sudo systemctl daemon-reload
sudo systemctl enable --now ebs-apply
```

코드를 갱신할 때는 저장소에서:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

스크립트는 `npm ci`, `npm run build` 후 `ebs-apply` 유닛이 있으면 systemd를, 없으면 pm2가 있으면 `deploy/ecosystem.config.cjs`를 다시 읽습니다. pm2를 쓸 때는 비밀번호와 `DATA_DIR`을 `.env` 또는 셸 환경에 두세요. 앱이 `.env`를 읽습니다.

nginx 예시는 `deploy/nginx.conf.example`입니다.

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/ebs-apply
sudoedit /etc/nginx/sites-available/ebs-apply   # server_name 변경
sudo ln -s /etc/nginx/sites-available/ebs-apply /etc/nginx/sites-enabled/ebs-apply
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS를 붙인 뒤 `/etc/ebs-apply.env`의 `COOKIE_SECURE=1`로 바꾸고 서비스를 재시작하세요.

## 백업

신청은 `DATA_DIR/applications.db` 한 파일입니다. 서비스를 잠시 멈추고 파일을 복사하거나, 켜 둔 채 `sqlite3 applications.db ".backup backup.db"`로 백업하면 됩니다. Node만 있다면 파일을 그대로 복사해도 됩니다. WAL 파일을 함께 복사하려면 서비스를 멈추는 편이 안전합니다.

## 구성

- `client`: Vite + React + TypeScript. 남색 바탕과 골드 포인트의 모바일 화면.
- `server`: Express. 빌드된 `client/dist`를 `/`에서 제공하고 `/api`로 신청을 받습니다.
- `shared`: 시간표, 학과 매핑, 검증 규칙. 화면과 서버가 같은 규칙을 씁니다.
- 관리자 API는 HMAC 서명 쿠키(12시간)로 보호됩니다. 비밀번호는 환경 변수와 상수 시간으로 비교합니다.
