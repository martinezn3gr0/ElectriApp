import { useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../components/FirebaseProvider';
import { apiFetch } from '../lib/api';
import type { Project } from '../types';

export function useCompleteProject() {
  return useCallback(async (projectId: string) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Debes iniciar sesión');

      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) return;

      const project = projectSnap.data() as Project;
      const isParty = project.clientId === uid || project.electricianId === uid;
      if (!isParty) {
        throw new Error('No tienes permiso para completar este proyecto');
      }
      if (project.status !== 'in-progress') {
        throw new Error('Solo se pueden completar proyectos en progreso');
      }

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
