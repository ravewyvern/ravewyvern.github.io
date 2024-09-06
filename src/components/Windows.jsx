import React, { useState } from 'react';
import Rnd from 'react-rnd'; // Make sure to install this via npm

const Window = ({ isOpen, onClose, children }) => {
  return (
    isOpen && (
      <Rnd
        className="window"
        default={{
          x: 100,
          y: 100,
          width: 320,
          height: 200,
        }}
      >
        <div className="window-header">
          <button onClick={onClose}>X</button>
        </div>
        <div className="window-content">{children}</div>
      </Rnd>
    )
  );
};

export default Window;
