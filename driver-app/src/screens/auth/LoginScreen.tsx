import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { userRepository } from '../../repositories/UserRepository';

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const [email, setEmail] = useState('zanele.mokoena@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userRepository.login(email, password);
      navigation.replace('MainTabs');
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isWireframe ? '#F0F0F0' : colors.warmAsh }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {isWireframe ? (
              <View style={styles.wireframeLogo} />
            ) : (
              <View
                style={[styles.logoMark, { backgroundColor: colors.petrolDeep }]}
              >
                <Text style={[styles.logoText, { fontFamily: font('displayBold'), color: colors.ignitionAmber }]}>
                  F
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.appName,
                {
                  color: isWireframe ? '#1A1A1A' : colors.petrolDeep,
                  fontFamily: font('displayBold'),
                  fontSize: FontSizes['3xl'],
                },
              ]}
            >
              FuelNow
            </Text>
            <Text
              style={[
                styles.tagline,
                {
                  color: isWireframe ? '#666' : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              South Africa's fuel delivery app
            </Text>
          </View>

          {/* Form card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isWireframe ? '#FFFFFF' : colors.white,
                borderRadius: isWireframe ? Radius.sm : Radius.xl,
                borderWidth: isWireframe ? 1.5 : 0,
                borderColor: '#CCCCCC',
              },
            ]}
          >
            <Text
              style={[
                styles.formTitle,
                {
                  color: isWireframe ? '#1A1A1A' : colors.charcoalInk,
                  fontFamily: font('display'),
                  fontSize: FontSizes.xl,
                },
              ]}
            >
              Welcome back
            </Text>
            <Text
              style={[
                styles.formSubtitle,
                {
                  color: isWireframe ? '#666' : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.sm,
                  marginBottom: Spacing.xl,
                },
              ]}
            >
              Sign in to your FuelNow account
            </Text>

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.co.za"
              leftIcon={<Feather name="mail" size={18} color={isWireframe ? '#888' : colors.inkLight} />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              placeholder="Enter your password"
              leftIcon={<Feather name="lock" size={18} color={isWireframe ? '#888' : colors.inkLight} />}
            />

            {error ? (
              <Text
                style={[
                  styles.error,
                  {
                    color: isWireframe ? '#555' : colors.signalRed,
                    fontFamily: font('body'),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    color: isWireframe ? '#444' : colors.petrolDeep,
                    fontFamily: font('bodyMedium'),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              style={{ marginTop: Spacing.md }}
            />

          </View>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text
              style={[
                styles.signupText,
                {
                  color: isWireframe ? '#555' : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text
                style={[
                  styles.signupLink,
                  {
                    color: isWireframe ? '#333' : colors.petrolDeep,
                    fontFamily: font('bodySemiBold'),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Create account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: { fontSize: 32 },
  wireframeLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#888',
    marginBottom: Spacing.sm,
  },
  appName: { letterSpacing: -0.5 },
  tagline: {},
  card: {
    padding: Spacing.xl,
  },
  formTitle: { marginBottom: Spacing.xs },
  formSubtitle: {},
  error: { marginBottom: Spacing.md },
  forgotBtn: { alignSelf: 'flex-end', padding: Spacing.xs },
  forgotText: {},
  demoHint: { textAlign: 'center', marginTop: Spacing.md },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  signupText: {},
  signupLink: {},
});
