import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getTeacherEventAttendance,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { getProfile } from '@/lib/profiles';

export default function AttendanceDetails() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<TeacherEventAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!user || !eventId) {
      setLoading(false);
      return;
    }

    const profile = await getProfile(user.id);

    if (profile?.role !== 'teacher') {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    const events = await getTeacherEventAttendance(user.id);

    const selectedEvent = events.find(
      (item) => item.eventId === eventId
    );

    setEvent(selectedEvent ?? null);
    setLoading(false);
  }, [user, eventId]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  const formatDate = (value: string | null) => {
    if (!value) {
      return 'Not set';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const shortId = (id: string) => {
    return id ? `…${id.slice(-8)}` : 'Unknown student';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator
              size="large"
              color={COLORS.accent}
            />
          </View>

          <Text style={styles.loadingText}>
            Loading attendance...
          </Text>

          <Text style={styles.loadingSubtext}>
            Please wait while we retrieve the records.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (unauthorized) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header title="Attendance Details" />

          <View style={styles.emptyContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>RESTRICTED</Text>
            </View>

            <Text style={styles.emptyTitle}>Teachers only</Text>

            <Text style={styles.emptyText}>
              You do not have permission to view this attendance record.
            </Text>
          </View>

          <AppButton
            title="Go Back"
            icon="arrow-back-outline"
            onPress={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header title="Attendance Details" />

          <View style={styles.emptyContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>NOT FOUND</Text>
            </View>

            <Text style={styles.emptyTitle}>
              Attendance not found
            </Text>

            <Text style={styles.emptyText}>
              This event may have been removed or you may no longer
              have access to its attendance records.
            </Text>
          </View>

          <AppButton
            title="Go Back"
            icon="arrow-back-outline"
            onPress={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Attendance Details" />

        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>EVENT</Text>
            </View>

            <View style={styles.attendanceBadge}>
              <Text style={styles.attendanceBadgeText}>
                {event.attendeeCount} ATTENDED
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>EVENT CODE</Text>

            <Text style={styles.codeValue}>
              {event.eventCode}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>START</Text>

              <Text style={styles.detailValue}>
                {formatDate(event.startTime)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>END</Text>

              <Text style={styles.detailValue}>
                {formatDate(event.endTime)}
              </Text>
            </View>
          </View>

          <View style={styles.countContainer}>
            <View style={styles.countIcon}>
              <Text style={styles.countIconText}>✓</Text>
            </View>

            <View style={styles.countTextContainer}>
              <Text style={styles.countLabel}>
                TOTAL ATTENDANCE
              </Text>

              <Text style={styles.countSubtext}>
                {event.attendeeCount === 1
                  ? 'student attended'
                  : 'students attended'}
              </Text>
            </View>

            <Text style={styles.countValue}>
              {event.attendeeCount}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Attendees
            </Text>

            <Text style={styles.sectionSubtitle}>
              Students who scanned this event QR
            </Text>
          </View>

          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {event.attendeeCount}
            </Text>
          </View>
        </View>

        {event.attendees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>EMPTY</Text>
            </View>

            <Text style={styles.emptyTitle}>
              No attendance yet
            </Text>

            <Text style={styles.emptyText}>
              No students have scanned the QR code for this event.
            </Text>
          </View>
        ) : (
          event.attendees.map((attendee, index) => (
            <View
              key={`${attendee.studentId}-${attendee.scannedAt}`}
              style={styles.attendeeCard}
            >
              <View style={styles.attendeeNumberContainer}>
                <Text style={styles.attendeeNumber}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeLabel}>
                  STUDENT ID
                </Text>

                <Text style={styles.attendeeValue}>
                  {shortId(attendee.studentId)}
                </Text>

                <View style={styles.scannedRow}>
                  <Text style={styles.attendeeLabel}>
                    SCANNED AT
                  </Text>

                  <Text style={styles.attendeeValue}>
                    {formatDate(attendee.scannedAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.buttonContainer}>
          <AppButton
            title="Go Back"
            icon="arrow-back-outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginBottom: 18,
  },

  loadingText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  loadingSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },

  eventCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 22,
    marginTop: 20,
    marginBottom: 28,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  eventBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  eventBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.card,
  },

  attendanceBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  attendanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.primary,
  },

  eventTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: COLORS.card,
    marginBottom: 18,
  },

  codeContainer: {
    backgroundColor: 'rgba(248, 241, 231, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248, 241, 231, 0.20)',
    borderRadius: 14,
    padding: 14,
  },

  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.accent,
    marginBottom: 5,
  },

  codeValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.card,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(248, 241, 231, 0.16)',
    marginVertical: 20,
  },

  detailsGrid: {
    flexDirection: 'row',
    gap: 18,
  },

  detailSection: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.accent,
    marginBottom: 6,
  },

  detailValue: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.card,
  },

  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 241, 231, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },

  countIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    marginRight: 12,
  },

  countIconText: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.card,
  },

  countTextContainer: {
    flex: 1,
  },

  countLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.accent,
  },

  countSubtext: {
    fontSize: 12,
    color: COLORS.card,
    marginTop: 3,
  },

  countValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.accent,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  totalBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },

  totalBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },

  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 15,
    marginBottom: 11,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },

  attendeeNumberContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    marginRight: 13,
  },

  attendeeNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.card,
  },

  attendeeInfo: {
    flex: 1,
  },

  attendeeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: COLORS.accent,
    marginBottom: 3,
  },

  attendeeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.card,
    marginBottom: 8,
  },

  scannedRow: {
    marginTop: 1,
  },

  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    marginLeft: 8,
  },

  checkText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.card,
  },

  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.primary,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  buttonContainer: {
    marginTop: 18,
  },
});

