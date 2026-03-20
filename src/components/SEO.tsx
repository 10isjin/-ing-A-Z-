import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteSettings } from '../types';

const SEO: React.FC = () => {
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({
    siteName: '갈매중 체육ing',
    seoTitle: '갈매중 체육ing Aㅏ침부터 Zㅓ녁까지',
    seoDescription: '갈매중학교 체육 활동 게시 및 학교 소개를 위한 전문적인 웹사이트입니다.',
    seoKeywords: '갈매중학교, 체육, 스포츠, 학교스포츠클럽, 런치리그'
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        setSiteSettings(doc.data() as SiteSettings);
      }
    });
    return () => unsub();
  }, []);

  const defaultImage = 'https://picsum.photos/seed/school/1200/630';

  return (
    <Helmet>
      <title>{siteSettings.seoTitle || siteSettings.siteName}</title>
      <meta name="description" content={siteSettings.seoDescription} />
      {siteSettings.seoKeywords && (
        <meta name="keywords" content={siteSettings.seoKeywords} />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteSettings.seoTitle || siteSettings.siteName} />
      <meta property="og:description" content={siteSettings.seoDescription} />
      <meta property="og:image" content={siteSettings.seoImage || defaultImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={siteSettings.seoTitle || siteSettings.siteName} />
      <meta property="twitter:description" content={siteSettings.seoDescription} />
      <meta property="twitter:image" content={siteSettings.seoImage || defaultImage} />
    </Helmet>
  );
};

export default SEO;
