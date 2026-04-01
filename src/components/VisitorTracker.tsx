import { useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function VisitorTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // Use localStorage to count unique visitors per day
      const lastTrackedDate = localStorage.getItem('v_tracked_date');
      if (lastTrackedDate === today) return;

      const visitorRef = doc(db, 'analytics', 'visitors');
      const dailyRef = doc(db, 'daily_stats', today);

      try {
        // Use setDoc with merge: true for daily stats to handle creation and increment in one go
        await setDoc(dailyRef, { 
          date: today, 
          count: increment(1) 
        }, { merge: true });

        const docSnap = await getDoc(visitorRef);
        if (!docSnap.exists()) {
          await setDoc(visitorRef, {
            totalCount: 1,
            todayCount: 1,
            lastDate: today
          });
        } else {
          const data = docSnap.data();
          if (data.lastDate === today) {
            await updateDoc(visitorRef, {
              totalCount: increment(1),
              todayCount: increment(1)
            });
          } else {
            await updateDoc(visitorRef, {
              totalCount: increment(1),
              todayCount: 1,
              lastDate: today
            });
          }
        }
        localStorage.setItem('v_tracked_date', today);
      } catch (error) {
        console.error("Error tracking visit:", error);
      }
    };

    trackVisit();
  }, []);

  return null;
}
