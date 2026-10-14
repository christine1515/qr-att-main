import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';
import { getUserRole, type Role } from '@/lib/profiles';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }

      setRoleLoading(true);

      getUserRole(user.id).then((currentRole) => {
        if (!active) return;

        setRole(currentRole);
        setRoleLoading(false);
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  if (roleLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.statusIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color={COLORS.accent}
          />
        </View>

        <Text style={styles.lockTitle}>Checking your account...</Text>

        <Text style={styles.lockMessage}>
          Verifying access to the QR scanner.
        </Text>
      </View>
    );
  }

  if (role !== 'student') {
    return (
      <View style={styles.centered}>
        <View style={styles.statusIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={30}
            color={COLORS.accent}
          />
        </View>

        <Text style={styles.lockTitle}>Students Only</Text>

        <Text style={styles.lockMessage}>
          Only student accounts can scan attendance QR codes.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <Ionicons
            name="camera-outline"
            size={38}
            color={COLORS.accent}
          />
        </View>

        <Text style={styles.title}>Camera Permission</Text>

        <Text style={styles.subtitle}>
          QR Attendance needs access to your camera so you can scan event QR
          codes.
        </Text>

        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setLastData(data);

    const studentId = user?.id ?? 'unknown';

    registerAttendance(data, studentId).then((result) => {
      setMessage(result.message);
      setSuccess(result.success);
    });
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.topOverlay}>
        <View style={styles.scannerHeader}>
          <View style={styles.scannerIcon}>
            <Ionicons
              name="qr-code-outline"
              size={23}
              color={COLORS.textOnPrimary}
            />
          </View>

          <View style={styles.scannerHeaderText}>
            <Text style={styles.scannerTitle}>Scan Event QR</Text>
            <Text style={styles.scannerSubtitle}>
              Record your attendance
            </Text>
          </View>
        </View>
      </View>

      {!scanned && (
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
      )}

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>
          {scanned
            ? 'QR Code detected'
            : 'Point your camera at a QR code'}
        </Text>

        {!scanned && (
          <Text style={styles.instructionText}>
            Make sure the entire QR code is visible inside the frame.
          </Text>
        )}

        {scanned && message && (
          <View
            style={[
              styles.resultBox,
              success ? styles.successBox : styles.errorBox,
            ]}
          >
            <Ionicons
              name={
                success
                  ? 'checkmark-circle'
                  : 'alert-circle'
              }
              size={22}
              color={
                success
                  ? COLORS.secondary
                  : COLORS.danger
              }
            />

            <Text
              style={[
                styles.scanResult,
                success ? styles.success : styles.error,
              ]}
            >
              {message}
            </Text>
          </View>
        )}

        {scanned && lastData && (
          <View style={styles.dataBox}>
            <Text style={styles.dataLabel}>QR DATA</Text>
            <Text style={styles.scanData} numberOfLines={2}>
              {lastData}
            </Text>
          </View>
        )}

        {scanned && (
          <View style={styles.buttonContainer}>
            <AppButton
              theme="primary"
              title="Scan Again"
              icon="refresh"
              onPress={handleScanAgain}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  statusIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  lockTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },

  lockMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 21,
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  permissionIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    maxWidth: 330,
  },

  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  topOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },

  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(101, 29, 50, 0.94)',
    borderRadius: 18,
    padding: 13,
  },

  scannerIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  scannerHeaderText: {
    flex: 1,
  },

  scannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },

  scannerSubtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
  },

  scannerFrame: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignSelf: 'center',
    top: '34%',
  },

  corner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: COLORS.accent,
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  instructionContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: 'rgba(248, 241, 231, 0.97)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },

  instructionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },

  instructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  resultBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },

  successBox: {
    backgroundColor: 'rgba(157, 73, 63, 0.12)',
  },

  errorBox: {
    backgroundColor: 'rgba(145, 47, 54, 0.10)',
  },

  scanResult: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    marginLeft: 8,
    fontWeight: '700',
  },

  success: {
    color: COLORS.secondary,
  },

  error: {
    color: COLORS.danger,
  },

  dataBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 9,
  },

  dataLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },

  scanData: {
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 15,
  },

  buttonContainer: {
    width: '100%',
    marginTop: 12,
  },
});
