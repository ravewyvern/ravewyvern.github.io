import React, { useState, useEffect } from 'react';

const Clock = ({ toggleCalendar }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock" onClick={toggleCalendar}>
      {time.toLocaleTimeString()} {time.toLocaleDateString()}
    </div>
  );
};

export default Clock;
