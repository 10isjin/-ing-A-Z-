import { useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function VisitorTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      // Use sessionStorage to prevent multiple counts in the same session
      const hasVisited = sessionStorage.getItem('v_tracked');
      if (hasVisited) return;

      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const visitorRef = doc(db, 'analytics', 'visitors');

      try {
        const docSnap = await getDoc(visitorRef);

        if (!docSnap.exists()) {
          // Initialize if it doesn't exist
          await setDoc(visitorRef, {
            totalCount: 1,
            todayCount: 1,
            lastDate: today
          });
        } else {
          const data = docSnap.data();
          if (data.lastDate === today) {
            // Same day, increment both
            await updateDoc(visitorRef, {
              totalCount: increment(1),
              todayCount: increment(1)
            });
          } else {
            // New day, reset todayCount
            await updateDoc(visitorRef, {
              totalCount: increment(1),
              todayCount: 1,
              lastDate: today
            });
          }
        }
        sessionStorage.setItem('v_tracked', 'true');
      } catch (error) {
        console.error("Error tracking visit:", error);
      }
    };

    trackVisit();
  }, []);

  return null;
}
