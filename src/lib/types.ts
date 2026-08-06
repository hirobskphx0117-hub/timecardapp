export type PunchType = "clock_in" | "break_start" | "break_end" | "clock_out";

export type Punch = {
  id: number;
  type: PunchType;
  time: number;
};

export type Status = "before_work" | "working" | "on_break" | "done";

export type Staff = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};
