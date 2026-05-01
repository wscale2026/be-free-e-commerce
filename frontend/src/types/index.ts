export type UserRole = 'student' | 'trainer' | 'admin';

export type StudentStatus = 'KBIS' | 'CIRE' | 'fournisseur' | 'site' | 'formation' | 'termine';

export type PaymentStatus = 'OK' | 'missed' | 'overdue';

export interface Student {
  id: string; // StudentProfile PK
  userId: string; // User ID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: StudentStatus;
  trainerId: string | null;
  paymentStatus: PaymentStatus;
  instalment2Paid: boolean;
  nextZoomDate: string | null;
  lastInteraction: string;
  totalDue: number;
  paidAmount: number;
  nextDueDate: string | null;
  engagementScore: number;
  progress: number;
  username?: string;
  password?: string;
  kbisFile?: string;
  hasBusiness?: string;
  currentOffer?: string;
  monthlyRevenue?: string;
  challenges?: string;
  notes?: string;
  formationType?: string;
  preferredSchedule?: string;
  experienceLevel?: string;
  has_business?: string; // Legacy support
  current_offer?: string; // Legacy support
  monthly_revenue?: string; // Legacy support
}

export interface Trainer {
  id: string; // TrainerProfile PK
  userId: string; // User ID
  firstName: string;
  lastName: string;
  email: string;
  assignedStudentIds: string[];
  specialty?: string;
  username?: string;
  password?: string;
}

export interface ZoomSession {
  id: string;
  date: string;
  time: string;
  link: string;
  trainerId: string;
  studentIds: string[];
  isRecurring: boolean;
  recurrenceRule: string | null;
  title: string;
}

export interface Message {
  id: string;
  fromStudentId: string;
  toTrainerId: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface KanbanColumn {
  id: StudentStatus;
  title: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'KBIS', title: 'KBIS' },
  { id: 'CIRE', title: 'CIRÉ' },
  { id: 'fournisseur', title: 'Fournisseur' },
  { id: 'site', title: 'Site' },
  { id: 'formation', title: 'Formation' },
  { id: 'termine', title: 'Terminé' },
];

export const STATUS_LABELS: Record<StudentStatus, string> = {
  KBIS: 'KBIS en cours',
  CIRE: 'CIRÉ en cours',
  fournisseur: 'Recherche fournisseur',
  site: 'Création site web',
  formation: 'Formation',
  termine: 'Terminé',
};
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
