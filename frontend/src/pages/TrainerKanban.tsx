import { useState, useMemo, useRef } from 'react';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  MouseSensor, TouchSensor, useSensor, useSensors, type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box, Card, CardContent, Typography, Chip, IconButton,
  Avatar, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  DragHandle, CalendarMonth, Chat, Videocam, UploadFile, CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import { KANBAN_COLUMNS, STATUS_LABELS } from '@/types';
import type { Student, StudentStatus, ZoomSession } from '@/types';

// Sortable Student Card
function StudentKanbanCard({
  student,
  nextZoomDate,
  onMessageClick,
  onUploadKbis,
  onZoomClick,
}: {
  student: Student;
  nextZoomDate?: string | null;
  onMessageClick: (student: Student) => void;
  onUploadKbis: (student: Student) => void;
  onZoomClick: (student: Student) => void;
}) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: student.id, data: { student } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const zoomBadge = nextZoomDate
    ? `Zoom • ${new Date(nextZoomDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        borderRadius: 1,
        border: isDragging ? `2px solid ${theme.palette.primary.main}` : undefined,
        boxShadow: isDragging
          ? '0 20px 40px rgba(0,0,0,0.15)'
          : `0 4px 12px ${alpha(theme.palette.text.primary, 0.03)}`,
        '&:hover': {
          borderColor: isDragging ? undefined : 'primary.main',
          transform: isDragging ? undefined : 'translateY(-2px)',
        },
        transition: 'transform 0.2s, box-shadow 0.2s',
        touchAction: 'none', // Crucial for mobile drag
      }}
      {...attributes}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="labelLarge" sx={{ display: 'block', mb: 0.2 }}>
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary' }} noWrap>
              {student.email}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{ 
                color: 'text.disabled', 
                p: 0.5, 
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) },
                touchAction: 'none',
            }}
            {...listeners}
          >
            <DragHandle sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Badges */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {zoomBadge && (
            <Chip
              icon={<Videocam sx={{ fontSize: 14 }} />}
              label={zoomBadge}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontSize: '11px',
                fontWeight: 700,
                height: 22,
              }}
            />
          )}
          {(student.paymentStatus === 'overdue' || student.paymentStatus === 'missed') && (
            <Chip
              label="Retard Paiement"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main',
                fontSize: '11px',
                fontWeight: 700,
                height: 22,
              }}
            />
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="labelSmall" sx={{ color: 'text.disabled' }}>
              {student.lastInteraction}
          </Typography>
          <Box sx={{ display: 'flex' }}>

            <IconButton 
                size="small" 
                sx={{ color: 'text.secondary' }}
                onClick={() => onZoomClick(student)}
                title="Planifier un Zoom"
            >
                <CalendarMonth sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Kanban Column
function KanbanColumn({
  column,
  students,
  onMessageClick,
  onUploadKbis,
  onZoomClick,
  zoomSessions,
}: {
  column: { id: StudentStatus; title: string };
  students: Student[];
  onMessageClick: (student: Student) => void;
  onUploadKbis: (student: Student) => void;
  onZoomClick: (student: Student) => void;
  zoomSessions: ZoomSession[];
}) {
  const theme = useTheme();
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: { xs: 280, sm: 320, md: 360 },
        maxWidth: { xs: 300, sm: 360 },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        transition: 'all 0.2s ease',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="titleMedium" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {column.title}
            </Typography>
        </Box>
        <Chip
          label={students.length}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            color: 'primary.main',
            fontSize: '12px',
            fontWeight: 800,
            height: 24,
            px: 0.5,
          }}
        />
      </Box>

      {/* Column Body */}
      <Box
        sx={{
          p: 2,
          flex: 1,
          overflowY: 'auto',
          minHeight: 400,
          maxHeight: 'calc(100vh - 280px)',
        }}
      >
        <SortableContext
          items={students.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {students.map((student) => {
            const mySessions = zoomSessions.filter(z => z.studentIds.includes(student.userId));
            const upcoming = mySessions
              .filter(z => new Date(z.date).getTime() >= new Date().setHours(0,0,0,0))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const nextZoom = upcoming.length > 0 ? upcoming[0].date : null;

            return (
              <StudentKanbanCard
                key={student.id}
                student={student}
                nextZoomDate={nextZoom}
                onMessageClick={onMessageClick}
                onUploadKbis={onUploadKbis}
                onZoomClick={onZoomClick}
              />
            );
          })}
        </SortableContext>
        {students.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 120,
              color: 'text.disabled',
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 4,
              m: 1,
            }}
          >
            <Typography variant="bodySmall" sx={{ fontWeight: 600 }}>
              Déposez un élève ici
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function TrainerKanban() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const { state, updateStudentStatus, uploadKbis } = useMockData();
  const { showSnackbar } = useSnackbar();
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    studentId: string;
    newStatus: StudentStatus;
    studentName: string;
    columnTitle: string;
  }>({ open: false, studentId: '', newStatus: 'KBIS', studentName: '', columnTitle: '' });
  const [filterChip, setFilterChip] = useState<string>('all');
  
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadStudentId, setUploadStudentId] = useState<string | null>(null);

  const trainerStudents = useMemo(() => {
    if (!user) return [];
    return state.students.filter((s) => s.trainerId === user.id);
  }, [state.students, user]);

  const filteredStudents = useMemo(() => {
    switch (filterChip) {
      case 'zoom':
        return trainerStudents.filter((s) => 
            state.zoomSessions.some(z => z.studentIds.includes(s.userId))
        );
      case 'overdue':
        return trainerStudents.filter((s) => s.paymentStatus === 'overdue' || s.paymentStatus === 'missed');
      case 'message':
        return trainerStudents.filter((s) => {
          const msgs = state.messages.filter(
            (m) => m.fromStudentId === s.userId && !m.read
          );
          return msgs.length > 0;
        });
      default:
        return trainerStudents;
    }
  }, [trainerStudents, filterChip, state.messages, state.zoomSessions]);

  const studentsByColumn = useMemo(() => {
    const map: Record<string, Student[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      map[col.id] = filteredStudents.filter((s) => s.status === col.id);
    });
    return map;
  }, [filteredStudents]);

  // Enhanced Sensors for Mobile
  const sensors = useSensors(
    useSensor(MouseSensor, {
        activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
        activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const student = state.students.find((s) => s.id === active.id);
    if (student) {
        setActiveStudent(student);
        // Haptic feedback if available
        if (window.navigator.vibrate) window.navigator.vibrate(50);
    }
  };

  const handleFileChange = async (event: any) => {
    const file = event.target.files?.[0];
    if (file && uploadStudentId) {
        try {
            await uploadKbis(uploadStudentId, file);
            showSnackbar('Fichier KBIS uploadé avec succès.', 'success');
        } catch (error) {
            showSnackbar("Erreur lors de l'upload du fichier.", 'error');
        }
    }
    if (fileRef.current) fileRef.current.value = '';
    setUploadStudentId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStudent(null);
    if (!over) return;

    const studentId = active.id as string;
    const overId = over.id as string;

    const processMove = (student: Student, targetStatus: StudentStatus, targetTitle: string) => {
        if (student.paidAmount < 1000) {
            showSnackbar('Ce client doit avoir payé au moins 1000 € pour avancer.', 'error');
            return;
        }
        if (student.status !== targetStatus) {
            setConfirmDialog({
                open: true,
                studentId: student.id,
                newStatus: targetStatus,
                studentName: `${student.firstName} ${student.lastName}`,
                columnTitle: targetTitle,
            });
        }
    };

    const column = KANBAN_COLUMNS.find((c) => c.id === overId);
    if (column) {
      const student = state.students.find((s) => s.id === studentId);
      if (student) processMove(student, column.id, STATUS_LABELS[column.id]);
      return;
    }

    const targetStudent = state.students.find((s) => s.id === overId);
    if (targetStudent && targetStudent.id !== studentId) {
      const student = state.students.find((s) => s.id === studentId);
      if (student) processMove(student, targetStudent.status, STATUS_LABELS[targetStudent.status]);
    }
  };

  const handleConfirmMove = () => {
    updateStudentStatus(confirmDialog.studentId, confirmDialog.newStatus);
    showSnackbar(`${confirmDialog.studentName} déplacé vers "${confirmDialog.columnTitle}"`, 'success');
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <PageHeader 
            title="Parcours pédagogique"
            subtitle="Gérez l'avancement de vos eleves en glissant leurs carte"
            breadcrumbs={[{ label: 'Responsable' }, { label: 'Tableau de bord' }]}
            action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {['all', 'zoom', 'overdue'].map((f) => (
                        <Button
                            key={f}
                            size="small"
                            variant={filterChip === f ? 'contained' : 'outlined'}
                            onClick={() => setFilterChip(f)}
                            sx={{ borderRadius: '8px', px: 2, fontWeight: 700 }}
                        >
                            {f === 'all' ? 'Tous' : f === 'zoom' ? 'Zoom' : 'Retard'}
                        </Button>
                    ))}
                </Box>
            }
        />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ 
            display: 'flex', 
            gap: { xs: 2, md: 3 }, 
            overflowX: 'auto', 
            pb: 4, 
            flex: 1, 
            px: 0.5,
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: 4 }
        }}>
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              students={studentsByColumn[column.id] || []}
              onMessageClick={(student) => navigate(`/messages?compose=${student.userId}`)}
              onZoomClick={(student) => navigate('/zoom')}
              onUploadKbis={(student) => {
                  setUploadStudentId(student.id);
                  fileRef.current?.click();
              }}
              zoomSessions={state.zoomSessions}
            />
          ))}
        </Box>
        <input 
            type="file" 
            ref={fileRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
        />

        <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeStudent ? (
            <Card
              sx={{
                width: 300,
                borderRadius: 4,
                boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                transform: 'rotate(2deg) scale(1.05)',
                opacity: 0.9,
                border: `2px solid ${theme.palette.primary.main}`,
                cursor: 'grabbing',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '13px' }}>
                    {activeStudent.firstName?.[0] || ''}{activeStudent.lastName?.[0] || ''}
                  </Avatar>
                  <Typography variant="labelLarge" noWrap>
                    {activeStudent.firstName} {activeStudent.lastName}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px' } } }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pt: 3 }}>
          Confirmer le déplacement ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '15px' }}>
            Voulez-vous déplacer <strong>{confirmDialog.studentName}</strong> vers l'étape{" "}
            <strong>"{confirmDialog.columnTitle}"</strong> ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleConfirmMove} sx={{ px: 3 }}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
