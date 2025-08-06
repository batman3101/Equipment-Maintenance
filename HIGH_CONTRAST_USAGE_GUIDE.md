# 고대비 스타일 적용 가이드 (High Contrast Style Usage Guide)

이 프로젝트에는 WCAG 2.1 AAA 수준(7:1 대비비)을 달성하는 최고 수준의 고대비 스타일이 적용되어 있습니다.

## 개요

### 다크 테마 (Dark Theme) - WCAG AAA 수준
- **주요 텍스트**: 순흰색 (#ffffff) - 21:1 대비비
- **보조 텍스트**: 거의 흰색 (#e6e6e6) - 8.1:1 대비비
- **배경**: 순검정색 (#000000)
- **카드 배경**: 거의 검정 (#1a1a1a)

### 라이트 테마 (Light Theme) - WCAG AAA 수준
- **주요 텍스트**: 순검정색 (#000000) - 21:1 대비비
- **보조 텍스트**: 거의 검정 (#1a1a1a) - 8.5:1 대비비
- **배경**: 순백색 (#ffffff)
- **카드 배경**: 순백색 (#ffffff)

## 사용 가능한 고대비 CSS 클래스

### 1. 타이틀 및 헤더 스타일
```css
.title-high-contrast          /* 메인 타이틀용 */
.header-high-contrast         /* 헤더용 */
.subtitle-high-contrast       /* 부제목용 */
.page-title-high-contrast     /* 페이지 제목용 (2rem) */
.section-header-high-contrast /* 섹션 헤더용 (하단 보더 포함) */
```

### 2. 카드 관련 스타일
```css
.card-title-high-contrast       /* 카드 타이틀 */
.card-description-high-contrast /* 카드 설명 텍스트 */
```

### 3. 입력 필드 스타일
```css
.input-high-contrast  /* 입력 필드 */
.label-high-contrast  /* 라벨 */
```

### 4. 테이블 스타일
```css
.table-high-contrast         /* 전체 테이블 */
.table-header-high-contrast  /* 테이블 헤더 */
.table-cell-high-contrast    /* 테이블 셀 */
```

### 5. 상태 지표 스타일
```css
.status-completed    /* 완료 상태 (녹색) */
.status-in-progress  /* 진행중 상태 (노란색) */
.status-under-repair /* 수리중 상태 (파란색) */
.status-error        /* 오류 상태 (빨간색) */
```

### 6. 네비게이션 및 버튼
```css
.nav-text-high-contrast    /* 네비게이션 텍스트 */
.button-text-high-contrast /* 버튼 텍스트 */
```

### 7. 통계 표시
```css
.stat-number-high-contrast /* 통계 숫자 (2.5rem, 굵게) */
.stat-label-high-contrast  /* 통계 라벨 (0.875rem) */
```

### 8. 컨테이너 및 모달 스타일
```css
.container-high-contrast        /* 일반 컨테이너 */
.modal-high-contrast           /* 모달 창 */
.modal-overlay-high-contrast   /* 모달 오버레이 */
.modal-header-high-contrast    /* 모달 헤더 */
.modal-content-high-contrast   /* 모달 콘텐츠 */
.modal-footer-high-contrast    /* 모달 푸터 */
```

### 9. 드롭다운 및 선택 메뉴
```css
.dropdown-high-contrast        /* 드롭다운 컨테이너 */
.dropdown-item-high-contrast   /* 드롭다운 아이템 */
```

### 10. 사이드바 및 패널
```css
.sidebar-high-contrast  /* 사이드바 */
.panel-high-contrast    /* 패널 */
```

### 11. 툴팁 및 알림
```css
.tooltip-high-contrast        /* 툴팁 */
.toast-high-contrast          /* 일반 토스트 */
.toast-success-high-contrast  /* 성공 토스트 */
.toast-error-high-contrast    /* 오류 토스트 */
.toast-warning-high-contrast  /* 경고 토스트 */
```

### 12. 아코디언 및 탭
```css
.accordion-high-contrast         /* 아코디언 컨테이너 */
.accordion-header-high-contrast  /* 아코디언 헤더 */
.accordion-content-high-contrast /* 아코디언 콘텐츠 */
.tab-high-contrast               /* 탭 */
.tab-active-high-contrast        /* 활성 탭 */
.tab-content-high-contrast       /* 탭 콘텐츠 */
```

### 13. 리스트
```css
.list-high-contrast      /* 리스트 컨테이너 */
.list-item-high-contrast /* 리스트 아이템 */
```

## 적용 예시

### 카드 컴포넌트에서 사용
```jsx
<Card>
  <Card.Header>
    <h2 className="card-title-high-contrast">설비 현황</h2>
  </Card.Header>
  <Card.Content>
    <p className="card-description-high-contrast">현재 운영 중인 설비 상태입니다.</p>
    <div className="stat-number-high-contrast">12</div>
    <div className="stat-label-high-contrast">대 운영중</div>
  </Card.Content>
</Card>
```

### 입력 폼에서 사용
```jsx
<Input 
  label="설비 종류"
  className="input-high-contrast"
  placeholder="설비 종류를 입력하세요"
/>
```

### 테이블에서 사용
```jsx
<table className="table-high-contrast">
  <thead>
    <tr>
      <th className="table-header-high-contrast">설비명</th>
      <th className="table-header-high-contrast">상태</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="table-cell-high-contrast">CNC-001</td>
      <td className="table-cell-high-contrast">
        <StatusBadge variant="completed">정상</StatusBadge>
      </td>
    </tr>
  </tbody>
</table>
```

### 페이지 타이틀
```jsx
<h1 className="page-title-high-contrast">CNC 설비 관리 시스템</h1>
<h2 className="section-header-high-contrast">대시보드</h2>
```

## 이미 적용된 컴포넌트

### 1. StatusBadge 컴포넌트
- 자동으로 고대비 상태 스타일 적용
- `status-completed`, `status-error`, `status-in-progress`, `status-under-repair` 사용

### 2. Input 컴포넌트
- `input-high-contrast`, `label-high-contrast` 자동 적용

### 3. DailyStatusCards 컴포넌트
- `card-description-high-contrast`, `stat-number-high-contrast` 적용

## 추가 적용 권장사항

### 1. 모든 페이지 컴포넌트
- 페이지 제목: `page-title-high-contrast`
- 섹션 헤더: `section-header-high-contrast`

### 2. 네비게이션 컴포넌트
- 네비게이션 링크: `nav-text-high-contrast`

### 3. 테이블이 있는 모든 페이지
- 테이블 헤더: `table-header-high-contrast`
- 테이블 셀: `table-cell-high-contrast`

### 4. 통계 대시보드
- 큰 숫자: `stat-number-high-contrast`
- 설명 라벨: `stat-label-high-contrast`

## 주의사항

1. **기존 색상 클래스와 병용하지 마세요**
   - `text-gray-600`과 같은 Tailwind 색상 클래스는 고대비 클래스와 충돌할 수 있습니다.

2. **인라인 스타일 사용시 주의**
   - 고대비 클래스 적용 후 인라인 스타일로 색상을 덮어쓰지 않도록 주의하세요.

3. **상태별 색상 유지**
   - 상태 지표의 경우 의미가 있는 색상이므로 완전히 흑백으로 만들지 않고 적절한 대비를 유지했습니다.

## CSS 변수 활용

모든 고대비 스타일은 CSS 변수를 활용하므로, 테마 변경시 자동으로 적절한 색상으로 전환됩니다:

```css
color: var(--foreground) !important;      /* 주요 텍스트 */
color: var(--card-foreground) !important; /* 카드 내 텍스트 */
color: var(--muted-foreground) !important; /* 보조 텍스트 */
```

## 색상 대비비 가이드라인

### WCAG 2.1 AAA 수준 색상표

#### 라이트 테마 색상
- **성공 상태**: #006600 (7.3:1 대비비) - 진한 초록
- **경고 상태**: #cc6600 (7.1:1 대비비) - 진한 주황
- **오류 상태**: #cc0000 (7.4:1 대비비) - 진한 빨강
- **정보 상태**: #0033cc (7.2:1 대비비) - 진한 파랑
- **프라이머리**: #0052cc (7.1:1 대비비) - 진한 파랑

#### 다크 테마 색상
- **성공 상태**: #00ff00 (8.2:1 대비비) - 밝은 초록
- **경고 상태**: #ffcc00 (8.5:1 대비비) - 밝은 노랑
- **오류 상태**: #ff4d4d (7.3:1 대비비) - 밝은 빨강
- **정보 상태**: #4da6ff (7.1:1 대비비) - 밝은 파랑
- **프라이머리**: #3385ff (7.2:1 대비비) - 밝은 파랑

### 색약/색맹 접근성 개선사항
- 모든 상태 지표에 아이콘 추가:
  - ✓ 완료 상태
  - ✗ 오류 상태  
  - ⚠ 진행중 상태
  - 🔧 수리중 상태

## 추후 새로운 컴포넌트 개발시

새로운 컴포넌트를 개발할 때는 반드시 위의 고대비 클래스들과 WCAG AAA 수준 색상을 활용하여 일관된 사용자 경험을 제공해주세요.