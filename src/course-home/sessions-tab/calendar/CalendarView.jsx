import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Card,
  StandardModal,
  OverlayTrigger,
  Popover,
} from '@openedx/paragon';
import {
  ChevronLeft, ChevronRight, Launch, Add, EditOutline, DeleteOutline,
} from '@openedx/paragon/icons';
import { bucketSessionsByDay, formatDateTime, getStatusVariant } from '../utils';
import { SESSION_STATUS_LABELS } from '../constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWS = { MONTH: 'month', WEEK: 'week', DAY: 'day' };

// Sun(0) first, matching JS getDay() order
const WEEK_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns a local date string YYYY-MM-DD for any Date object. */
const toDateKey = (date) => date.toLocaleDateString('en-CA');

/** Returns the Sunday that starts the week containing `date`. */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  d.setDate(d.getDate() - day); // shift back to Sunday
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

  // Extend grid to the Saturday that ends the week containing the last day
  // (weeks run Sun–Sat, so Saturday = getDay() 6 is the last column)
  const endDay = new Date(lastDay);
  const endDayOfWeek = endDay.getDay();
  const daysToSaturday = endDayOfWeek === 6 ? 0 : 6 - endDayOfWeek;
  endDay.setDate(endDay.getDate() + daysToSaturday);

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
  if (view === VIEWS.MONTH) { return monthYear; }
  if (view === VIEWS.DAY) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
    });
  }
  // Week
  const days = getWeekDays(date);
  const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
};

// ─── Shared style helpers ─────────────────────────────────────────────────────

const statusColors = {
  scheduled: '#0d6efd',
  in_progress: '#0a58ca',
  completed: '#198754',
  cancelled: '#dc3545',
};

// Weekend = Saturday (6) or Sunday (0) in JS getDay()
const isWeekendDay = (date) => date.getDay() === 0 || date.getDay() === 6;

const getCellBackground = (isToday, isWeekend) => {
  if (isToday) { return '#eef2ff'; } // soft indigo tint
  if (isWeekend) { return '#f8f8f8'; } // subtle grey for non-working days
  return '#fff';
};

// ─── SessionPopover ───────────────────────────────────────────────────────────
// Anchored to a chip. Shows session details and per-session actions.
// Wraps a trigger element; consumers pass the chip as a child button/span.

const formatTimeRange = (session) => {
  const start = new Date(session.scheduled_start_time);
  const startLabel = start.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  if (!session.scheduled_end_time) { return startLabel; }
  const end = new Date(session.scheduled_end_time);
  const endLabel = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
};

