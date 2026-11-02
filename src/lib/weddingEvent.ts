// The wedding day as a calendar entry: shared by the countdown, the Google Calendar link and the .ics download.
// One entry from the akad to the end of the resepsi (WIB = UTC+7); the separate times are in the details.
export const WEDDING_START = new Date("2026-12-05T16:00:00+07:00");
export const WEDDING_END = new Date("2026-12-05T21:00:00+07:00");

export const WEDDING_TITLE = "Pernikahan Nadia & Jorgi";
export const WEDDING_LOCATION =
  "Menara BP Jamsostek Lantai 9, Jl. Gatot Subroto No.38, Kuningan Bar., Kec. Mampang Prpt., Kota Jakarta Selatan 12710";
export const WEDDING_DETAILS = [
  "Akad: 16.00 - 17.00 WIB",
  "Resepsi: 19.00 - 21.00 WIB",
  "Google Maps: https://maps.app.goo.gl/TqZF9EDk8qnzkE7JA",
];

// 20261205T090000Z
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const googleCalendarUrl = () =>
  "https://calendar.google.com/calendar/render?" +
  new URLSearchParams({
    action: "TEMPLATE",
    text: WEDDING_TITLE,
    dates: `${utcStamp(WEDDING_START)}/${utcStamp(WEDDING_END)}`,
    details: WEDDING_DETAILS.join("\n"),
    location: WEDDING_LOCATION,
    ctz: "Asia/Jakarta",
  });

// iCalendar text values escape backslashes, commas, semicolons and newlines
const icsText = (value: string) => value.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

// Lines longer than 75 octets are folded (continuation lines start with a space)
const fold = (line: string) => {
  const parts: string[] = [];
  for (let rest = line; rest.length > 0; rest = rest.slice(73)) parts.push(rest.slice(0, 73));
  return parts.join("\r\n ");
};

export const weddingIcs = () =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nadia & Jorgi//Undangan//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:wedding-nadia-jorgi-20261205@nadia-jorgi-wedding.vercel.app",
    `DTSTAMP:${utcStamp(new Date("2026-11-01T00:00:00Z"))}`,
    `DTSTART:${utcStamp(WEDDING_START)}`,
    `DTEND:${utcStamp(WEDDING_END)}`,
    `SUMMARY:${icsText(WEDDING_TITLE)}`,
    `LOCATION:${icsText(WEDDING_LOCATION)}`,
    `DESCRIPTION:${icsText(WEDDING_DETAILS.join("\n"))}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(`Besok: ${WEDDING_TITLE}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n") + "\r\n";
