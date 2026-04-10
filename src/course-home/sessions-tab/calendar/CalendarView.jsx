import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Card,
  StandardModal,
} from '@openedx/paragon';
import { ChevronLeft, ChevronRight, Launch } from '@openedx/paragon/icons';
import { bucketSessionsByDay, formatDateTime, getStatusVariant } from '../utils';
import { SESSION_STATUS_LABELS } from '../constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWS = { MONTH: 'month', WEEK: 'week', DAY: 'day' };

// Mon(1)…Sun(0) → reorder so Monday=0, Sunday=6
const WEEK_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns a local date string YYYY-MM-DD for any Date object. */
const toDateKey = (date) => date.toLocaleDateString('en-CA');

/** Returns the Monday that starts the ISO week containing `date`. */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Returns an array of 7 Date objects for Mon–Sun of the week containing `date`. */
const getWeekDays = (date) => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
};

/** Returns all Date objects for the 4–6 week grid rows of a month view. */
const getMonthGridDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const gridStart = getWeekStart(firstDay);

  // Extend grid to cover the full week containing the last day
  const endDay = new Date(lastDay);
  const endDayOfWeek = endDay.getDay();
  const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  endDay.setDate(endDay.getDate() + daysToSunday);

  const days = [];
  const cursor = new Date(gridStart);
  while (cursor <= endDay) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

/** Formats a date range label for the toolbar. */
const formatRangeLabel = (view, date) => {
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (view === VIEWS.MONTH) return monthYear;
  if (view === VIEWS.DAY) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
  // Week
  const days = getWeekDays(date);
  const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
};

// ─── DayCell ──────────────────────────────────────────────────────────────────

const MAX_CHIPS = 2;

const statusColors = {
  scheduled: '#0d6efd',
  in_progress: '#0a58ca',
  completed: '#198754',
  cancelled: '#dc3545',
};

// Weekend = Saturday (6) or Sunday (0) in JS getDay()
const isWeekendDay = (date) => date.getDay() === 0 || date.getDay() === 6;

const getCellBackground = (isToday, isWeekend) => {
  if (isToday) return '#eef2ff'; // soft indigo tint — stands out without clashing
  if (isWeekend) return '#f8f8f8'; // subtle grey for non-working days
  return '#fff';
};

const DayCell = ({
  date, sessions = [], onClick, isOutsideMonth = false, cellMinHeight = 110,
}) => {
  const today = toDateKey(new Date());
  const isToday = toDateKey(date) === today;
  const isWeekend = isWeekendDay(date);
  const visible = sessions.slice(0, MAX_CHIPS);
  const overflow = sessions.length - MAX_CHIPS;

  return (
    <button
      type="button"
      onClick={() => onClick(date, sessions)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minHeight: cellMinHeight,
        border: '1px solid #dee2e6',
        borderRadius: 4,
        padding: '4px 6px',
        background: getCellBackground(isToday, isWeekend),
        cursor: 'pointer',
        textAlign: 'left',
        opacity: isOutsideMonth ? 0.4 : 1,
        width: '100%',
      }}
      aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
    >
      {/* Day number */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          fontSize: 13,
          fontWeight: isToday ? 700 : 400,
          background: isToday ? '#0d6efd' : 'transparent',
          color: isToday ? '#fff' : 'inherit',
          marginBottom: 4,
          flexShrink: 0,
        }}
      >
        {date.getDate()}
      </span>

      {/* Session chips */}
      {visible.map((session) => (
        <span
          key={session.id}
          style={{
            display: 'block',
            background: statusColors[session.status] || '#6c757d',
            color: '#fff',
            borderRadius: 3,
            fontSize: 11,
            padding: '1px 5px',
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={session.title}
        >
          {session.title}
        </span>
      ))}

      {/* Overflow badge */}
      {overflow > 0 && (
        <span style={{ fontSize: 11, color: '#6c757d', marginTop: 'auto' }}>
          +{overflow} more
        </span>
      )}
    </button>
  );
};

// ─── MonthGrid ────────────────────────────────────────────────────────────────

