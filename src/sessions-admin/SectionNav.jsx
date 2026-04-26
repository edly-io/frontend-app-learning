import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

const SECTIONS = [
  { slug: 'calendar', label: 'Calendar' },
  { slug: 'requests', label: 'Requests' },
  { slug: 'attendance', label: 'Attendance' },
];

const SectionNav = () => {
  const { programId } = useParams();

  return (
    <nav
      aria-label="Sessions admin sections"
      className="d-flex"
      style={{ gap: 4, borderBottom: '1px solid #dee2e6' }}
    >
      {SECTIONS.map(({ slug, label }) => (
        <NavLink
          key={slug}
          to={`/sessions/${programId}/${slug}`}
          className={({ isActive }) => [
            'px-3 py-2',
            'text-decoration-none',
            isActive ? 'text-primary font-weight-bold' : 'text-muted',
          ].join(' ')}
          style={({ isActive }) => ({
            borderBottom: isActive ? '2px solid #0d6efd' : '2px solid transparent',
            marginBottom: -1,
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default SectionNav;
