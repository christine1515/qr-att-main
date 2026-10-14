import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = true;
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function updateAuthState(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;
  notify();
}

let initialized = false;

async function initializeAuth() {
  if (initialized) return;

  initialized = true;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  updateAuthState(session);
}

initializeAuth();

supabase.auth.onAuthStateChange((_event, session) => {
  updateAuthState(session);
});

export function setAuth(session: Session | null) {
  updateAuthState(session);
}

export function useAuth(): AuthState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => {
      forceRender((n) => n + 1);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
  };
}

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // A profile-creation trigger can use this metadata even when email
      // confirmation means the new user has no active session yet.
      data: {
        full_name: profile?.full_name?.trim() ?? '',
        role: 'student',
      },
    },
  });

  // Public sign-up must never assign elevated roles. The database trigger/RLS
  // should create a student profile from auth metadata; do not update role here.

  if (!error && data.session) {
    updateAuthState(data.session);
  }

  return { data, error };
}

export async function signIn(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (!error && data.session) {
    updateAuthState(data.session);
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  updateAuthState(null);

  return { error };
}