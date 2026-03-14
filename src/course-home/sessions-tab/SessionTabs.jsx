import React, { useState } from 'react';
import { Tabs, Tab } from '@openedx/paragon';
import SessionList from './SessionList';
import { useModel } from '../../generic/model-store';
import { useParams } from 'react-router-dom';

const SessionTabs = ({ courseId, refreshKey, onViewAttendance, onEditSession, onScheduleNew, onDeleteSuccess }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { courseId: paramCourseId } = useParams();
  const effectiveCourseId = courseId || paramCourseId;
  
  // Get course metadata to determine if user is instructor
  const courseHomeMetadata = useModel('courseHomeMeta', effectiveCourseId);
  const isInstructor = courseHomeMetadata?.isStaff || false;

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(key) => setActiveTab(key)}
      className="mb-3"
    >
      <Tab eventKey="upcoming" title="Upcoming Sessions">
        <SessionList
          courseId={effectiveCourseId}
          filter="upcoming"
          refreshKey={refreshKey}
          onViewAttendance={onViewAttendance}
          onEditSession={onEditSession}
          onScheduleNew={onScheduleNew}
          onDeleteSuccess={onDeleteSuccess}
          isInstructor={isInstructor}
        />
      </Tab>
      <Tab eventKey="past" title="Past Sessions">
        <SessionList
          courseId={effectiveCourseId}
          filter="past"
          refreshKey={refreshKey}
          onViewAttendance={onViewAttendance}
          onEditSession={onEditSession}
          onDeleteSuccess={onDeleteSuccess}
          isInstructor={isInstructor}
        />
      </Tab>
    </Tabs>
  );
};

export default SessionTabs;
