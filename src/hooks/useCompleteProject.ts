import { useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../components/FirebaseProvider';
import { apiFetch } from '../lib/api';

export function useCompleteProject() {
  return useCallback(async (projectId: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) return;

      await updateDoc(projectRef, {
        status: 'completed',
      });

      try {
        await apiFetch('/api/send-completion-email', {
          method: 'POST',
          body: {
            projectId,
            projectUrl: `${window.location.origin}/projects`,
          },
        });
      } catch (emailError) {
        console.error('Completion email failed:', emailError);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  }, []);
}
