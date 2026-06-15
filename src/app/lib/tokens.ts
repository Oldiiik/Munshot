export const C = {
  bg: "#FFF7F8",
  pink: "#F7B6C8",
  rose: "#D96C8A",
  clay: "#B9858F",
  cream: "#FFF1E8",
  border: "#E8C9D0",
  ink: "#171112",
  paper: "#FFFFFF",
};

export const TXT = { fontWeight: 400, fontStyle: "normal" as const, letterSpacing: "-0.01em" };
export const DISPLAY = { fontWeight: 300, fontStyle: "normal" as const, letterSpacing: "-0.04em", lineHeight: 0.92 };
export const MONO = { fontWeight: 400, letterSpacing: "0.22em", fontSize: 11 } as const;

export const stroke = `1.5px solid ${C.ink}`;
export const hair = `1px solid ${C.border}`;
