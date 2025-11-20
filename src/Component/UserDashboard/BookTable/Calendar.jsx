import React, { useState } from 'react';
import './Calendar.css';
import { Container, Row, Col, Button } from 'react-bootstrap';

const Calendar = ({ selectedDate, onDateSelect, businessSettings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(newDate);
  };

  const getOperatingHours = (date) => {
    if (!businessSettings) return 'Loading...';

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
      return `${businessSettings.sunday_start.slice(0, 5)} - ${businessSettings.sunday_end.slice(0, 5)}`;
    } else if (dayOfWeek === 6) { // Saturday
      return `${businessSettings.saturday_start.slice(0, 5)} - ${businessSettings.saturday_end.slice(0, 5)}`;
    } else { // Weekday
      return `${businessSettings.weekdays_start.slice(0, 5)} - ${businessSettings.weekdays_end.slice(0, 5)}`;
    }
  };

  const renderDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();

      // Check if date is in the past
      const isPast = date < today && !isToday;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
          onClick={() => !isPast && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Container className="calendar-container shadow-sm p-3 rounded bg-white">
      <Row className="mb-3">
        <Col>
          <h5 className="fw-semibold">Select Date</h5>
        </Col>
        <Col className="me-5">
          <Button variant="light" onClick={prevMonth}>&lt;</Button>
          <strong>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</strong>
          <Button variant="light" onClick={nextMonth}>&gt;</Button>
        </Col>
      </Row>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={i} className="calendar-header">{day}</div>
        ))}
        {renderDays()}
      </div>

      {selectedDate && businessSettings && (
        <div className="mt-3 p-3 border rounded">
          <h6>Selected Date: {selectedDate.toLocaleDateString()}</h6>
          <p>
            <strong>Operating Hours:</strong> {getOperatingHours(selectedDate)}
          </p>
          <p className="mb-0">
            <small>Based on {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} schedule</small>
          </p>
        </div>
      )}

      {businessSettings && (
        <div className="mt-3">
          <h6>Business Hours Schedule:</h6>
          <ul className="mb-0">
            <li>Monday - Friday: {businessSettings.weekdays_start.slice(0, 5)} - {businessSettings.weekdays_end.slice(0, 5)}</li>
            <li>Saturday: {businessSettings.saturday_start.slice(0, 5)} - {businessSettings.saturday_end.slice(0, 5)}</li>
            <li>Sunday: {businessSettings.sunday_start.slice(0, 5)} - {businessSettings.sunday_end.slice(0, 5)}</li>
          </ul>
        </div>
      )}
    </Container>
  );
};

export default Calendar;