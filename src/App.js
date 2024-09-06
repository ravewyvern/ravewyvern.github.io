import React, { useState } from 'react';
import Taskbar from './Taskbar';
import Window from './Window';
import Clock from './Clock';

function App() {
  const [windows, setWindows] = useState({ app1: false, app2: false });
  const [calendarVisible, setCalendarVisible] = useState(false);

  const toggleWindow = (app) => {
    setWindows({ ...windows, [app]: !windows[app] });
  };

  const toggleCalendar = () => {
    setCalendarVisible(!calendarVisible);
  };

  return (
    <div className="desktop">
      <Taskbar onClickIcon={toggleWindow} />
      <Clock toggleCalendar={toggleCalendar} />
      
      {/* Windows */}
      <Window isOpen={windows.app1} onClose={() => toggleWindow('app1')}>
        <h1>App 1 Content</h1>
      </Window>
      <Window isOpen={windows.app2} onClose={() => toggleWindow('app2')}>
        <h1>App 2 Content</h1>
      </Window>

      {/* Calendar and Social Media Section */}
      {calendarVisible && (
        <div className="calendar">
          <h1>Calendar</h1>
        </div>
      )}
    </div>
  );
}

export default App;
