const TZ = "Asia/Riyadh";

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium" });
// Date-only database columns (no time) are midnight UTC, so format them in UTC to avoid showing the wrong day.
const dateOnlyFmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

export const formatDateTime = (value: string) => dateTimeFmt.format(new Date(value));
export const formatDate = (value: string) => dateFmt.format(new Date(value));
export const formatDateOnly = (value: string) => dateOnlyFmt.format(new Date(value));