// Controlled popover — only one popover can be open across the whole calendar at
// any time, and it closes cleanly when Edit/Delete opens another modal.
const SessionPopover = ({
  session, children, isOpen, onOpenChange, onEdit, onDelete,
}) => {
  const statusLabel = SESSION_STATUS_LABELS[session.status] || session.status;

  const handleEdit = (e) => {
    e.stopPropagation();
    onOpenChange(false);
    onEdit(session);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onOpenChange(false);
    onDelete(session);
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    onOpenChange(false);
    window.open(session.meeting_join_url, '_blank', 'noopener,noreferrer');
  };

  const popover = (
    <Popover id={`session-popover-${session.id}`} style={{ maxWidth: 320 }}>
      <Popover.Title as="h5" style={{ fontSize: 14, margin: 0 }}>
        {session.title}
      </Popover.Title>
      <Popover.Content style={{ fontSize: 13 }}>
        {session.course_name && (
          <div className="text-muted mb-1">{session.course_name}</div>
        )}
        <div className="mb-1">{formatTimeRange(session)}</div>
        <div className="mb-2">
          <Badge variant={getStatusVariant(session.status)}>{statusLabel}</Badge>
        </div>
        <div className="d-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
          <Button variant="tertiary" size="sm" iconBefore={EditOutline} onClick={handleEdit}>
            Edit
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            iconBefore={DeleteOutline}
            onClick={handleDelete}
            style={{ color: '#dc3545' }}
          >
            Delete
          </Button>
          {session.meeting_join_url && (
            <Button variant="primary" size="sm" iconAfter={Launch} onClick={handleJoin}>
              Join
            </Button>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={isOpen}
      onToggle={(next) => onOpenChange(next)}
      trigger="click"
      placement="auto"
      rootClose
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};

// ─── DayCell (Month view only) ────────────────────────────────────────────────

const MAX_CHIPS = 2;

const DayCell = ({
  date, sessions = [], onClick, onEditSession, onDeleteSession,
  openPopoverId, setOpenPopoverId,
  isOutsideMonth = false, cellMinHeight = 110,
}) => {
  const today = toDateKey(new Date());
  const isToday = toDateKey(date) === today;
  const isWeekend = isWeekendDay(date);
  const visible = sessions.slice(0, MAX_CHIPS);
  const overflow = sessions.length - MAX_CHIPS;
  const handleCellKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(date, sessions);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(date, sessions)}
      onKeyDown={handleCellKey}
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

      {/* Session chips — each individually clickable, opens popover */}
      {visible.map((session) => (
        <SessionPopover
          key={session.id}
          session={session}
          isOpen={openPopoverId === session.id}
          onOpenChange={(next) => setOpenPopoverId((curr) => {
            if (next) { return session.id; }
            // Only clear if *this* popover is the one currently open — guards
            // against a stale rootClose clobbering a sibling that just opened.
            return curr === session.id ? null : curr;
          })}
          onEdit={onEditSession}
          onDelete={onDeleteSession}
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            title={session.title}
            style={{
              display: 'block',
              background: statusColors[session.status] || '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              fontSize: 11,
              padding: '1px 5px',
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {session.title}
          </button>
        </SessionPopover>
      ))}

      {/* Overflow badge */}
      {overflow > 0 && (
        <span style={{ fontSize: 11, color: '#6c757d', marginTop: 'auto' }}>
          +{overflow} more
        </span>
      )}
    </div>
  );
};

// ─── MonthGrid ────────────────────────────────────────────────────────────────

const MonthGrid = ({
  currentDate, sessionMap, onDayClick, onEditSession, onDeleteSession,
  openPopoverId, setOpenPopoverId,
}) => {
  const days = getMonthGridDays(currentDate);
  const currentMonth = currentDate.getMonth();

  return (
    <div style={{ border: '1px solid #dee2e6', borderRadius: 4, overflow: 'hidden' }}>
      {/* Day-name header row — matches week/day view style */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dee2e6',
        background: '#fff',
      }}
      >
        {WEEK_DAY_NAMES.map((name, idx) => {
          const isWeekend = idx === 0 || idx === 6; // Sun=0, Sat=6
          return (
            <div
              key={name}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: isWeekend ? '#adb5bd' : '#6c757d',
                borderLeft: idx === 0 ? 'none' : '1px solid #dee2e6',
              }}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* Day cells grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: 4,
      }}
      >
        {days.map((day) => (
          <DayCell
            key={toDateKey(day)}
            date={day}
            sessions={sessionMap.get(toDateKey(day)) || []}
            onClick={onDayClick}
            onEditSession={onEditSession}
            onDeleteSession={onDeleteSession}
            openPopoverId={openPopoverId}
            setOpenPopoverId={setOpenPopoverId}
            isOutsideMonth={day.getMonth() !== currentMonth}
            cellMinHeight={110}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Time Grid (Week and Day views) ──────────────────────────────────────────

const START_HOUR = 6; // 6 AM — earliest visible hour
const END_HOUR = 21; // 9 PM — latest visible hour
const HOUR_HEIGHT = 60; // px per hour
const TIME_COL_WIDTH = 52; // px — left time axis column
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const formatHour = (hour) => {
  if (hour === 0) { return '12 AM'; }
  if (hour < 12) { return `${hour} AM`; }
  if (hour === 12) { return '12 PM'; }
  return `${hour - 12} PM`;
};

/** Top offset and height (px) for a session block inside the time grid. */
const getSessionPosition = (session) => {
  const start = new Date(session.scheduled_start_time);
  const end = new Date(session.scheduled_end_time || session.scheduled_start_time);
  const startDec = start.getHours() + start.getMinutes() / 60;
  const endDec = end.getHours() + end.getMinutes() / 60;
  const top = (Math.max(startDec, START_HOUR) - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(
    (Math.min(endDec, END_HOUR) - Math.max(startDec, START_HOUR)) * HOUR_HEIGHT,
    22, // minimum block height so very short sessions remain clickable
  );
  return { top, height };
};

/**
 * Given the sessions for one day, returns a map of
 *   sessionId → { lane, totalLanes }
 * so overlapping sessions are rendered side-by-side.
 * Non-overlapping sessions always get full column width because totalLanes
 * reflects only the concurrent overlap depth at each session's own time slot.
 */
const layoutSessions = (sessions) => {
  if (sessions.length === 0) { return {}; }

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time),
  );

  // Greedy lane assignment — place each session in the earliest free lane
  const laneEndTimes = [];
  const sessionLane = {};

  for (const session of sorted) {
    const startMs = new Date(session.scheduled_start_time).getTime();
    const endMs = new Date(session.scheduled_end_time || session.scheduled_start_time).getTime();

    let lane = laneEndTimes.findIndex((endTime) => endTime <= startMs);
    if (lane === -1) {
      lane = laneEndTimes.length; // open a new lane
    }
    laneEndTimes[lane] = endMs;
    sessionLane[session.id] = lane;
  }

  // Per-session totalLanes = (max lane among concurrent sessions) + 1,
  // so isolated sessions expand to full width
  const result = {};
  for (const session of sorted) {
    const startMs = new Date(session.scheduled_start_time).getTime();
    const endMs = new Date(session.scheduled_end_time || session.scheduled_start_time).getTime();

    const concurrent = sorted.filter((other) => {
      const os = new Date(other.scheduled_start_time).getTime();
      const oe = new Date(other.scheduled_end_time || other.scheduled_start_time).getTime();
      return os < endMs && oe > startMs;
    });

    const maxLane = Math.max(...concurrent.map((s) => sessionLane[s.id]));
    result[session.id] = { lane: sessionLane[session.id], totalLanes: maxLane + 1 };
  }

  return result;
};

const TimeGrid = ({
  days, sessionMap, onEditSession, onDeleteSession,
  openPopoverId, setOpenPopoverId,
}) => {
  const todayKey = toDateKey(new Date());

  return (
    <div style={{ border: '1px solid #dee2e6', borderRadius: 4, overflow: 'hidden' }}>
      {/* Day header row */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dee2e6',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
      >
        {/* Empty corner above time axis */}
        <div style={{ width: TIME_COL_WIDTH, flexShrink: 0 }} />
        {days.map((day) => {
          const isToday = toDateKey(day) === todayKey;
          const isWeekend = isWeekendDay(day);
          return (
            <div
              key={toDateKey(day)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: isToday ? '#4f46e5' : isWeekend ? '#adb5bd' : '#6c757d',
                borderLeft: '1px solid #dee2e6',
              }}
            >
              {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: 'auto', maxHeight: 580 }}>
        <div style={{ display: 'flex', height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 14, paddingTop: 14 }}>

          {/* Time axis */}
          <div style={{ width: TIME_COL_WIDTH, flexShrink: 0, position: 'relative' }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{
                  position: 'absolute',
                  top: (hour - START_HOUR) * HOUR_HEIGHT - 7,
                  right: 6,
                  fontSize: 10,
                  color: '#9ca3af',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const key = toDateKey(day);
            const isToday = key === todayKey;
            const isWeekend = isWeekendDay(day);
            const daySessions = sessionMap.get(key) || [];
            const layout = layoutSessions(daySessions);

            return (
              <div
                key={key}
                style={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: '1px solid #dee2e6',
                  background: getCellBackground(isToday, isWeekend),
                }}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{
                      position: 'absolute',
                      top: (hour - START_HOUR) * HOUR_HEIGHT,
                      left: 0,
                      right: 0,
                      borderTop: '1px solid #e5e7eb',
                    }}
                  />
                ))}

                {/* Session blocks — each opens a popover with Edit/Delete/Join */}
                {daySessions.map((session) => {
                  const { top, height } = getSessionPosition(session);
                  const { lane, totalLanes } = layout[session.id] || { lane: 0, totalLanes: 1 };
                  const colWidthPct = (100 / totalLanes).toFixed(2);
                  const colLeftPct = ((lane / totalLanes) * 100).toFixed(2);
                  const bg = statusColors[session.status] || '#6c757d';
                  const startTime = new Date(session.scheduled_start_time)
                    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                  return (
                    <SessionPopover
                      key={session.id}
                      session={session}
                      isOpen={openPopoverId === session.id}
                      onOpenChange={(next) => setOpenPopoverId((curr) => {
                        if (next) { return session.id; }
                        return curr === session.id ? null : curr;
                      })}
                      onEdit={onEditSession}
                      onDelete={onDeleteSession}
                    >
                      <button
                        type="button"
                        title={`${session.title} — ${startTime}`}
                        style={{
                          position: 'absolute',
                          top,
                          left: `calc(${colLeftPct}% + 2px)`,
                          width: `calc(${colWidthPct}% - 4px)`,
                          height,
                          background: bg,
                          color: '#fff',
                          borderRadius: 3,
                          border: 'none',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          overflow: 'hidden',
                          zIndex: 1,
                          fontSize: 11,
                          lineHeight: 1.3,
                        }}
                      >
                        <strong style={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        >
                          {session.title}
                        </strong>
                        {/* Only show time label when block is tall enough */}
                        {height >= 30 && (
                          <span style={{ opacity: 0.85, fontSize: 10 }}>{startTime}</span>
                        )}
                      </button>
                    </SessionPopover>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

const WeekGrid = ({
  currentDate, sessionMap, onEditSession, onDeleteSession,
  openPopoverId, setOpenPopoverId,
}) => (
  <TimeGrid
    days={getWeekDays(currentDate)}
    sessionMap={sessionMap}
    onEditSession={onEditSession}
    onDeleteSession={onDeleteSession}
    openPopoverId={openPopoverId}
    setOpenPopoverId={setOpenPopoverId}
  />
);

// ─── DayView ──────────────────────────────────────────────────────────────────

const DayView = ({
  currentDate, sessionMap, onEditSession, onDeleteSession,
  openPopoverId, setOpenPopoverId,
}) => (
  <TimeGrid
    days={[currentDate]}
    sessionMap={sessionMap}
    onEditSession={onEditSession}
    onDeleteSession={onDeleteSession}
    openPopoverId={openPopoverId}
    setOpenPopoverId={setOpenPopoverId}
  />
);

// ─── SessionCard (used inside the day modal) ──────────────────────────────────

const SessionCard = ({
  session, onEdit, onDelete,
}) => {
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
          <div className="ml-3 d-flex flex-column align-items-end" style={{ flexShrink: 0, gap: 6 }}>
            <Badge variant={badgeVariant}>{statusLabel}</Badge>
            <div className="d-flex" style={{ gap: 4 }}>
              <IconButton
                src={EditOutline}
                iconAs={EditOutline}
                alt="Edit"
                size="sm"
                onClick={() => onEdit(session)}
              />
              <IconButton
                src={DeleteOutline}
                iconAs={DeleteOutline}
                alt="Delete"
                size="sm"
                variant="danger"
                onClick={() => onDelete(session)}
              />
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
        </div>
      </Card.Body>
    </Card>
  );
};

// ─── CalendarView ─────────────────────────────────────────────────────────────

const CalendarView = ({
  sessions, onScheduleNew, onEditSession, onDeleteSession,
}) => {
  const [view, setView] = useState(VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(null); // { date, sessions }
  // Only one popover open at a time; null = none. Chip clicks and outside
  // clicks flip this; Edit/Delete actions also reset it before bubbling up.
  const [openPopoverId, setOpenPopoverId] = useState(null);

  const sessionMap = bucketSessionsByDay(sessions);

  // ── Navigation ──
  const navigate = (direction) => {
    setOpenPopoverId(null);
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === VIEWS.MONTH) {
        d.setMonth(d.getMonth() + direction);
      } else if (view === VIEWS.WEEK) {
        d.setDate(d.getDate() + direction * 7);
      } else {
        d.setDate(d.getDate() + direction);
      }
      return d;
    });
  };

  const goToToday = () => {
    setOpenPopoverId(null);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
  };

  const handleViewChange = (nextView) => {
    setOpenPopoverId(null);
    setView(nextView);
  };

  // Month cell body click → day-detail modal (used for overflow / full-day browse)
  const handleDayClick = (date, daySessions) => {
    setOpenPopoverId(null);
    setSelectedDay({ date, sessions: daySessions });
  };

  // Edit/Delete from either popover or day-modal: always close both surfaces
  // before bubbling up, so the Schedule/confirm modal is the top-most view.
  const handleEdit = (session) => {
    setOpenPopoverId(null);
    setSelectedDay(null);
    onEditSession(session);
  };

  const handleDelete = (session) => {
    setOpenPopoverId(null);
    setSelectedDay(null);
    onDeleteSession(session);
  };

  const handleScheduleNew = () => {
    setOpenPopoverId(null);
    onScheduleNew();
  };

  const modalTitle = selectedDay
    ? selectedDay.date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    : '';

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="d-flex align-items-center flex-wrap mb-3" style={{ gap: 8 }}>
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

        <span style={{ fontWeight: 600, fontSize: 16, minWidth: 180 }}>
          {formatRangeLabel(view, currentDate)}
        </span>

        <Button variant="outline-primary" size="sm" onClick={goToToday}>
          Today
        </Button>

        {/* View toggles + New session — pushed to the right */}
        <div className="ml-auto d-flex align-items-center" style={{ gap: 4 }}>
          {Object.values(VIEWS).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleViewChange(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
          <Button
            variant="primary"
            size="sm"
            iconBefore={Add}
            onClick={handleScheduleNew}
            className="ml-2"
          >
            New session
          </Button>
        </div>
      </div>

      {/* ── Active view ── */}
      {view === VIEWS.MONTH && (
        <MonthGrid
          currentDate={currentDate}
          sessionMap={sessionMap}
          onDayClick={handleDayClick}
          onEditSession={handleEdit}
          onDeleteSession={handleDelete}
          openPopoverId={openPopoverId}
          setOpenPopoverId={setOpenPopoverId}
        />
      )}
      {view === VIEWS.WEEK && (
        <WeekGrid
          currentDate={currentDate}
          sessionMap={sessionMap}
          onEditSession={handleEdit}
          onDeleteSession={handleDelete}
          openPopoverId={openPopoverId}
          setOpenPopoverId={setOpenPopoverId}
        />
      )}
      {view === VIEWS.DAY && (
        <DayView
          currentDate={currentDate}
          sessionMap={sessionMap}
          onEditSession={handleEdit}
          onDeleteSession={handleDelete}
          openPopoverId={openPopoverId}
          setOpenPopoverId={setOpenPopoverId}
        />
      )}

      {/* ── Day modal (cell click / overflow) ── */}
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
                <SessionCard
                  key={session.id}
                  session={session}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </StandardModal>
      )}
    </div>
  );
};

export default CalendarView;
