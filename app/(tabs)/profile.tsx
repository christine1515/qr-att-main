import { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    if (!user) return;

    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev
      );
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: Profile['role']) => {
    switch (role) {
      case 'teacher':
        return 'Teacher';

      case 'admin':
        return 'Administrator';

      case 'student':
      default:
        return 'Student';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingContainer}>
        <Text style={styles.title}>My Profile</Text>

        <Text style={styles.subtitle}>
          Manage your personal information
        </Text>
      </View>

      {profile && (
        <View style={styles.infoCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile.full_name || profile.email || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileHeading}>
              <Text style={styles.profileName}>
                {profile.full_name || 'Your Profile'}
              </Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {getRoleLabel(profile.role)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME</Text>

            {editing ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={draftName}
                  onChangeText={setDraftName}
                  editable={!saving}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Pressable
                  onPress={handleSaveName}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setEditing(true)}
                style={({ pressed }) => [
                  styles.nameRow,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.value}>
                  {profile.full_name || 'Tap to add your name'}
                </Text>

                <View style={styles.editButton}>
                  <Text style={styles.editHint}>Edit</Text>
                </View>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>USER ID</Text>
            <Text style={styles.valueSmall}>{profile.id}</Text>
          </View>
        </View>
      )}

      <View style={styles.accountSection}>
        <Text style={styles.sectionTitle}>Account</Text>

        <AppButton
          title="Sign Out"
          icon="log-out-outline"
          onPress={handleSignOut}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },

  headingContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },

  profileHeading: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 7,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 7,
  },

  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },

  rowPressed: {
    opacity: 0.7,
  },

  editButton: {
    backgroundColor: COLORS.background,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  editHint: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
  },

  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  nameInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  accountSection: {
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
});