const MonthGrid = ({ currentDate, sessionMap, onDayClick }) => {
  const days = getMonthGridDays(currentDate);
  const currentMonth = currentDate.getMonth();

  return (
    <div>
      {/* Day-name header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEK_DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#6c757d',
              padding: '4px 0',
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day) => (
          <DayCell
            key={toDateKey(day)}
            date={day}
            sessions={sessionMap.get(toDateKey(day)) || []}
            onClick={onDayClick}
            isOutsideMonth={day.getMonth() !== currentMonth}
            cellMinHeight={110}
          />
        ))}
      </div>
    </div>
  );
};

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

const WeekGrid = ({ currentDate, sessionMap, onDayClick }) => {
  const days = getWeekDays(currentDate);
  const todayKey = toDateKey(new Date());

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
      {days.map((day, i) => {
        const isToday = toDateKey(day) === todayKey;
        const isWeekend = isWeekendDay(day);
        return (
          <div key={toDateKey(day)}>
            {/* Column header */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                // Today → blue; Weekend → muted grey; Weekday → normal grey
                color: isToday ? '#4f46e5' : isWeekend ? '#adb5bd' : '#6c757d',
                padding: '4px 0 6px',
              }}
            >
              {WEEK_DAY_NAMES[i]} {day.getDate()}
            </div>
            <DayCell
              date={day}
              sessions={sessionMap.get(toDateKey(day)) || []}
              onClick={onDayClick}
              cellMinHeight={200}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── SessionCard (shared by DayView and Modal) ────────────────────────────────

const SessionCard = ({ session }) => {
  const statusLabel = SESSION_STATUS_LABELS[session.status] || session.status;
  const badgeVariant = getStatusVariant(session.status);

  return (
    <Card className="mb-3">
      <Card.Body style={{ padding: '1rem' }}>
        <div className="d-flex justify-content-between align-items-start">
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong className="d-block">{session.title}</strong>
            <small className="text-muted">{session.course_name}</small>
            <div className="mt-1" style={{ fontSize: 13 }}>
              {formatDateTime(session.scheduled_start_time)}
              {session.scheduled_end_time && (
                <> – {new Date(session.scheduled_end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
              )}
            </div>
          </div>
          <div className="ml-3 d-flex flex-column align-items-end" style={{ flexShrink: 0 }}>
            <Badge variant={badgeVariant} className="mb-2">{statusLabel}</Badge>
            {session.meeting_join_url && (
              <Button
                variant="primary"
                size="sm"
                iconAfter={Launch}
                onClick={() => window.open(session.meeting_join_url, '_blank', 'noopener,noreferrer')}
              >
                Join
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// ─── DayView ──────────────────────────────────────────────────────────────────

const DayView = ({ currentDate, sessionMap }) => {
  const sessions = sessionMap.get(toDateKey(currentDate)) || [];
  const label = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <h5 className="mb-3">{label}</h5>
      {sessions.length === 0 ? (
        <p className="text-muted text-center py-5">No sessions scheduled for this day.</p>
      ) : (
        sessions.map((session) => <SessionCard key={session.id} session={session} />)
      )}
    </div>
  );
};

// ─── CalendarView ─────────────────────────────────────────────────────────────

const CalendarView = ({ sessions }) => {
  const [view, setView] = useState(VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(null); // { date, sessions }

  const sessionMap = bucketSessionsByDay(sessions);

  // ── Navigation ──
  const navigate = (direction) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === VIEWS.MONTH) d.setMonth(d.getMonth() + direction);
      else if (view === VIEWS.WEEK) d.setDate(d.getDate() + direction * 7);
      else d.setDate(d.getDate() + direction);
      return d;
    });
  };

  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
  };

  // ── Day cell click ──
  const handleDayClick = (date, daySessions) => {
    if (view === VIEWS.DAY) return; // Day view shows inline; no modal needed
    setSelectedDay({ date, sessions: daySessions });
  };

  const modalTitle = selectedDay
    ? selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="d-flex align-items-center flex-wrap mb-3" style={{ gap: 8 }}>
        {/* Prev / Next */}
        <IconButton
          src={ChevronLeft}
          iconAs={ChevronLeft}
          alt="Previous"
          onClick={() => navigate(-1)}
          size="sm"
        />
        <IconButton
          src={ChevronRight}
          iconAs={ChevronRight}
          alt="Next"
          onClick={() => navigate(1)}
          size="sm"
        />

        {/* Range label */}
        <span style={{ fontWeight: 600, fontSize: 16, minWidth: 180 }}>
          {formatRangeLabel(view, currentDate)}
        </span>

        {/* Today */}
        <Button variant="outline-primary" size="sm" onClick={goToToday}>
          Today
        </Button>

        {/* View toggles — pushed to the right */}
        <div className="ml-auto d-flex" style={{ gap: 4 }}>
          {Object.values(VIEWS).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Active view ── */}
      {view === VIEWS.MONTH && (
        <MonthGrid currentDate={currentDate} sessionMap={sessionMap} onDayClick={handleDayClick} />
      )}
      {view === VIEWS.WEEK && (
        <WeekGrid currentDate={currentDate} sessionMap={sessionMap} onDayClick={handleDayClick} />
      )}
      {view === VIEWS.DAY && (
        <DayView currentDate={currentDate} sessionMap={sessionMap} />
      )}

      {/* ── Day modal (Month + Week views) ── */}
      {selectedDay && (
        <StandardModal
          isOpen
          onClose={() => setSelectedDay(null)}
          title={`Sessions — ${modalTitle}`}
          size="lg"
        >
          {selectedDay.sessions.length === 0 ? (
            <p className="text-muted text-center py-3">No sessions on this day.</p>
          ) : (
            <div className="pt-2">
              {selectedDay.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </StandardModal>
      )}
    </div>
  );
};

export default CalendarView;
