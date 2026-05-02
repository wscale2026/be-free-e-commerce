import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Student, Trainer, ZoomSession, Message, StudentStatus, Notification } from '@/types';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface MockDataState {
  students: Student[];
  trainers: Trainer[];
  zoomSessions: ZoomSession[];
  messages: Message[];
  notifications: Notification[];
  payments: any[];
}

interface MockDataContextType {
  state: MockDataState;
  refreshData: () => Promise<void>;
  updateStudentStatus: (studentId: string, newStatus: StudentStatus) => Promise<void>;
  addStudent: (student: Student) => Promise<void>;
  uploadKbis: (studentId: string, file: File) => Promise<void>;
  addTrainer: (trainer: Trainer) => Promise<void>;
  updateTrainer: (trainerId: string, trainerData: Partial<Trainer>) => Promise<void>;
  deleteTrainer: (trainerId: string) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  assignTrainer: (studentId: string, trainerId: string) => Promise<void>;
  addZoom: (session: ZoomSession) => Promise<void>;
  updateZoom: (sessionId: string, session: ZoomSession) => Promise<void>;
  deleteZoom: (sessionId: string) => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;
  addMessage: (message: Message) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteAllMessages: (studentId: string) => Promise<void>;
  addPayment: (payment: any) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  // Notification methods
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

const mapStudent = (raw: any): Student => {
  let hasBusiness = raw.has_business || '';
  let currentOffer = raw.current_offer || '';
  let monthlyRevenue = raw.monthly_revenue || '';
  let challenges = raw.challenges || '';

  // Fallback: if specific fields are empty, try to parse from JSON notes (old registrations)
  if (!hasBusiness && raw.notes && raw.notes.trim().startsWith('{')) {
    try {
      const diag = JSON.parse(raw.notes);
      if (diag.landing_form_completed) {
        hasBusiness = diag.hasBusiness || '';
        currentOffer = diag.offre || '';
        monthlyRevenue = diag.ca || '';
        challenges = Array.isArray(diag.challenge) ? diag.challenge.join(', ') : diag.challenge || '';
      }
    } catch (e) {
      // Not a valid JSON or different format, ignore
    }
  }

  return {
    id: String(raw.id),
    userId: String(raw.user?.id),
    firstName: raw.user?.first_name || 'Utilisateur',
    lastName: raw.user?.last_name || '',
    email: raw.user?.email || '',
    status: raw.status,
    trainerId: raw.trainer_id ? String(raw.trainer_id) : null,
    paymentStatus: raw.payment_status,
    phone: raw.phone,
    instalment2Paid: raw.instalment2_paid,
    nextZoomDate: raw.next_zoom_date,
    lastInteraction: raw.last_interaction || 'Jamais',
    totalDue: Number(raw.total_due),
    paidAmount: Number(raw.paid_amount),
    nextDueDate: raw.next_due_date,
    username: raw.user?.username,
    password: raw.raw_password || '',
    kbisFile: raw.kbis_file || undefined,
    hasBusiness,
    currentOffer,
    monthlyRevenue,
    challenges,
    notes: raw.notes || '',
    engagementScore: Number(raw.engagement_score || 5),
    progress: Number(raw.progress || 0),
  };
};

const mapTrainer = (raw: any): Trainer => ({
  id: String(raw.id), // TrainerProfile PK
  userId: String(raw.user?.id), // User PK
  firstName: raw.user?.first_name || 'Formateur',
  lastName: raw.user?.last_name || '',
  email: raw.user?.email || '',
  username: raw.user?.username || '',
  specialty: raw.specialty,
  assignedStudentIds: (raw.assigned_student_ids || []).map(String),
  password: raw.raw_password || '',
});

const mapZoom = (raw: any): ZoomSession => ({
  id: String(raw.id),
  title: raw.title,
  date: raw.date,
  time: raw.time,
  link: raw.link,
  trainerId: String(raw.trainer_id),
  studentIds: raw.student_ids.map(String),
  isRecurring: raw.is_recurring,
  recurrenceRule: raw.recurrence_rule,
});

const mapMessage = (raw: any): Message => ({
  id: String(raw.id),
  fromStudentId: String(raw.from_student_id),
  toTrainerId: String(raw.to_trainer_id),
  subject: raw.subject,
  body: raw.body,
  createdAt: raw.created_at,
  read: raw.read,
});

const mapNotification = (raw: any): any => ({
  id: String(raw.id),
  userId: String(raw.user),
  type: raw.type,
  title: raw.title,
  message: raw.message,
  createdAt: raw.created_at,
  read: raw.read,
  link: raw.link,
});

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MockDataState>({
    students: [], trainers: [], zoomSessions: [], messages: [], payments: [], notifications: []
  });

