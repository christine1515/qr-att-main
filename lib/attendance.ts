
import { supabase } from './supabase';
import { parseQRPayload } from './qr';
import { getEventByCode } from './events';
import { getProfile } from './profiles';

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    scannedAt: string;
  }[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }

  // Verify the currently signed-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== studentId) {
    return {
      success: false,
      message: 'Please sign in with your student account.',
    };
  }

  const profile = await getProfile(user.id);

  if (!profile || profile.role !== 'student') {
    return {
      success: false,
      message: 'Only student accounts can record attendance.',
    };
  }

  const payload = parsed.payload;
  const foundEvent = await getEventByCode(payload.event);

  if (!foundEvent) {
    return {
      success: false,
      message: 'Invalid QR code. This event does not exist.',
    };
  }

  if (foundEvent.status !== 'open') {
    return {
      success: false,
      message: 'This event is closed. Attendance is no longer available.',
      eventTitle: foundEvent.title,
    };
  }

  // Validate the event timestamps returned by Supabase.
  // Date.parse handles ISO timestamps with UTC offsets correctly.
  const now = Date.now();

  const start =
    foundEvent.start_time != null
      ? Date.parse(foundEvent.start_time)
      : null;

  const end =
    foundEvent.end_time != null
      ? Date.parse(foundEvent.end_time)
      : null;
      console.log('Event:', foundEvent.title);
console.log('Start time:', foundEvent.start_time);
console.log('End time:', foundEvent.end_time);
console.log('Current time:', new Date().toString());
console.log('Parsed start:', start);
console.log('Parsed end:', end);
      

  if (start !== null && !Number.isFinite(start)) {
    return {
      success: false,
      message: 'Invalid event start time. Please contact your teacher.',
      eventTitle: foundEvent.title,
    };
  }

  if (end !== null && !Number.isFinite(end)) {
    return {
      success: false,
      message: 'Invalid event end time. Please contact your teacher.',
      eventTitle: foundEvent.title,
    };
  }

  if (start !== null && now < start) {
    return {
      success: false,
      message: 'Event has not started yet.',
      eventTitle: foundEvent.title,
    };
  }

  if (end !== null && now > end) {
    return {
      success: false,
      message: 'Event has already ended.',
      eventTitle: foundEvent.title,
    };
  }

  // Check whether the student already recorded attendance.
  const {
    data: existingAttendance,
    error: existingError,
  } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', user.id)
    .eq('event_id', foundEvent.id)
    .maybeSingle();

  if (existingError) {
    return {
      success: false,
      message: 'Could not verify attendance. Please try again.',
    };
  }

  if (existingAttendance) {
    return {
      success: false,
      message: 'You have already recorded attendance for this event.',
      eventTitle: foundEvent.title,
    };
  }

  // Record attendance.
  const { error: attError } = await supabase
    .from('attendance')
    .insert([
      {
        student_id: user.id,
        event_id: foundEvent.id,
        status: 'present',
      },
    ]);

  if (attError) {
    if (attError.code === '23505') {
      return {
        success: false,
        message: 'You have already recorded attendance for this event.',
        eventTitle: foundEvent.title,
      };
    }

    if (attError.code === '42501') {
      return {
        success: false,
        message: 'You are not authorized to record attendance.',
      };
    }

    return {
      success: false,
      message: 'Attendance could not be recorded. Please try again.',
    };
  }

  return {
    success: true,
    message: 'Attendance recorded successfully!',
    eventTitle: foundEvent.title,
  };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, events ( event_code, title )')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
  }));
}

export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    return [];
  }

  const eventIds = events.map((e: any) => e.id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('student_id, scanned_at, event_id')
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false });

  if (attError || !attendance) {
    return [];
  }

  return events.map((e: any) => {
    const rows = attendance.filter(
      (a: any) => a.event_id === e.id
    );

    return {
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: rows.length,
      attendees: rows.map((a: any) => ({
        studentId: a.student_id,
        scannedAt: a.scanned_at,
      })),
    };
  });
}

export async function getTeacherEventSummary(
  teacherId: string
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    return [];
  }

  const eventIds = events.map((e: any) => e.id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: attRows, error: attError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  if (attError || !attRows) {
    return [];
  }

  const counts: Record<string, number> = {};

  attRows.forEach((r: any) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });

  return events.map((e: any) => ({
    eventId: e.id,
    eventCode: e.event_code,
    title: e.title,
    attendeeCount: counts[e.id] ?? 0,
  }));
}

export async function deleteAttendanceRecord(
  attendanceId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId);

  return {
    error: error?.message ?? null,
  };
}
