import { AppEntry } from '../types';

export interface DefaultAppItem {
  name: string;
  description: string;
  category: string;
  link: string;
  color: string;
  iconName: string;
  isRecommended: boolean;
  likesCount?: number;
}

export const normalizeAppName = (name: string): string => {
  if (!name) return '';
  const clean = name.toLowerCase().replace(/[\s\-_()\/]/g, '');
  
  if (clean.includes('홈코트') || clean.includes('homecourt')) return 'homecourt';
  if (clean.includes('런데이') || clean.includes('runday')) return 'runday';
  if (clean.includes('나이키트레이닝') || clean.includes('niketraining') || clean === 'ntc' || (clean.includes('나이키') && clean.includes('트레이닝'))) return 'niketraining';
  if (clean.includes('나이키런') || clean.includes('nikerun') || clean === 'nrc' || (clean.includes('나이키') && clean.includes('런'))) return 'nikerun';
  if (clean.includes('핏데이') || clean.includes('fitday')) return 'fitday';
  if (clean.includes('스트라바') || clean.includes('strava')) return 'strava';
  if (clean.includes('플랭크') || clean.includes('plank')) return 'plank';
  if (clean.includes('줄넘기') || clean.includes('야오야오') || clean.includes('yaoyao') || clean.includes('jumprope')) return 'yaoyao';
  if (clean.includes('요가') || clean.includes('yoga') || clean.includes('스트레칭')) return 'dailyyoga';
  
  return clean;
};

export const RECOMMENDED_DEFAULT_APPS: DefaultAppItem[] = [
  { 
    name: '홈코트 (HomeCourt)', 
    description: '스마트폰 AI 모션 인식으로 농구 슈팅 성공률, 슈팅 폼, 드리블 스피드를 실시간 분석하고 게임처럼 즐기는 농구 훈련 앱', 
    category: '농구 / AI 모션분석', 
    link: 'https://www.homecourt.ai/', 
    color: 'bg-orange-600', 
    iconName: 'Target', 
    isRecommended: true, 
    likesCount: 12
  },
  { 
    name: '런데이 (Runday)', 
    description: '체계적인 8주 30분 달리기 도전 플랜과 맞춤형 보이스 코칭으로 기초 체력을 즐겁게 향상시키는 대한민국 대표 러닝 가이드', 
    category: '러닝 / 기초체력', 
    link: 'https://www.runday.co.kr/', 
    color: 'bg-blue-600', 
    iconName: 'Timer', 
    isRecommended: true, 
    likesCount: 15
  },
  { 
    name: '나이키 트레이닝 클럽 (NTC)', 
    description: '전문 트레이너와 함께하는 전신 근력 운동, 맨몸 트레이닝, 청소년 코어 운동 루틴을 무료로 제공하는 글로벌 피트니스 앱', 
    category: '홈 트레이닝 / 근력', 
    link: 'https://www.nike.com/ntc-app', 
    color: 'bg-black', 
    iconName: 'Activity', 
    isRecommended: true, 
    likesCount: 18
  },
  { 
    name: '스트라바 (Strava)', 
    description: '달리기와 사이클 라이딩 경로를 GPS로 정밀하게 추적하고 친구들과 운동 기록 및 세그먼트 기록을 공유하는 액티비티 플랫폼', 
    category: '러닝 / 사이클 / GPS', 
    link: 'https://www.strava.com/', 
    color: 'bg-amber-600', 
    iconName: 'MapPin', 
    isRecommended: true, 
    likesCount: 9
  },
  { 
    name: '핏데이 (FitDay)', 
    description: '하루 7분 순환 운동(HIIT)과 매일 꾸준한 스트레칭으로 올바른 운동 습관을 만들어주는 맞춤형 체력 관리 앱', 
    category: '건강관리 / 습관형성', 
    link: 'https://www.fitday.co.kr/', 
    color: 'bg-green-600', 
    iconName: 'Zap', 
    isRecommended: true, 
    likesCount: 7
  },
  { 
    name: '나이키 런 클럽 (NRC)', 
    description: '세계적인 코치진의 오디오 가이드 런과 실시간 페이스 분석으로 달리는 즐거움을 선사하는 스마트 러닝 코치', 
    category: '러닝 코칭 / 페이스메이커', 
    link: 'https://www.nike.com/nrc-app', 
    color: 'bg-red-600', 
    iconName: 'Trophy', 
    isRecommended: true, 
    likesCount: 11
  },
  { 
    name: '플랭크 타이머 & 30일 챌린지', 
    description: '학생들의 바른 척추 자세 유지와 중심 코어 근력을 탄탄하게 키워주는 단계별 플랭크 운동 루틴 및 스마트 타이머', 
    category: '코어 운동 / 자세교정', 
    link: 'https://play.google.com/store/apps/details?id=plank.plankchallenge.plankworkout.coreworkout', 
    color: 'bg-slate-800', 
    iconName: 'Flame', 
    isRecommended: false, 
    likesCount: 5
  },
  { 
    name: '스마트 줄넘기 카운터 (YaoYao)', 
    description: '스마트폰 카메라와 센서를 활용하여 줄넘기 도약 횟수, 속도, 칼로리를 실시간 자동 측정해주는 신나는 줄넘기 트레이너', 
    category: '줄넘기 / 유산소', 
    link: 'https://yaoyaojump.com/', 
    color: 'bg-emerald-600', 
    iconName: 'Zap', 
    isRecommended: false, 
    likesCount: 8
  },
  { 
    name: '데일리 요가 (Daily Yoga)', 
    description: '체육 수업 전후 부상을 예방하는 스트레칭과 유연성 향상, 굽은 등과 척추를 바로잡는 청소년 체형 교정 프로그램', 
    category: '스트레칭 / 유연성', 
    link: 'https://www.dailyyoga.com/', 
    color: 'bg-purple-600', 
    iconName: 'Heart', 
    isRecommended: false, 
    likesCount: 6
  }
];

/**
 * Deduplicates apps based on normalized app name.
 * If multiple apps exist with the same normalized name, merges them,
 * taking the highest like count and prioritizing recommended status.
 */
export function deduplicateApps(appList: AppEntry[]): AppEntry[] {
  const map = new Map<string, AppEntry>();

  for (const app of appList) {
    const key = normalizeAppName(app.name);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...app });
    } else {
      // Merge properties smartly:
      // Keep existing ID if valid, prefer isRecommended, higher likesCount, better description
      const merged: AppEntry = {
        ...existing,
        id: existing.id || app.id,
        isRecommended: existing.isRecommended || app.isRecommended,
        likesCount: Math.max(existing.likesCount || 0, app.likesCount || 0),
        // If one has a richer name or description, prefer it
        name: (existing.name.length >= app.name.length) ? existing.name : app.name,
        description: (existing.description.length >= app.description.length) ? existing.description : app.description,
        category: existing.category || app.category,
        link: existing.link || app.link,
        color: existing.color || app.color,
        iconName: existing.iconName || app.iconName
      };
      map.set(key, merged);
    }
  }

  return Array.from(map.values());
}

/**
 * Identifies duplicate Firestore document IDs to remove from Firestore.
 */
export function findDuplicateAppDocIds(appList: AppEntry[]): string[] {
  const seenKeys = new Map<string, string>(); // key -> primaryDocId
  const duplicateDocIds: string[] = [];

  for (const app of appList) {
    if (!app.id) continue;
    const key = normalizeAppName(app.name);
    if (seenKeys.has(key)) {
      // This is a duplicate doc
      duplicateDocIds.push(app.id);
    } else {
      seenKeys.set(key, app.id);
    }
  }

  return duplicateDocIds;
}