  const { user } = useAuth();

  const refreshData = useCallback(async () => {
    if (!user) return; // Do not fetch if not authenticated
    
    const [stuRes, traRes, zooRes, msgRes, payRes, notRes] = await Promise.allSettled([
      api.get('/students/'),
      api.get('/trainers/'),
      api.get('/zoom-sessions/'),
      api.get('/messages/'),
      api.get('/payments/'),
      api.get('/notifications/')
    ]);

    setState(prev => ({
      students: stuRes.status === 'fulfilled' ? stuRes.value.data.map(mapStudent) : prev.students,
      trainers: traRes.status === 'fulfilled' ? traRes.value.data.map(mapTrainer) : prev.trainers,
      zoomSessions: zooRes.status === 'fulfilled' ? zooRes.value.data.map(mapZoom) : prev.zoomSessions,
      messages: msgRes.status === 'fulfilled' ? msgRes.value.data.map(mapMessage) : prev.messages,
      payments: payRes.status === 'fulfilled' ? payRes.value.data : prev.payments,
      notifications: notRes.status === 'fulfilled' ? notRes.value.data.map(mapNotification) : prev.notifications,
    }));

    [stuRes, traRes, zooRes, msgRes, payRes].forEach((result, index) => {
      if (result.status === 'rejected') {
        const resources = ['students', 'trainers', 'zoom-sessions', 'messages', 'payments'];
        console.error(`Failed to fetch ${resources[index]}`, result.reason);
      }
    });
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData, user]);

  const updateStudentStatus = useCallback(async (studentId: string, newStatus: StudentStatus) => {
    await api.patch(`/students/${studentId}/`, { status: newStatus });
    await refreshData();
  }, [refreshData]);

  const addStudent = useCallback(async (student: Student) => {
    // Map camelCase to snake_case for backend
    const payload = {
      username: student.username,
      password: student.password,
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      phone: student.phone,
      status: student.status,
      trainer_id: student.trainerId || null,
      payment_status: student.paymentStatus,
      total_due: student.totalDue,
      paid_amount: student.paidAmount,
      formation_type: student.formationType,
      preferred_schedule: student.preferredSchedule,
      experience_level: student.experienceLevel,
      notes: student.notes,
      next_due_date: student.nextDueDate || null,
      next_zoom_date: student.nextZoomDate || null,
    };
    const response = await api.post('/students/', payload);
    const createdStudent = mapStudent(response.data);

    setState(prev => ({
      ...prev,
      students: [createdStudent, ...prev.students.filter(s => s.id !== createdStudent.id)],
    }));

    await refreshData();
  }, [refreshData]);

