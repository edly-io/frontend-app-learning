export const ATTENDANCE_STATUS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  left_early: 'Left Early',
  partial: 'Partial Attendance',
};

// Labels for Session.status field (distinct from AttendanceRecord.status)
export const SESSION_STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
