/**
 * 📅 Calendar Sync Utilities for GSFC Placement Portal
 * Supports 1-Click Google Calendar creation and standard RFC 5545 iCalendar (.ics) download
 */

// Helper to format Date to ISO 8601 UTC string without hyphens/colons (YYYYMMDDTHHmmssZ)
export function formatCalendarDate(date) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate Google Calendar Direct Add URL
 */
export function generateGoogleCalendarUrl({ title, description = '', location = 'GSFC University Campus / Online Portal', startTime, endTime, durationMinutes = 60 }) {
  const start = startTime ? new Date(startTime) : new Date();
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startFormatted = formatCalendarDate(start);
  const endFormatted = formatCalendarDate(end);

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title || 'GSFC Placement Drive Event',
    dates: `${startFormatted}/${endFormatted}`,
    details: `${description}\n\n🏛️ Organized by GSFC University Training & Placement Cell\n🔗 Access Portal: https://gsfc-placement-analyzer.vercel.app`,
    location: location || 'GSFC University, Vadodara / Online WebRTC Meeting'
  });

  return `${base}&${params.toString()}`;
}

/**
 * Generate RFC 5545 iCalendar (.ics) File Content & Trigger Browser Download
 */
export function downloadIcsFile({ title, description = '', location = 'GSFC University Campus', startTime, endTime, durationMinutes = 60, fileName }) {
  const start = startTime ? new Date(startTime) : new Date();
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startStr = formatCalendarDate(start);
  const endStr = formatCalendarDate(end);
  const nowStr = formatCalendarDate(new Date());
  const uid = `gsfc-event-${Date.now()}@gsfcuniversity.ac.in`;

  const cleanTitle = (title || 'GSFC Placement Drive').replace(/\n/g, ' ');
  const cleanDesc = (description || 'GSFC University Placement Drive Event').replace(/\n/g, '\\n');
  const cleanLoc = (location || 'GSFC University Campus, Vadodara').replace(/\n/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GSFC University//CampusHire AI Placement Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}\\n\\nOrganized by GSFC University TPC`,
    `LOCATION:${cleanLoc}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming GSFC Placement Event in 24 hours',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: GSFC Placement Event starting in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (fileName || `GSFC_${cleanTitle.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_Event.ics`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