  const uploadKbis = useCallback(async (studentId: string, file: File) => {
    const formData = new FormData();
    formData.append('kbis_file', file);
    await api.patch(`/students/${studentId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    await refreshData();
  }, [refreshData]);

  const addTrainer = useCallback(async (trainer: Trainer) => {
    const payload = {
      username: trainer.username,
      password: trainer.password,
      first_name: trainer.firstName,
      last_name: trainer.lastName,
      email: trainer.email,
      specialty: trainer.specialty,
    };
    await api.post('/trainers/', payload);
    await refreshData();
  }, [refreshData]);

  const updateTrainer = useCallback(async (trainerId: string, trainerData: Partial<Trainer>) => {
    const payload = {
      first_name: trainerData.firstName,
      last_name: trainerData.lastName,
      email: trainerData.email,
      specialty: trainerData.specialty,
      username: trainerData.username,
    };
    await api.patch(`/trainers/${trainerId}/`, payload);
    await refreshData();
  }, [refreshData]);

  const deleteTrainer = useCallback(async (trainerId: string) => {
    await api.delete(`/trainers/${trainerId}/`);
    await refreshData();
  }, [refreshData]);

  const updateStudent = useCallback(async (student: Student) => {
    const payload = {
      // User fields
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      username: student.username,
      
      // Profile fields
      status: student.status,
      payment_status: student.paymentStatus,
      phone: student.phone,
      trainer_id: student.trainerId || null,
      total_due: student.totalDue,
      paid_amount: student.paidAmount,
      next_due_date: student.nextDueDate || null,
      next_zoom_date: student.nextZoomDate || null,
      has_business: student.hasBusiness,
      current_offer: student.currentOffer,
      monthly_revenue: student.monthlyRevenue,
      challenges: student.challenges,
      notes: student.notes,
    };
    await api.patch(`/students/${student.id}/`, payload);
    await refreshData();
  }, [refreshData]);

  const deleteStudent = useCallback(async (studentId: string) => {
    // studentId must be the StudentProfile PK (not User ID)
    await api.delete(`/students/${studentId}/`);
    await refreshData();
  }, [refreshData]);

  const assignTrainer = useCallback(async (studentId: string, trainerId: string) => {
    await api.patch(`/students/${studentId}/`, { trainer_id: trainerId });
    await refreshData();
  }, [refreshData]);

  const addZoom = useCallback(async (session: ZoomSession) => {
    const payload = {
        title: session.title,
        date: session.date,
        time: session.time,
        link: session.link,
        trainer_id: session.trainerId,
        student_ids: session.studentIds,
        is_recurring: session.isRecurring,
        recurrence_rule: session.recurrenceRule
    };
    await api.post('/zoom-sessions/', payload);
    await refreshData();
  }, [refreshData]);

  const updateZoom = useCallback(async (sessionId: string, session: any) => {
    const payload = {
        title: session.title,
        date: session.date,
        time: session.time,
        link: session.link,
        trainer_id: session.trainerId,
        student_ids: session.studentIds,
        is_recurring: session.isRecurring,
        recurrence_rule: session.recurrenceRule
    };
    await api.patch(`/zoom-sessions/${sessionId}/`, payload);
    await refreshData();
  }, [refreshData]);

  const deleteZoom = useCallback(async (sessionId: string) => {
    await api.delete(`/zoom-sessions/${sessionId}/`);
    await refreshData();
  }, [refreshData]);

  const sendMessage = useCallback(async (messageData: any) => {
    await api.post('/messages/', messageData);
    await refreshData();
  }, [refreshData]);

  const addMessage = useCallback(async (message: Message) => {
    const payload = {
      from_student_id: message.fromStudentId,
      to_trainer_id: message.toTrainerId,
      subject: message.subject,
      body: message.body,
    };
    await api.post('/messages/', payload);
    await refreshData();
  }, [refreshData]);

  const markMessageRead = useCallback(async (messageId: string) => {
    await api.patch(`/messages/${messageId}/`, { read: true });
    await refreshData();
  }, [refreshData]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await api.delete(`/messages/${messageId}/`);
    await refreshData();
  }, [refreshData]);

  const deleteAllMessages = useCallback(async (userId: string) => {
    const userMsgs = state.messages.filter(m => m.fromStudentId === userId || m.toTrainerId === userId);
    await Promise.all(userMsgs.map(m => api.delete(`/messages/${m.id}/`)));
    await refreshData();
  }, [state.messages, refreshData]);

  const addPayment = useCallback(async (payment: any) => {
    await api.post('/payments/', payment);
    await refreshData();
  }, [refreshData]);

  const deletePayment = useCallback(async (paymentId: string) => {
    await api.delete(`/payments/${paymentId}/`);
    await refreshData();
  }, [refreshData]);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/`, { read: true });
    await refreshData();
  }, [refreshData]);

  const deleteNotification = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}/`);
    await refreshData();
  }, [refreshData]);

  const clearAllNotifications = useCallback(async () => {
    // There's no bulk delete in default ViewSet, so we delete each
    await Promise.all(state.notifications.map(n => api.delete(`/notifications/${n.id}/`)));
    await refreshData();
  }, [state.notifications, refreshData]);

  return (
    <MockDataContext.Provider
      value={{
        state,
        refreshData,
        updateStudentStatus,
        addStudent,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        updateStudent,
        deleteStudent,
        assignTrainer,
        addZoom,
        updateZoom,
        deleteZoom,
        sendMessage,
        addMessage,
        markMessageRead,
        deleteMessage,
        deleteAllMessages,
        addPayment,
        deletePayment,
        uploadKbis,
        markNotificationRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
}
