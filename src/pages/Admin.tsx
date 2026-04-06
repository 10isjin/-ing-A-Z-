import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { Post, SiteSettings, Highlight, AppEntry, Survey } from '../types';
import { getDirectImageUrl, getYoutubeId, isGoogleDoc, getGoogleDocEmbedUrl } from '../imageUtils';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, LayoutDashboard, FileText, Settings, LogOut, Database, Star, Upload, Loader2, Check, Smartphone, Clock, Users, Eye, Table, Presentation, Shield, ClipboardList, BarChart2, Newspaper } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { processFile } from '../utils/faceBlur';
import { motion } from 'motion/react';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [newsHighlights, setNewsHighlights] = useState<Highlight[]>([]);
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [visitorStats, setVisitorStats] = useState<{ totalCount: number; todayCount: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isEditingHighlight, setIsEditingHighlight] = useState(false);
  const [isEditingNewsHighlight, setIsEditingNewsHighlight] = useState(false);
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isEditingSurvey, setIsEditingSurvey] = useState(false);
  const [isViewingStats, setIsViewingStats] = useState(false);
  const [dailyStats, setDailyStats] = useState<{ date: string; count: number }[]>([]);
  const [currentPost, setCurrentPost] = useState<Partial<Post>>({
    title: '',
    content: '',
    category: 'class',
    type: 'gallery',
    imageUrl: '',
    isHighlight: false
  });
  const [currentHighlight, setCurrentHighlight] = useState<Partial<Highlight>>({
    title: '',
    imageUrl: '',
    type: 'gallery'
  });
  const [currentNewsHighlight, setCurrentNewsHighlight] = useState<Partial<Highlight>>({
    title: '',
    imageUrl: '',
    type: 'news',
    link: ''
  });
  const [currentApp, setCurrentApp] = useState<Partial<AppEntry>>({
    name: '',
    description: '',
    category: '',
    link: '',
    color: 'bg-blue-600',
    iconName: 'Activity',
    isRecommended: false
  });
  const [currentSurvey, setCurrentSurvey] = useState<Partial<Survey>>({
    title: '',
    description: '',
    formUrl: '',
    isActive: true
  });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '갈매중은 지금 체육ing Aㅏ침부터 Zㅓ녁까지',
    primaryColor: '#16a34a',
    secondaryColor: '#ec4899',
    heroTitle: '갈매중은 지금 체육ing\nAㅏ침부터 Zㅓ녁까지',
    heroSubtitle: '갈매중 체육의 A to Z! 학생들의 건강한 꿈과 열정이 가득한 현장을 만나보세요.',
    footerText: '갈매중학교 학생들의 건강한 성장을 위해 아침부터 저녁까지 다양한 체육 활동을 지원하고 소통하는 공간입니다.',
    aboutImage1: 'https://storage.googleapis.com/multimodal_ai_studio/as_storage/b3ihjs7i4dlulpnvu3n4kz/67d8d263-8822-4a02-8646-068d37452d3c.png',
    aboutImage2: 'https://picsum.photos/seed/students-running/400/300',
    aboutImage3: 'https://picsum.photos/seed/students-soccer/400/300',
    aboutImage4: 'https://picsum.photos/seed/students-gymnastics/400/500',
    stat1Label: '활동 종목',
    stat1Value: '12+',
    stat2Label: '참여 학생',
    stat2Value: '450+',
    stat3Label: '만족도',
    stat3Value: '98%',
    stat4Label: '연간 행사',
    stat4Value: '24회',
    instagramUrl: '',
    youtubeUrl: '',
    facebookUrl: '',
    schoolAddress: '경기도 구리시 갈매순환로 123 갈매중학교 체육건강부',
    schoolPhone: '031-570-7857',
    schoolEmail: '10isjin@galmae.ms.kr',
    seoTitle: '갈매중은 지금 체육ing Aㅏ침부터 Zㅓ녁까지',
    seoDescription: '갈매중학교 체육 활동 게시 및 학교 소개를 위한 전문적인 웹사이트입니다.',
    seoKeywords: '갈매중학교, 체육, 스포츠, 학교스포츠클럽, 런치리그',
    seoImage: 'https://storage.googleapis.com/multimodal_ai_studio/as_storage/b3ihjs7i4dlulpnvu3n4kz/67d8d263-8822-4a02-8646-068d37452d3c.png',
    qrCodeUrl: '',
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [autoFaceBlur, setAutoFaceBlur] = useState<boolean>(true);
  const [isProcessingExisting, setIsProcessingExisting] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask | null>(null);

  const [isDeleting, setIsDeleting] = useState<{ id: string, type: 'post' | 'highlight' | 'app' | 'survey' } | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ title: string, message: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'primary';
  } | null>(null);

  const isAdmin = user?.email === 'yelloboll@goedu.kr';

  const convertDriveUrl = (url: string) => {
    return getDirectImageUrl(url);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts in Admin:", error);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      console.error("Error fetching settings in Admin:", error);
    });

    const hq = query(collection(db, 'highlights'), orderBy('createdAt', 'desc'));
    const unsubscribeHighlights = onSnapshot(hq, (snapshot) => {
      const fetchedHighlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Highlight));
      setHighlights(fetchedHighlights.filter(h => !h.type || h.type === 'gallery'));
      setNewsHighlights(fetchedHighlights.filter(h => h.type === 'news'));
    }, (error) => {
      console.error("Error fetching highlights in Admin:", error);
    });

    const aq = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(aq, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEntry));
      setApps(fetchedApps);

      // Auto-seed default apps if they don't exist
      const defaultApps = [
        { name: '나이키 트레이닝 클럽', description: '전문 트레이너와 함께하는 다양한 홈 트레이닝 프로그램', category: '홈 트레이닝', link: 'https://www.nike.com/ntc-app', color: 'bg-black', iconName: 'Activity', isRecommended: true, likesCount: 0 },
        { name: '홈코트', description: 'AI 기술을 활용한 농구 슈팅 및 드리블 훈련 분석', category: '농구/AI', link: 'https://www.homecourt.ai/', color: 'bg-orange-600', iconName: 'Target', isRecommended: true, likesCount: 0 },
        { name: '핏데이', description: '매일매일 건강한 습관을 만들어주는 맞춤형 운동 가이드', category: '건강관리', link: 'https://www.fitday.co.kr/', color: 'bg-green-600', iconName: 'Zap', isRecommended: true, likesCount: 0 },
        { name: '런데이', description: '초보자부터 상급자까지 즐겁게 달릴 수 있는 러닝 가이드', category: '러닝', link: 'https://www.runday.co.kr/', color: 'bg-blue-600', iconName: 'Timer', isRecommended: true, likesCount: 0 }
      ];

      if (fetchedApps.length === 0) {
        defaultApps.forEach(async (app) => {
          await addDoc(collection(db, 'apps'), {
            ...app,
            createdAt: serverTimestamp()
          });
        });
      }
    }, (error) => {
      console.error("Error fetching apps in Admin:", error);
    });

    const unsubscribeVisitors = onSnapshot(doc(db, 'analytics', 'visitors'), (docSnap) => {
      if (docSnap.exists()) {
        setVisitorStats(docSnap.data() as any);
      }
    }, (error) => {
      console.error("Error fetching visitor stats in Admin:", error);
    });

    const sq = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));
    const unsubscribeSurveys = onSnapshot(sq, (snapshot) => {
      const fetchedSurveys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
      setSurveys(fetchedSurveys);
    }, (error) => {
      console.error("Error fetching surveys in Admin:", error);
    });

    const dsq = query(collection(db, 'daily_stats'), orderBy('date', 'desc'));
    const unsubscribeDailyStats = onSnapshot(dsq, (snapshot) => {
      const stats = snapshot.docs.map(doc => doc.data() as { date: string; count: number });
      setDailyStats([...stats].reverse());
    }, (error) => {
      console.error("Error fetching daily stats in Admin:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
      unsubscribeSettings();
      unsubscribeHighlights();
      unsubscribeApps();
      unsubscribeVisitors();
      unsubscribeSurveys();
      unsubscribeDailyStats();
    };
  }, []);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <X className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
        <p className="text-gray-500 text-center max-w-xs">
          관리자 계정으로 로그인해 주세요. 관리자만 게시글을 관리할 수 있습니다.
        </p>
      </div>
    );
  }

  const processExistingPhotos = async () => {
    if (!window.confirm('기존에 업로드된 모든 사진의 얼굴을 감지하여 블러 처리를 시작하시겠습니까?\n사진이 많을 경우 시간이 다소 걸릴 수 있습니다.')) return;

    setIsProcessingExisting(true);
    const itemsToProcess = [
      ...posts.filter(p => p.imageUrl && !isGoogleDoc(p.imageUrl) && !getYoutubeId(p.imageUrl)),
      ...highlights.filter(h => h.imageUrl && !isGoogleDoc(h.imageUrl) && !getYoutubeId(h.imageUrl))
    ];

    setProcessingProgress({ current: 0, total: itemsToProcess.length });

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setProcessingProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // 1. Download image
        const response = await fetch(getDirectImageUrl(item.imageUrl) || item.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `processed_${Date.now()}.jpg`, { type: 'image/jpeg' });

        // 2. Process image
        const result = await processFile(file);
        const blurredFile = result.file;

        // 3. Upload image
        const storageRef = ref(storage, `uploads/processed_${Date.now()}_${i}.jpg`);
        const uploadResult = await uploadBytes(storageRef, blurredFile);
        const downloadURL = await getDownloadURL(uploadResult.ref);

        // 4. Update Firestore
        const collectionName = 'content' in item ? 'posts' : 'highlights';
        await updateDoc(doc(db, collectionName, item.id!), {
          imageUrl: downloadURL
        });

      } catch (err) {
        console.error(`Failed to process item ${item.id}:`, err);
      }
    }

    setIsProcessingExisting(false);
    setAlertMessage({ 
      title: '처리 완료', 
      message: '기존 사진들의 얼굴 블러 처리가 완료되었습니다.', 
      type: 'success' 
    });
  };

  const handleCancelUpload = () => {
    if (currentUploadTask) {
      currentUploadTask.cancel();
      setCurrentUploadTask(null);
      setUploading(false);
      setUploadProgress(0);
      setAlertMessage({ 
        title: '업로드 취소', 
        message: '이미지 업로드가 취소되었습니다.', 
        type: 'error' 
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'highlight' | 'news_highlight' | 'qr_code') => {
    let file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Automatic Face Blur (Skip for QR codes)
      if (autoFaceBlur && file.type.startsWith('image/') && type !== 'qr_code') {
        try {
          setAlertMessage({ 
            title: '얼굴 인식 중', 
            message: '초상권 보호를 위해 AI가 얼굴을 감지하고 있습니다. 잠시만 기다려 주세요...', 
            type: 'success' 
          });
          
          console.log("Processing file for face blur:", file.name);
          const result = await processFile(file);
          console.log("Face blur result:", result);
          
          file = result.file;
          
          if (result.facesCount === 0) {
            setAlertMessage({ 
              title: '얼굴 감지 안됨', 
              message: '사진에서 얼굴을 찾지 못했습니다. 얼굴이 너무 작거나 가려져 있을 수 있습니다. 수동으로 확인해 주세요.', 
              type: 'error' 
            });
          } else {
            setAlertMessage({ 
              title: '얼굴 블러 완료', 
              message: `${result.facesCount}개의 얼굴을 감지하여 강력한 모자이크 처리를 완료했습니다.`, 
              type: 'success' 
            });
          }
        } catch (err) {
          console.error("Face blur failed:", err);
          setAlertMessage({ 
            title: '얼굴 인식 오류', 
            message: `얼굴 인식 과정에서 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, 
            type: 'error' 
          });
        }
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage({ 
          title: '파일 크기 초과', 
          message: '파일 크기가 너무 큽니다. (최대 5MB)\n큰 파일은 구글 드라이브 링크를 사용해 주세요.', 
          type: 'error' 
        });
        setUploading(false);
        return;
      }

      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      setCurrentUploadTask(uploadTask);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Upload failed:", error);
          if (error.code === 'storage/canceled') {
            console.log("Upload was canceled by user");
          } else {
            setAlertMessage({ 
              title: '업로드 실패', 
              message: '이미지 업로드에 실패했습니다. 네트워크 상태를 확인하거나 이미지 주소(URL) 입력을 이용해 주세요.', 
              type: 'error' 
            });
          }
          setUploading(false);
          setCurrentUploadTask(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (type === 'post') {
            setCurrentPost(prev => ({ ...prev, imageUrl: downloadURL }));
          } else if (type === 'highlight') {
            setCurrentHighlight(prev => ({ ...prev, imageUrl: downloadURL }));
          } else if (type === 'news_highlight') {
            setCurrentNewsHighlight(prev => ({ ...prev, imageUrl: downloadURL }));
          } else if (type === 'qr_code') {
            setSiteSettings(prev => ({ ...prev, qrCodeUrl: downloadURL }));
          }
          setUploading(false);
          setUploadProgress(0);
          setCurrentUploadTask(null);
          setAlertMessage({ 
            title: '업로드 완료', 
            message: '이미지가 성공적으로 업로드되었습니다.', 
            type: 'success' 
          });
        }
      );
    } catch (error) {
      console.error("Upload setup failed:", error);
      setAlertMessage({ 
        title: '오류 발생', 
        message: '이미지 업로드 준비 중 오류가 발생했습니다.', 
        type: 'error' 
      });
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) {
      setAlertMessage({ title: '입력 오류', message: '제목과 내용을 모두 입력해 주세요.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const path = currentPost.id ? `posts/${currentPost.id}` : 'posts';
    const rawImageUrl = currentPost.imageUrl || '';
    const isYoutube = !!getYoutubeId(rawImageUrl);
    const finalImageUrl = isYoutube ? rawImageUrl : getDirectImageUrl(rawImageUrl);

    try {
      const { id, ...postData } = currentPost;
      if (id) {
        // Update
        const postRef = doc(db, 'posts', id);
        await updateDoc(postRef, {
          ...postData,
          imageUrl: finalImageUrl,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create
        await addDoc(collection(db, 'posts'), {
          ...postData,
          imageUrl: finalImageUrl,
          authorId: user.uid,
          authorName: user.displayName || user.email?.split('@')[0] || '관리자',
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setCurrentPost({ title: '', content: '', category: 'class', type: 'gallery', imageUrl: '', isHighlight: false });
      setAlertMessage({ title: '저장 완료', message: '게시글이 성공적으로 저장되었습니다.', type: 'success' });
    } catch (error) {
      console.error("Save error:", error);
      setAlertMessage({ title: '저장 실패', message: '게시글 저장 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, currentPost.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHighlight = async (post: Post) => {
    if (!post.id) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        isHighlight: !post.isHighlight,
        updatedAt: serverTimestamp()
      });
      setAlertMessage({ 
        title: post.isHighlight ? '하이라이트 해제' : '하이라이트 등록', 
        message: post.isHighlight ? '하이라이트에서 성공적으로 해제되었습니다.' : '하이라이트로 성공적으로 등록되었습니다.', 
        type: 'success' 
      });
    } catch (error) {
      console.error("Toggle highlight error:", error);
      setAlertMessage({ title: '오류 발생', message: '하이라이트 상태 변경 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleDelete = async (id: string, type: 'post' | 'highlight' | 'app' | 'survey') => {
    const collectionName = type === 'post' ? 'posts' : type === 'highlight' ? 'highlights' : type === 'app' ? 'apps' : 'surveys';
    const path = `${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setAlertMessage({ 
        title: '삭제 완료', 
        message: `${type === 'post' ? '게시글' : type === 'highlight' ? '하이라이트' : type === 'app' ? '앱 정보' : '설문조사'}이(가) 성공적으로 삭제되었습니다.`, 
        type: 'success' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalSettings = {
        ...siteSettings,
        qrCodeUrl: convertDriveUrl(siteSettings.qrCodeUrl || ''),
        seoImage: convertDriveUrl(siteSettings.seoImage || '')
      };
      await updateDoc(doc(db, 'settings', 'global'), finalSettings);
      setIsEditingSettings(false);
      setAlertMessage({ title: '저장 완료', message: '사이트 설정이 저장되었습니다.', type: 'success' });
    } catch (error) {
      // If document doesn't exist, setDoc instead
      try {
        const { setDoc } = await import('firebase/firestore');
        const finalSettings = {
          ...siteSettings,
          qrCodeUrl: convertDriveUrl(siteSettings.qrCodeUrl || ''),
          seoImage: convertDriveUrl(siteSettings.seoImage || '')
        };
        await setDoc(doc(db, 'settings', 'global'), finalSettings);
        setIsEditingSettings(false);
        setAlertMessage({ title: '저장 완료', message: '사이트 설정이 저장되었습니다.', type: 'success' });
      } catch (innerError) {
        setAlertMessage({ title: '저장 실패', message: '사이트 설정 저장 중 오류가 발생했습니다.', type: 'error' });
        handleFirestoreError(innerError, OperationType.WRITE, 'settings/global');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHighlight.imageUrl || !currentHighlight.title) {
      setAlertMessage({ title: '입력 오류', message: '제목과 이미지를 모두 입력해 주세요.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const path = currentHighlight.id ? `highlights/${currentHighlight.id}` : 'highlights';
    const finalImageUrl = convertDriveUrl(currentHighlight.imageUrl || '');

    try {
      const { id, ...highlightData } = currentHighlight;
      if (id) {
        await updateDoc(doc(db, 'highlights', id), {
          ...highlightData,
          imageUrl: finalImageUrl,
          createdAt: currentHighlight.createdAt || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'highlights'), {
          ...highlightData,
          imageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingHighlight(false);
      setAlertMessage({ title: '저장 완료', message: '하이라이트가 저장되었습니다.', type: 'success' });
      setCurrentHighlight({ title: '', imageUrl: '', type: 'gallery' });
    } catch (error) {
      setAlertMessage({ title: '저장 실패', message: '하이라이트 저장 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, currentHighlight.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewsHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNewsHighlight.imageUrl || !currentNewsHighlight.title) {
      setAlertMessage({ title: '입력 오류', message: '제목과 이미지를 모두 입력해 주세요.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const path = currentNewsHighlight.id ? `highlights/${currentNewsHighlight.id}` : 'highlights';
    const finalImageUrl = convertDriveUrl(currentNewsHighlight.imageUrl || '');

    try {
      const { id, ...highlightData } = currentNewsHighlight;
      if (id) {
        await updateDoc(doc(db, 'highlights', id), {
          ...highlightData,
          imageUrl: finalImageUrl,
          createdAt: currentNewsHighlight.createdAt || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'highlights'), {
          ...highlightData,
          imageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingNewsHighlight(false);
      setAlertMessage({ title: '저장 완료', message: '뉴스 하이라이트가 저장되었습니다.', type: 'success' });
      setCurrentNewsHighlight({ title: '', imageUrl: '', type: 'news', link: '' });
    } catch (error) {
      setAlertMessage({ title: '저장 실패', message: '뉴스 하이라이트 저장 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, currentNewsHighlight.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApp.name || !currentApp.link) {
      setAlertMessage({ title: '입력 오류', message: '이름과 링크를 입력해 주세요.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const path = currentApp.id ? `apps/${currentApp.id}` : 'apps';

    try {
      const { id, ...appData } = currentApp;
      if (id) {
        await updateDoc(doc(db, 'apps', id), {
          ...appData,
          createdAt: currentApp.createdAt || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'apps'), {
          ...appData,
          likesCount: 0,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingApp(false);
      setAlertMessage({ title: '저장 완료', message: '앱 정보가 저장되었습니다.', type: 'success' });
      setCurrentApp({ name: '', description: '', category: '', link: '', color: 'bg-blue-600', iconName: 'Activity', isRecommended: false });
    } catch (error) {
      setAlertMessage({ title: '저장 실패', message: '앱 정보 저장 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, currentApp.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSurvey.title || !currentSurvey.formUrl) {
      setAlertMessage({ title: '입력 오류', message: '제목과 설문지 URL을 입력해 주세요.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const path = currentSurvey.id ? `surveys/${currentSurvey.id}` : 'surveys';

    try {
      const { id, ...surveyData } = currentSurvey;
      if (id) {
        await updateDoc(doc(db, 'surveys', id), {
          ...surveyData,
          createdAt: currentSurvey.createdAt || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'surveys'), {
          ...surveyData,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingSurvey(false);
      setAlertMessage({ title: '저장 완료', message: '설문지 정보가 저장되었습니다.', type: 'success' });
      setCurrentSurvey({ title: '', description: '', formUrl: '', isActive: true });
    } catch (error) {
      setAlertMessage({ title: '저장 실패', message: '설문지 정보 저장 중 오류가 발생했습니다.', type: 'error' });
      handleFirestoreError(error, currentSurvey.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const seedData = async () => {
    setConfirmModal({
      title: '샘플 데이터 생성',
      message: '샘플 데이터를 생성하시겠습니까? 이 작업은 여러 개의 게시글을 추가합니다.',
      type: 'primary',
      onConfirm: async () => {
        setConfirmModal(null);
        const samples: Partial<Post>[] = [
          { title: '즐거운 체육 시간: 배드민턴 기초 배우기', content: '오늘 교과 수업 시간에는 배드민턴의 기본 자세와 서브 방법을 배웠습니다. 모두들 열정적으로 참여하는 모습이 보기 좋았습니다!', category: 'class', type: 'gallery', imageUrl: 'https://picsum.photos/seed/badminton/800/450' },
          { title: '런치리그 1학기 축구 결승전 결과', content: '치열했던 런치리그 축구 결승전! 3학년 2반이 승리하며 우승컵을 차지했습니다. 축하합니다!', category: 'lunch', type: 'gallery', imageUrl: 'https://picsum.photos/seed/soccer/800/450' },
          { title: '교육장배 학교스포츠클럽 농구 대회 출전', content: '우리 학교 농구부 학생들이 교육장배 대회에 출전하여 멋진 경기를 펼쳤습니다. 결과보다 과정이 빛난 하루였습니다.', category: 'sports_club', type: 'gallery', imageUrl: 'https://picsum.photos/seed/basketball/800/450' },
          { title: '2026 갈매 한마음 체육대회 안내', content: '드디어 기다리던 체육대회가 다가옵니다! 각 반의 개성 넘치는 응원전과 경기를 기대해 주세요.', category: 'festival', type: 'news', imageUrl: 'https://picsum.photos/seed/festival/800/450' }
        ];

        try {
          for (const sample of samples) {
            await addDoc(collection(db, 'posts'), {
              ...sample,
              authorId: user.uid,
              authorName: user.displayName,
              createdAt: serverTimestamp()
            });
          }
          setAlertMessage({ title: '생성 완료', message: '샘플 데이터가 성공적으로 생성되었습니다.', type: 'success' });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'posts');
        }
      }
    });
  };

  const handleEdit = (post: Post) => {
    setCurrentPost(post);
    setIsEditing(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">관리자 대시보드</h1>
          <p className="text-gray-500">체육 활동 게시글을 관리하고 사이트를 커스터마이징하세요.</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <button
            onClick={() => setIsEditingSettings(true)}
            className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
          >
            <Settings size={20} className="mr-2" />
            <span>사이트 설정 수정</span>
          </button>
          <button
            onClick={seedData}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
          >
            <Database size={20} className="mr-2" />
            <span>샘플 데이터 생성</span>
          </button>
          <button
            onClick={() => { setIsEditingApp(true); setCurrentApp({ name: '', description: '', category: '', link: '', color: 'bg-blue-600', iconName: 'Activity', isRecommended: false }); }}
            className="inline-flex items-center px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Smartphone size={20} className="mr-2" />
            <span>앱 추가</span>
          </button>
          <button
            onClick={() => { setIsEditing(true); setCurrentPost({ title: '', content: '', category: 'class', type: 'gallery', imageUrl: '' }); }}
            className="inline-flex items-center px-6 py-3 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
          >
            <Plus size={20} className="mr-2" />
            <span>새 게시글 작성</span>
          </button>
        </div>
      </div>

      {/* Face Blur Toggle */}
      <div className="mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={20} />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm">자동 얼굴 블러 처리 (초상권 보호)</p>
            <p className="text-xs text-blue-700">사진 업로드 시 AI가 자동으로 얼굴을 감지하여 블러 처리합니다.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isProcessingExisting ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center text-blue-600 mb-1">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span className="text-xs font-bold">처리 중... ({processingProgress.current}/{processingProgress.total})</span>
              </div>
              <div className="w-32 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300" 
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={processExistingPhotos}
              className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
            >
              기존 사진 모두 처리하기
            </button>
          )}
          <button
            onClick={() => setAutoFaceBlur(!autoFaceBlur)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              autoFaceBlur ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                autoFaceBlur ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">총 게시글</p>
              <p className="text-2xl font-black text-gray-900">{posts.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Smartphone size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">등록된 앱</p>
              <p className="text-2xl font-black text-gray-900">{apps.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600">
              <Star size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">하이라이트</p>
              <p className="text-2xl font-black text-gray-900">{highlights.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">설문조사</p>
              <p className="text-2xl font-black text-gray-900">{surveys.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">오늘 방문자</p>
              <p className="text-2xl font-black text-gray-900">{visitorStats?.todayCount || 0}</p>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => setIsViewingStats(true)}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm cursor-pointer hover:border-purple-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">누적 방문자</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-black text-gray-900">{visitorStats?.totalCount || 0}</p>
                <BarChart2 size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">최근 업데이트</p>
              <p className="text-sm font-bold text-gray-900">
                {posts[0]?.createdAt ? format(posts[0].createdAt.toDate(), 'MM.dd HH:mm') : '-'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Post List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center space-x-2">
                <FileText size={18} className="text-green-600" />
                <span>게시글 목록</span>
              </h2>
              <span className="text-xs font-bold text-gray-400">{posts.length}개의 게시글</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {posts.map(post => (
                <div key={post.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center bg-gray-50">
                      {isGoogleDoc(post.imageUrl) ? (
                        <div className="text-gray-400">
                          {post.imageUrl?.includes('spreadsheets') ? <Table size={20} /> : 
                           post.imageUrl?.includes('presentation') ? <Presentation size={20} /> : <FileText size={20} />}
                        </div>
                      ) : (
                        <img 
                          src={getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/100/100`} 
                          className="w-full h-full object-cover" 
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          post.type === 'gallery' ? "bg-blue-50 text-blue-600" : 
                          post.type === 'notice' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {post.type === 'gallery' ? 'GALLERY' : post.type === 'notice' ? 'NOTICE' : 'NEWS'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {post.category === 'class' ? '교과수업' : post.category === 'lunch' ? '런치리그' : post.category === 'sports_club' ? '교육장배학교스포츠' : post.category === 'festival' ? '체육대회' : post.category === 'project' ? '프로젝트' : post.category === 'health_fitness' ? '건강체력교실' : post.category === 'oasis' ? '오아시스' : post.category === 'paps' ? 'PAPS' : '인성'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                        {post.title}
                        {post.isHighlight && (
                          <span className="flex items-center text-[10px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                            <Star size={10} className="mr-0.5 fill-orange-500" />
                            하이라이트
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {post.createdAt?.toDate() ? format(post.createdAt.toDate(), 'yyyy.MM.dd HH:mm', { locale: ko }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => handleToggleHighlight(post)}
                      className={clsx(
                        "p-2 rounded-lg transition-all",
                        post.isHighlight 
                          ? "text-orange-500 bg-orange-50 hover:bg-orange-100" 
                          : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                      )}
                      title={post.isHighlight ? "하이라이트 해제" : "하이라이트 등록"}
                    >
                      <Star size={18} className={post.isHighlight ? "fill-orange-500" : ""} />
                    </button>
                    <button 
                      onClick={() => handleEdit(post)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setIsDeleting({ id: post.id!, type: 'post' })}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && !loading && (
                <div className="p-12 text-center">
                  <p className="text-gray-400">등록된 게시글이 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Apps List */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center space-x-2">
                <Smartphone size={18} className="text-blue-600" />
                <span>추천 앱 목록</span>
              </h2>
              <span className="text-xs font-bold text-gray-400">{apps.length}개의 앱</span>
            </div>
            
            <div className="p-6 space-y-4">
              {apps.map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white", app.color)}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-900 text-sm">{app.name}</p>
                        {app.isRecommended && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black rounded uppercase tracking-tighter">
                            추천됨
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase tracking-tighter">
                          좋아요: {app.likesCount || 0}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{app.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => { setCurrentApp(app); setIsEditingApp(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => app.id && setIsDeleting({ id: app.id, type: 'app' })}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {apps.length === 0 && (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400">등록된 앱이 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Surveys List Removed as per user request */}
        </div>

        {/* Quick Settings / Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <h2 className="font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Settings size={18} className="text-pink-500" />
              <span>사이트 설정</span>
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">사이트 이름</p>
                <p className="text-sm font-medium text-gray-700">{siteSettings.siteName}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">메인 테마 컬러</p>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: siteSettings.primaryColor }} />
                  <span className="text-sm font-medium text-gray-700">{siteSettings.primaryColor}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-4">
                * 위 버튼을 눌러 사이트의 텍스트와 색상을 직접 수정할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">사이트 설정 수정</h2>
              <button onClick={() => setIsEditingSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">사이트 이름</label>
                <input
                  type="text"
                  value={siteSettings.siteName}
                  onChange={e => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">메인 컬러 (Hex)</label>
                  <input
                    type="text"
                    value={siteSettings.primaryColor}
                    onChange={e => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">포인트 컬러 (Hex)</label>
                  <input
                    type="text"
                    value={siteSettings.secondaryColor}
                    onChange={e => setSiteSettings({ ...siteSettings, secondaryColor: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">히어로 제목</label>
                <textarea
                  rows={2}
                  value={siteSettings.heroTitle}
                  onChange={e => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">히어로 부제목</label>
                <textarea
                  rows={3}
                  value={siteSettings.heroSubtitle}
                  onChange={e => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">푸터 설명</label>
                <textarea
                  rows={3}
                  value={siteSettings.footerText}
                  onChange={e => setSiteSettings({ ...siteSettings, footerText: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900">SEO (검색 엔진 최적화) 설정</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">SEO 제목 (Title)</label>
                    <input
                      type="text"
                      placeholder="검색 결과에 표시될 제목"
                      value={siteSettings.seoTitle || ''}
                      onChange={e => setSiteSettings({ ...siteSettings, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">SEO 설명 (Description)</label>
                    <textarea
                      rows={2}
                      placeholder="검색 결과에 표시될 간단한 설명"
                      value={siteSettings.seoDescription || ''}
                      onChange={e => setSiteSettings({ ...siteSettings, seoDescription: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">SEO 키워드 (Keywords)</label>
                    <input
                      type="text"
                      placeholder="쉼표(,)로 구분하여 입력"
                      value={siteSettings.seoKeywords || ''}
                      onChange={e => setSiteSettings({ ...siteSettings, seoKeywords: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">공유 이미지 (Thumbnail URL)</label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="카카오톡 공유 시 표시될 이미지 URL"
                        value={siteSettings.seoImage || ''}
                        onChange={e => setSiteSettings({ ...siteSettings, seoImage: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      {siteSettings.seoImage && (
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, seoImage: '' })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {siteSettings.seoImage && (
                      <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        <img 
                          src={getDirectImageUrl(siteSettings.seoImage)} 
                          alt="SEO Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-blue-700 font-medium">
                        💡 구글 드라이브 이미지를 사용하려면 '공유' 설정에서 '모든 사용자'가 볼 수 있도록 설정한 후 링크를 입력해 주세요.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">사이트 QR 코드</label>
                    <div className="flex flex-col space-y-2">
                      <label className="cursor-pointer">
                        <div className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                          {uploading ? (
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col items-center space-y-1">
                                <Loader2 className="animate-spin text-green-500" size={16} />
                                <span className="text-[8px] font-bold text-green-500">{uploadProgress}%</span>
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCancelUpload();
                                }}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                title="업로드 취소"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="text-gray-400 group-hover:text-green-500 mr-2" size={16} />
                              <span className="text-xs font-medium text-gray-500 group-hover:text-green-600">QR 코드 파일 업로드</span>
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'qr_code')}
                            disabled={uploading}
                          />
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="또는 QR 코드 이미지 URL 직접 입력"
                          value={siteSettings.qrCodeUrl || ''}
                          onChange={e => setSiteSettings({ ...siteSettings, qrCodeUrl: e.target.value })}
                          className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                        />
                        {siteSettings.qrCodeUrl && (
                          <button
                            type="button"
                            onClick={() => setSiteSettings({ ...siteSettings, qrCodeUrl: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {siteSettings.qrCodeUrl && (
                      <div className="mt-2 relative h-32 w-32 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        <img 
                          src={getDirectImageUrl(siteSettings.qrCodeUrl)} 
                          alt="QR Preview" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-blue-700 font-medium">
                        💡 구글 드라이브에 올린 QR 코드 이미지 링크도 사용할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900">SNS 및 연락처 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Instagram URL</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://instagram.com/..."
                        value={siteSettings.instagramUrl || ''}
                        onChange={e => setSiteSettings({ ...siteSettings, instagramUrl: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      {siteSettings.instagramUrl && (
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, instagramUrl: '' })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">YouTube URL</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://youtube.com/..."
                        value={siteSettings.youtubeUrl || ''}
                        onChange={e => setSiteSettings({ ...siteSettings, youtubeUrl: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      {siteSettings.youtubeUrl && (
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, youtubeUrl: '' })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Facebook URL</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://facebook.com/..."
                        value={siteSettings.facebookUrl || ''}
                        onChange={e => setSiteSettings({ ...siteSettings, facebookUrl: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      {siteSettings.facebookUrl && (
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, facebookUrl: '' })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">학교 주소</label>
                  <input
                    type="text"
                    value={siteSettings.schoolAddress || ''}
                    onChange={e => setSiteSettings({ ...siteSettings, schoolAddress: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">전화번호</label>
                    <input
                      type="text"
                      value={siteSettings.schoolPhone || ''}
                      onChange={e => setSiteSettings({ ...siteSettings, schoolPhone: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">이메일</label>
                    <input
                      type="text"
                      value={siteSettings.schoolEmail || ''}
                      onChange={e => setSiteSettings({ ...siteSettings, schoolEmail: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900">홈 화면 통계 수치</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase">통계 1 (트로피 아이콘)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="라벨 (예: 활동 종목)"
                        value={siteSettings.stat1Label}
                        onChange={e => setSiteSettings({ ...siteSettings, stat1Label: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="수치 (예: 12+)"
                        value={siteSettings.stat1Value}
                        onChange={e => setSiteSettings({ ...siteSettings, stat1Value: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase">통계 2 (사용자 아이콘)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="라벨 (예: 참여 학생)"
                        value={siteSettings.stat2Label}
                        onChange={e => setSiteSettings({ ...siteSettings, stat2Label: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="수치 (예: 450+)"
                        value={siteSettings.stat2Value}
                        onChange={e => setSiteSettings({ ...siteSettings, stat2Value: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase">통계 3 (하트 아이콘)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="라벨 (예: 만족도)"
                        value={siteSettings.stat3Label}
                        onChange={e => setSiteSettings({ ...siteSettings, stat3Label: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="수치 (예: 98%)"
                        value={siteSettings.stat3Value}
                        onChange={e => setSiteSettings({ ...siteSettings, stat3Value: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase">통계 4 (반짝임 아이콘)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="라벨 (예: 연간 행사)"
                        value={siteSettings.stat4Label}
                        onChange={e => setSiteSettings({ ...siteSettings, stat4Label: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                      <input
                        type="text"
                        placeholder="수치 (예: 24회)"
                        value={siteSettings.stat4Value}
                        onChange={e => setSiteSettings({ ...siteSettings, stat4Value: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </div>
                  ) : (
                    <span>설정 저장</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Modal */}
      {isEditingApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentApp.id ? '앱 정보 수정' : '앱 추가'}
              </h2>
              <button onClick={() => setIsEditingApp(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveApp} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">앱 이름</label>
                <input
                  type="text"
                  required
                  value={currentApp.name}
                  onChange={e => setCurrentApp({ ...currentApp, name: e.target.value })}
                  placeholder="예: Nike Training Club"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">카테고리</label>
                <input
                  type="text"
                  required
                  value={currentApp.category}
                  onChange={e => setCurrentApp({ ...currentApp, category: e.target.value })}
                  placeholder="예: 홈 트레이닝"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">설명</label>
                <textarea
                  required
                  rows={3}
                  value={currentApp.description}
                  onChange={e => setCurrentApp({ ...currentApp, description: e.target.value })}
                  placeholder="앱에 대한 간단한 설명을 입력해 주세요."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">링크 (URL)</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={currentApp.link}
                      onChange={e => setCurrentApp({ ...currentApp, link: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    {currentApp.link && (
                      <button
                        type="button"
                        onClick={() => setCurrentApp({ ...currentApp, link: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">배경색 (Tailwind)</label>
                  <select
                    value={currentApp.color}
                    onChange={e => setCurrentApp({ ...currentApp, color: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="bg-black">Black</option>
                    <option value="bg-blue-600">Blue</option>
                    <option value="bg-orange-600">Orange</option>
                    <option value="bg-green-600">Green</option>
                    <option value="bg-red-600">Red</option>
                    <option value="bg-purple-600">Purple</option>
                    <option value="bg-pink-600">Pink</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">아이콘</label>
                  <select
                    value={currentApp.iconName}
                    onChange={e => setCurrentApp({ ...currentApp, iconName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="Activity">Activity</option>
                    <option value="Timer">Timer</option>
                    <option value="Trophy">Trophy</option>
                    <option value="Heart">Heart</option>
                    <option value="Smartphone">Smartphone</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <input
                  type="checkbox"
                  id="isRecommended"
                  checked={currentApp.isRecommended}
                  onChange={e => setCurrentApp({ ...currentApp, isRecommended: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isRecommended" className="text-sm font-bold text-blue-900 cursor-pointer">
                  추천 앱으로 설정 (상단에 강조되어 표시됩니다)
                </label>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingApp(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </div>
                  ) : (
                    <span>저장하기</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Modal */}
      {isEditingSurvey && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentSurvey.id ? '설문조사 수정' : '설문조사 추가'}
              </h2>
              <button onClick={() => setIsEditingSurvey(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSurvey} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">설문 제목</label>
                <input
                  type="text"
                  required
                  value={currentSurvey.title}
                  onChange={e => setCurrentSurvey({ ...currentSurvey, title: e.target.value })}
                  placeholder="예: 2024학년도 체육대회 만족도 조사"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">설문 설명</label>
                <textarea
                  required
                  rows={3}
                  value={currentSurvey.description}
                  onChange={e => setCurrentSurvey({ ...currentSurvey, description: e.target.value })}
                  placeholder="설문에 대한 간단한 설명을 입력해 주세요."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Google 설문지 URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={currentSurvey.formUrl}
                      onChange={e => setCurrentSurvey({ ...currentSurvey, formUrl: e.target.value })}
                      placeholder="https://docs.google.com/forms/..."
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                    {currentSurvey.formUrl && (
                      <button
                        type="button"
                        onClick={() => setCurrentSurvey({ ...currentSurvey, formUrl: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentSurvey.isActive}
                  onChange={e => setCurrentSurvey({ ...currentSurvey, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-indigo-900 cursor-pointer">
                  현재 활성화됨 (사용자에게 노출됩니다)
                </label>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingSurvey(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </div>
                  ) : (
                    <span>저장하기</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditingHighlight && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentHighlight.id ? '하이라이트 수정' : '하이라이트 추가'}
              </h2>
              <button onClick={() => setIsEditingHighlight(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveHighlight} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">설명/캡션</label>
                <input
                  type="text"
                  required
                  value={currentHighlight.title}
                  onChange={e => setCurrentHighlight({ ...currentHighlight, title: e.target.value })}
                  placeholder="예: 즐거운 농구 시간"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">이미지 업로드 / URL</label>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all group">
                        {uploading ? (
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center space-y-2">
                              <Loader2 className="animate-spin text-pink-500" size={20} />
                              <span className="text-[10px] font-bold text-pink-500">{uploadProgress}%</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelUpload();
                              }}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                              title="업로드 취소"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-gray-400 group-hover:text-pink-500 mr-2" size={20} />
                            <span className="text-sm font-medium text-gray-500 group-hover:text-pink-600">컴퓨터에서 파일 선택</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'highlight')}
                          disabled={uploading}
                        />
                      </div>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={currentHighlight.imageUrl}
                      onChange={e => setCurrentHighlight({ ...currentHighlight, imageUrl: e.target.value })}
                      placeholder="또는 이미지 주소(URL) 입력"
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                    />
                    {currentHighlight.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setCurrentHighlight({ ...currentHighlight, imageUrl: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {currentHighlight.imageUrl && (
                    <div className="mt-2 relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      {isGoogleDoc(currentHighlight.imageUrl) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4 bg-white">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                            {currentHighlight.imageUrl.includes('spreadsheets') ? (
                              <Table className="text-green-600" size={32} />
                            ) : currentHighlight.imageUrl.includes('presentation') ? (
                              <Presentation className="text-orange-500" size={32} />
                            ) : (
                              <FileText className="text-blue-500" size={32} />
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 opacity-60">
                            {currentHighlight.imageUrl.includes('spreadsheets') ? 'Google Sheets' : 
                             currentHighlight.imageUrl.includes('presentation') ? 'Google Slides' : 'Google Docs'}
                          </span>
                        </div>
                      ) : (
                        <img 
                          src={getDirectImageUrl(currentHighlight.imageUrl)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/450?grayscale';
                          }}
                        />
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        {isGoogleDoc(currentHighlight.imageUrl) ? '구글 문서' : '미리보기'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingHighlight(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>저장하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingNewsHighlight && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentNewsHighlight.id ? '뉴스 하이라이트 수정' : '뉴스 하이라이트 추가'}
              </h2>
              <button onClick={() => setIsEditingNewsHighlight(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveNewsHighlight} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">제목</label>
                <input
                  type="text"
                  required
                  value={currentNewsHighlight.title}
                  onChange={e => setCurrentNewsHighlight({ ...currentNewsHighlight, title: e.target.value })}
                  placeholder="뉴스 제목을 입력해 주세요"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">이미지 업로드 / URL</label>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group">
                        {uploading ? (
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center space-y-2">
                              <Loader2 className="animate-spin text-orange-500" size={20} />
                              <span className="text-[10px] font-bold text-orange-500">{uploadProgress}%</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelUpload();
                              }}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                              title="업로드 취소"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-gray-400 group-hover:text-orange-500 mr-2" size={20} />
                            <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600">컴퓨터에서 파일 선택</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'news_highlight')}
                          disabled={uploading}
                        />
                      </div>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={currentNewsHighlight.imageUrl}
                      onChange={e => setCurrentNewsHighlight({ ...currentNewsHighlight, imageUrl: e.target.value })}
                      placeholder="또는 이미지 주소(URL) 입력"
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                    {currentNewsHighlight.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setCurrentNewsHighlight({ ...currentNewsHighlight, imageUrl: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {currentNewsHighlight.imageUrl && (
                    <div className="mt-2 relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img 
                        src={getDirectImageUrl(currentNewsHighlight.imageUrl)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/450?grayscale';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        미리보기
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">링크 (선택사항)</label>
                <input
                  type="text"
                  value={currentNewsHighlight.link}
                  onChange={e => setCurrentNewsHighlight({ ...currentNewsHighlight, link: e.target.value })}
                  placeholder="클릭 시 이동할 링크를 입력해 주세요"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingNewsHighlight(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>저장하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {currentPost.id ? '게시글 수정' : '새 게시글 작성'}
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">제목</label>
                <input
                  type="text"
                  required
                  value={currentPost.title}
                  onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                  placeholder="활동 제목을 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">게시물 구분</label>
                  <select
                    value={currentPost.type}
                    onChange={e => setCurrentPost({ ...currentPost, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white"
                  >
                    <option value="news">NEWS</option>
                    <option value="gallery">GALLERY</option>
                    <option value="notice">NOTICE (공지사항)</option>
                  </select>
                </div>
                {currentPost.type === 'news' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">카테고리</label>
                    <select
                      value={currentPost.category}
                      onChange={e => setCurrentPost({ ...currentPost, category: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white"
                    >
                      <option value="class">교과수업</option>
                      <option value="lunch">런치리그</option>
                      <option value="sports_club">교육장배학교스포츠</option>
                      <option value="festival">체육대회</option>
                      <option value="project">프로젝트</option>
                      <option value="health_fitness">건강체력교실</option>
                      <option value="oasis">오아시스</option>
                      <option value="paps">PAPS</option>
                      <option value="character">인성</option>
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">이미지 업로드 / URL</label>
                  <div className="flex flex-col space-y-2">
                    <label className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                        {uploading ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-center space-y-1">
                              <Loader2 className="animate-spin text-green-500" size={16} />
                              <span className="text-[8px] font-bold text-green-500">{uploadProgress}%</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelUpload();
                              }}
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                              title="업로드 취소"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-gray-400 group-hover:text-green-500 mr-2" size={16} />
                            <span className="text-xs font-medium text-gray-500 group-hover:text-green-600">파일 선택</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'post')}
                          disabled={uploading}
                        />
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={currentPost.imageUrl}
                        onChange={e => setCurrentPost({ ...currentPost, imageUrl: e.target.value })}
                        placeholder="이미지, 유튜브, 또는 구글 문서 URL 입력"
                        className="w-full px-4 py-2 pr-10 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                      />
                      {currentPost.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setCurrentPost({ ...currentPost, imageUrl: '' })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-[10px] text-blue-700 font-bold mb-1">
                        💡 구글 시트(PAPS 등) 모든 탭을 보이게 하려면?
                      </p>
                      <p className="text-[9px] text-blue-600 leading-relaxed">
                        1. 구글 시트에서 [파일] → [공유] → [웹에 게시] 클릭<br/>
                        2. [게시] 버튼 누른 후 나오는 링크를 여기에 입력하세요.<br/>
                        * 단순 공유 링크는 첫 페이지만 보일 수 있습니다.
                      </p>
                    </div>
                    
                    {/* Image/Doc Preview */}
                    {currentPost.imageUrl && (
                      <div className={`mt-2 relative ${isGoogleDoc(currentPost.imageUrl) ? 'h-64' : 'h-32'} rounded-xl overflow-hidden border border-gray-100 bg-gray-50`}>
                        {isGoogleDoc(currentPost.imageUrl) ? (
                          <iframe
                            src={getGoogleDocEmbedUrl(currentPost.imageUrl) || ''}
                            className="w-full h-full bg-white"
                            frameBorder="0"
                          />
                        ) : (
                          <img 
                            src={getDirectImageUrl(currentPost.imageUrl)} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/200?grayscale';
                            }}
                          />
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase tracking-wider">
                          {getYoutubeId(currentPost.imageUrl) ? '유튜브 썸네일' : 
                           currentPost.imageUrl.includes('forms') || currentPost.imageUrl.includes('forms.gle') ? '구글 설문지' :
                           isGoogleDoc(currentPost.imageUrl) ? '구글 문서/시트' : '미리보기'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">내용 (Markdown 지원)</label>
                <textarea
                  required
                  rows={8}
                  value={currentPost.content}
                  onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                  placeholder="활동 내용을 상세히 적어주세요..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <input
                  type="checkbox"
                  id="isHighlight"
                  checked={currentPost.isHighlight}
                  onChange={e => setCurrentPost({ ...currentPost, isHighlight: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isHighlight" className="text-sm font-bold text-orange-900 cursor-pointer">
                  홈 화면 하이라이트로 등록 (갤러리/뉴스 섹션 상단 노출)
                </label>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>저장하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${
              confirmModal.type === 'danger' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              {confirmModal.type === 'danger' ? (
                <Trash2 className="text-red-500" size={32} />
              ) : (
                <Database className="text-blue-500" size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold text-center mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 text-center mb-8">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-6 py-3 rounded-xl text-white font-bold transition-all ${
                  confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">정말로 삭제하시겠습니까?</h3>
            <p className="text-gray-500 text-center mb-8">
              이 작업은 되돌릴 수 없습니다. {
                isDeleting.type === 'post' ? '게시글' : 
                isDeleting.type === 'highlight' ? '하이라이트' : 
                isDeleting.type === 'app' ? '앱 정보' : '설문조사'
              }이 영구적으로 삭제됩니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(isDeleting.id, isDeleting.type)}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Visitor Stats Modal */}
      {isViewingStats && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <BarChart2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">방문자 통계</h2>
                  <p className="text-sm text-gray-500">일자별 방문자 추이를 확인하세요.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsViewingStats(false)}
                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">총 누적 방문자</p>
                <p className="text-3xl font-black text-purple-900">{visitorStats?.totalCount || 0}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">오늘 방문자</p>
                <p className="text-3xl font-black text-orange-900">{visitorStats?.todayCount || 0}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">최근 7일 평균</p>
                <p className="text-3xl font-black text-blue-900">
                  {dailyStats.length > 0 
                    ? Math.round(dailyStats.slice(-7).reduce((acc, curr) => acc + curr.count, 0) / Math.min(dailyStats.length, 7))
                    : 0
                  }
                </p>
              </div>
            </div>

            <div className="h-[300px] w-full bg-gray-50 rounded-3xl p-6 border border-gray-100">
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(value) => value.split('-').slice(1).join('/')}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]}
                      name="방문자 수"
                    >
                      {dailyStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === dailyStats.length - 1 ? '#8b5cf6' : '#c4b5fd'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart2 size={48} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">데이터가 아직 없습니다.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsViewingStats(false)}
                className="px-8 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alert Message Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${
              alertMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {alertMessage.type === 'success' ? (
                <Check className="text-green-500" size={32} />
              ) : (
                <X className="text-red-500" size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">{alertMessage.title}</h3>
            <p className="text-gray-500 mb-8">{alertMessage.message}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className={`w-full px-6 py-3 rounded-xl font-bold text-white transition-all ${
                alertMessage.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              확인
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
