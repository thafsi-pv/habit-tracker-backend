"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCalendarDate = parseCalendarDate;
exports.formatCalendarDate = formatCalendarDate;
exports.todayInTimezone = todayInTimezone;
exports.addDays = addDays;
function parseCalendarDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
function formatCalendarDate(date) {
    return date.toISOString().slice(0, 10);
}
function todayInTimezone(timezone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(new Date());
}
function addDays(dateStr, days) {
    const d = parseCalendarDate(dateStr);
    d.setUTCDate(d.getUTCDate() + days);
    return formatCalendarDate(d);
}
//# sourceMappingURL=date.util.js.map