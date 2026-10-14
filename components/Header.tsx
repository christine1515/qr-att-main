import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = { title: string };

export default function Header({ title }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoOuter}>
        <View style={styles.logoCircle}>
          <MaterialIcons
            name="qr-code-scanner"
            size={32}
            color={COLORS.card}
          />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.titleAccent}>
        <View style={styles.accentDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
    paddingBottom: 22,
    width: '100%',
  },

  logoOuter: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    marginBottom: 14,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
  },

  titleAccent: {
    width: 62,
    height: 5,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  accentDot: {
    width: 7,
    height: 7,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
  },
});

