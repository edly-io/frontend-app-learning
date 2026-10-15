import React from 'react';
import { initializeTestStore, render, screen } from '../../setupTest';
import EnrollmentAlert from './EnrollmentAlert';

describe('EnrollmentAlert', () => {
  beforeAll(async () => {
    await initializeTestStore({ excludeFetchCourse: true, excludeFetchSequence: true });
  });

  it('shows the enrollment message without an enroll button for a learner', () => {
    render(<EnrollmentAlert payload={{ courseId: 'test-course-id', canEnroll: true, isStaff: false }} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('You must be enrolled in the course to see course content.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('appends the extra text for a learner', () => {
    render(<EnrollmentAlert payload={{ courseId: 'test-course-id', extraText: 'Contact support.' }} />);
    expect(screen.getByText('You must be enrolled in the course to see course content. Contact support.')).toBeInTheDocument();
  });

  it('shows the staff message without an enroll button for staff', () => {
    render(<EnrollmentAlert payload={{ courseId: 'test-course-id', canEnroll: true, isStaff: true }} />);
    expect(screen.getByText('You are viewing this course as staff, and are not enrolled.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
