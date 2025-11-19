import React from 'react';
import './MobileNotice.css';
import DrawIcon from '../draw.svg?raw';

const MobileNotice = () => {
  return (
    <div className="mobile-notice">
      <div className="mobile-notice-content">
        <div className="mobile-notice-logo">
          <div 
            className="mobile-notice-icon"
            dangerouslySetInnerHTML={{ __html: DrawIcon }}
          />
          <h1 className="mobile-notice-title">WAVER</h1>
        </div>
        
        <h2 className="mobile-notice-heading">Looks like you're on mobile!</h2>
        
        <p className="mobile-notice-text">
          Waver works best on desktop at the moment, so we'd love for you to check it out there. Thanks for your patience!
        </p>
      </div>
    </div>
  );
};

export default MobileNotice;


