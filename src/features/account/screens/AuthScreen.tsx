import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_EMAIL } from '../../../config/demo';
import { env } from '../../../config/env';
import { ApiError } from '../../../services/api/ApiError';
import { logInInputSchema, registrationSchema, signUpInputSchema } from '../../../services/contracts/account';
import { loginSchema } from '../../../services/auth/supabaseAuth';
import { AppButton } from '../../../shared/components/AppButton';
import { BrandFullLogo } from '../../../shared/components/Brand';
import { InfoNote } from '../../../shared/components/InfoNote';
import { LanguageToggle } from '../../../shared/components/LanguageToggle';
import { tokens } from '../../../shared/theme/tokens';
import { type AuthMode, useAuth } from '../authContext';
import { normalizePhone } from '../phone';

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'nic' | 'phone_number', string>>;

// Demo signup enters Home; real registration returns to login without establishing a session.
export function AuthScreen() {
  const { t } = useTranslation('account');
  const { t: tc } = useTranslation();
  const { logIn, signUp, continueAsGuest, preferredMode, error: restorationError } = useAuth();
  const realAuth = env.authMode === 'supabase';
  const [mode, setMode] = useState<AuthMode>(preferredMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('');
  const [registered, setRegistered] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(undefined);
    setRegistered(false);
  };

  const submit = async () => {
    setFormError(undefined);
    const signupValues = { name, email, password, nic, phone_number: normalizePhone(phone) ?? '' };
    const signupSchema = realAuth ? registrationSchema : signUpInputSchema;
    const parsed = mode === 'signup'
      ? signupSchema.safeParse(signupValues)
      : (realAuth ? loginSchema : logInInputSchema).safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'name' || field === 'email' || field === 'password' || field === 'nic' || field === 'phone_number') {
          next[field] ??= t(field === 'password' && mode === 'login' ? 'auth.errors.passwordRequired' : `auth.errors.${field}`);
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      if (mode === 'signup') {
        const user = await signUp(signupSchema.parse(signupValues));
        if (!user) { setMode('login'); setPassword(''); setNic(''); setPhone(''); setRegistered(true); }
      } else await logIn((realAuth ? loginSchema : logInInputSchema).parse({ email, password }));
      // A successful login is reflected by the auth provider and existing root navigator.
    } catch (error) {
      const kind = error instanceof ApiError ? error.kind : 'unknown';
      const key = kind === 'not-found' ? 'notFound' : kind === 'conflict' ? 'conflict'
        : kind === 'unauthorized' ? 'credentials' : kind === 'forbidden' ? 'unconfirmed'
          : kind === 'rate-limit' ? 'rateLimit' : kind === 'configuration' ? 'configuration'
            : kind === 'validation' ? 'validation' : 'generic';
      setFormError(t(`auth.errors.${key}`));
    } finally { setPending(false); }
  };

  const signInToDemo = async () => {
    setErrors({});
    setFormError(undefined);
    setPending(true);
    try {
      await logIn({ email: DEMO_EMAIL, password: 'demo' });
    } catch {
      setFormError(t('auth.errors.generic'));
      setPending(false);
    }
  };

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: tokens.colors.textSecondary,
    activeOutlineColor: tokens.colors.navy,
    style: styles.input,
    disabled: pending,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <LanguageToggle />
          </View>

          <View style={styles.logo}>
            <BrandFullLogo name={tc('appName')} width={140} />
          </View>

          <SegmentedButtons
            value={mode}
            onValueChange={(value) => { switchMode(value as AuthMode); }}
            buttons={[
              { value: 'login', label: t('auth.loginTab'), style: styles.segment, accessibilityLabel: t('auth.loginTab') },
              { value: 'signup', label: t('auth.signupTab'), style: styles.segment, accessibilityLabel: t('auth.signupTab') },
            ]}
          />

          <View style={styles.heading}>
            <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">
              {mode === 'signup' ? t('auth.signupTitle') : t('auth.loginTitle')}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {mode === 'signup' ? t('auth.signupSubtitle') : t('auth.loginSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {registered ? <InfoNote icon="check-circle-outline" text={t('auth.registered')} /> : null}
            {restorationError ? <InfoNote tone="error" text={t(restorationError.kind === 'configuration' ? 'auth.errors.configuration' : 'auth.errors.restore')} /> : null}
            {mode === 'signup' ? (
              <View>
                <TextInput
                  {...inputProps}
                  label={t('auth.name')}
                  accessibilityLabel={t('auth.name')}
                  value={name}
                  onChangeText={setName}
                  error={Boolean(errors.name)}
                  autoComplete="name"
                  textContentType="name"
                  maxLength={60}
                />
                <HelperText type="error" visible={Boolean(errors.name)}>{errors.name}</HelperText>
              </View>
            ) : null}
            {mode === 'signup' && realAuth ? (
              <>
                <View>
                  <TextInput {...inputProps} label={t('auth.nic')} accessibilityLabel={t('auth.nic')}
                    value={nic} onChangeText={setNic} error={Boolean(errors.nic)} maxLength={12} autoCapitalize="characters" autoComplete="off" />
                  <HelperText type="error" visible={Boolean(errors.nic)}>{errors.nic}</HelperText>
                </View>
                <View>
                  <TextInput {...inputProps} label={t('auth.phone')} accessibilityLabel={t('auth.phone')}
                    value={phone} onChangeText={setPhone} error={Boolean(errors.phone_number)} keyboardType="phone-pad" autoComplete="tel" />
                  <HelperText type="error" visible={Boolean(errors.phone_number)}>{errors.phone_number}</HelperText>
                </View>
              </>
            ) : null}
            <View>
              <TextInput
                {...inputProps}
                label={t('auth.email')}
                accessibilityLabel={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={Boolean(errors.email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
              />
              <HelperText type="error" visible={Boolean(errors.email)}>{errors.email}</HelperText>
            </View>
            <View>
              <TextInput
                {...inputProps}
                label={t('auth.password')}
                accessibilityLabel={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                error={Boolean(errors.password)}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              />
              <HelperText type={errors.password ? 'error' : 'info'} visible={Boolean(errors.password) || mode === 'signup'}>
                {errors.password ?? t('auth.passwordHint')}
              </HelperText>
            </View>

            {formError ? <InfoNote tone="error" icon="alert-circle-outline" text={formError} /> : null}

            <AppButton mode="contained" loading={pending} disabled={pending} onPress={() => { void submit(); }}>
              {mode === 'signup' ? t('auth.signupSubmit') : t('auth.loginSubmit')}
            </AppButton>
          </View>

          {!realAuth ? (
            <View style={styles.demo}>
              <Text variant="titleMedium" style={styles.demoTitle} accessibilityRole="header">{t('auth.demoAccount.title')}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>{t('auth.demoAccount.body')}</Text>
              <Text variant="labelLarge" style={styles.demoEmail}>{DEMO_EMAIL}</Text>
              <AppButton mode="contained-tonal" disabled={pending} onPress={() => { void signInToDemo(); }}>
                {t('auth.demoAccount.button')}
              </AppButton>
            </View>
          ) : null}

          {!realAuth ? <InfoNote icon="flask-outline" text={t('auth.demoNote')} /> : null}

          <AppButton mode="text" disabled={pending} onPress={continueAsGuest}>{t('auth.guest')}</AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  content: { flexGrow: 1, padding: tokens.spacing.lg, gap: tokens.spacing.lg },
  topBar: { alignItems: 'flex-end' },
  logo: { alignItems: 'center' },
  segment: { minHeight: tokens.touchTarget, justifyContent: 'center' },
  heading: { gap: tokens.spacing.sm },
  title: { color: tokens.colors.navy },
  subtitle: { color: tokens.colors.textSecondary },
  form: { gap: tokens.spacing.xs },
  input: { backgroundColor: tokens.colors.surface },
  demo: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.colors.textSecondary,
  },
  demoTitle: { color: tokens.colors.textPrimary },
  demoEmail: { color: tokens.colors.textPrimary },
});
