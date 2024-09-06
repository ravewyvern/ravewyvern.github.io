import React from 'react';

const Taskbar = ({ onClickIcon }) => {
  return (
    <div className="taskbar">
      <button onClick={() => onClickIcon('app1')}>App 1</button>
      <button onClick={() => onClickIcon('app2')}>App 2</button>
      {/* Add more buttons as needed */}
    </div>
  );
};

export default Taskbar;
