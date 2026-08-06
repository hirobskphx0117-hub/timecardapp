import { ensureSchema, getDb } from "./db";
import type { Punch, PunchType, Staff } from "./types";

type StaffRow = {
  id: number;
  code: string;
  name: string;
  active: number;
};

type PunchRow = {
  id: number;
  type: string;
  time: number;
};

function toStaff(row: StaffRow): Staff {
  return { id: row.id, code: row.code, name: row.name, active: row.active === 1 };
}

function toPunch(row: PunchRow): Punch {
  return { id: row.id, type: row.type as PunchType, time: row.time };
}

export async function listStaff(): Promise<Staff[]> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute(
    "SELECT id, code, name, active FROM staff ORDER BY created_at ASC"
  );
  return res.rows.map((r) => toStaff(r as unknown as StaffRow));
}

export async function getStaffByCode(code: string): Promise<Staff | null> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, code, name, active FROM staff WHERE code = ?",
    args: [code],
  });
  const row = res.rows[0];
  return row ? toStaff(row as unknown as StaffRow) : null;
}

export async function getStaffById(id: number): Promise<Staff | null> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, code, name, active FROM staff WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0];
  return row ? toStaff(row as unknown as StaffRow) : null;
}

export async function createStaff(code: string, name: string): Promise<Staff> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "INSERT INTO staff (code, name, active, created_at) VALUES (?, ?, 1, ?) RETURNING id, code, name, active",
    args: [code, name, Date.now()],
  });
  return toStaff(res.rows[0] as unknown as StaffRow);
}

export async function updateStaff(
  id: number,
  fields: { code?: string; name?: string; active?: boolean }
): Promise<Staff | null> {
  await ensureSchema();
  const db = getDb();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (fields.code !== undefined) {
    sets.push("code = ?");
    args.push(fields.code);
  }
  if (fields.name !== undefined) {
    sets.push("name = ?");
    args.push(fields.name);
  }
  if (fields.active !== undefined) {
    sets.push("active = ?");
    args.push(fields.active ? 1 : 0);
  }
  if (sets.length === 0) return getStaffById(id);
  args.push(id);
  await db.execute({
    sql: `UPDATE staff SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
  return getStaffById(id);
}

export async function deleteStaff(id: number): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM staff WHERE id = ?", args: [id] });
}

export async function getPunches(staffId: number, dateKey: string): Promise<Punch[]> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, type, time FROM punches WHERE staff_id = ? AND date_key = ? ORDER BY time ASC",
    args: [staffId, dateKey],
  });
  return res.rows.map((r) => toPunch(r as unknown as PunchRow));
}

export async function insertPunch(
  staffId: number,
  type: PunchType,
  time: number,
  dateKey: string
): Promise<Punch> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "INSERT INTO punches (staff_id, type, time, date_key) VALUES (?, ?, ?, ?) RETURNING id, type, time",
    args: [staffId, type, time, dateKey],
  });
  return toPunch(res.rows[0] as unknown as PunchRow);
}

export async function getPunchesForDate(
  dateKey: string
): Promise<Map<number, Punch[]>> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, staff_id, type, time FROM punches WHERE date_key = ? ORDER BY time ASC",
    args: [dateKey],
  });
  const map = new Map<number, Punch[]>();
  for (const row of res.rows as unknown as (PunchRow & { staff_id: number })[]) {
    const list = map.get(row.staff_id) ?? [];
    list.push(toPunch(row));
    map.set(row.staff_id, list);
  }
  return map;
}
