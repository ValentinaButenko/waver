import React, { useState, useEffect } from 'react';
import { X, Copy, CheckSquare } from 'phosphor-react';
import './AboutModal.css';

const AboutModal = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText('uxcoffeetime@gmail.com');
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h1>About</h1>
          <button className="modal-close-button" onClick={onClose}>
            <X size={24} weight="regular" color="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>
        <div className="modal-body">
          <p>
            Waver is a vibe-coded design tool that helps you create unique SVG and PNG assets 
            for your website, social media, blog posts, posters, and more.
          </p>
          <p>
            If you enjoy using Waver, have questions, or spot a bug, feel free to leave us a 
            message at <strong>uxcoffeetime@gmail.com</strong>
            {isCopied ? (
              <CheckSquare 
                size={24} 
                weight="regular" 
                className="copy-icon copied"
              />
            ) : (
              <Copy 
                size={24} 
                weight="regular" 
                className="copy-icon"
                onClick={copyEmail}
              />
            )} - we'd love to hear from you!
          </p>
          <div className="modal-divider"></div>
          <p className="modal-footer-text">
            Waver is made with ♥ by<br />
            <a href="https://www.linkedin.com/in/duskdb" target="_blank" rel="noopener noreferrer" className="author-link">Dmytro Butenko</a> and <a href="https://www.linkedin.com/in/valentinabutenko" target="_blank" rel="noopener noreferrer" className="author-link">Valentyna Butenko</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;

