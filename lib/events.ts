import { supabase } from './supabase';

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
  venue?: string;
  description?: string;
  status?: 'open' | 'closed';
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  description: string | null;
  status: 'open' | 'closed';
  created_by: string | null;
  created_at: string;
};

export async function createEvent(
  event: Event
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please sign in to create an event.' };
  if (!event.eventId.trim() || !event.title.trim()) return { error: 'Event code and title are required.' };
  if (event.start && event.end && new Date(event.end).getTime() <= new Date(event.start).getTime()) return { error: 'Event end time must be after its start time.' };

  const { error } = await supabase.from('events').insert(
    {
      event_code: event.eventId,
      title: event.title,
     start_time: event.start
  ? new Date(event.start).toISOString()
  : null,
end_time: event.end
  ? new Date(event.end).toISOString()
  : null,
      venue: event.venue?.trim() || null,
      description: event.description?.trim() || null,
      status: event.status ?? 'open',
      created_by: user?.id ?? null,
    }
  );

  return { error: error?.code === '23505' ? 'This event code already exists. Choose another code.' : error?.message ?? null };
}

export async function getEventsByTeacher(
  teacherId: string
): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function getEventByCode(
  code: string
): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}

export async function getAvailableEvents(): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'open')
    .order('start_time', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    start?: string;
    end?: string;
    venue?: string;
    description?: string;
    status?: 'open' | 'closed';
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .update({
      ...(updates.title !== undefined && {
        title: updates.title.trim(),
      }),
     ...(updates.start !== undefined && {
  start_time: updates.start
    ? new Date(updates.start).toISOString()
    : null,
}),
     ...(updates.end !== undefined && {
  end_time: updates.end
    ? new Date(updates.end).toISOString()
    : null,
}),
      ...(updates.venue !== undefined && {
        venue: updates.venue.trim() || null,
      }),
      ...(updates.description !== undefined && {
        description: updates.description.trim() || null,
      }),
      ...(updates.status !== undefined && {
        status: updates.status,
      }),
    })
    .eq('id', eventId);

  return { error: error?.message ?? null };
}

export async function closeEvent(
  eventId: string
): Promise<{ error: string | null }> {
  return updateEvent(eventId, {
    status: 'closed',
  });
}