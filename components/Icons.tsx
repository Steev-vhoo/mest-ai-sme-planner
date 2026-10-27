type P = { size?: number };
const base = (size = 24) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const FormIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6v2H9zM8.5 10h7M8.5 14h7M8.5 18h4" /></svg>
);
export const SparkIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
);
export const MailIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" /></svg>
);
export const LedgerIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /><path d="M16 15.5l1 1 2-2" /></svg>
);
export const MegaphoneIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M3 11v3a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" /><path d="M14 8.5a5 5 0 010 7M17 6a8.5 8.5 0 010 12" /></svg>
);
export const ChatIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M20 12a8 8 0 01-11.6 7.1L4 20l1-4A8 8 0 1120 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></svg>
);
export const ClockIcon = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const CalendarIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const PinIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 1114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const CheckIcon = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
