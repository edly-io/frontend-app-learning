import { injectIntl } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import React from 'react';

const SidebarTriggerBase = ({
  onClick,
  ariaLabel,
  children,
}) => (
  <button
    className="bg-transparent align-items-center align-content-center d-flex sidebar-trigger-button"
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
  >
    <div className="icon-container d-flex position-relative align-items-center">
      {children}
    </div>
  </button>
);

SidebarTriggerBase.propTypes = {
  onClick: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
};

export default injectIntl(SidebarTriggerBase);
