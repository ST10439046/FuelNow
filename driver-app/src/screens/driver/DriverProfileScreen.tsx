// ─────────────────────────────────────────────────────────────────────────────
// DriverProfileScreen.tsx — Driver Profile Tab
// Shows avatar, personal info, compliance documents, and action buttons.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import {
  driverRepository,
  DriverDocumentModel as DriverDocument,
  DriverModel,
} from '../../repositories/DriverRepository';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format an ISO date: '15 Aug 2027' */
function formatExpiry(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Derive status from document flags */
function docStatus(
  doc: DriverDocument
): 'expired' | 'expiringSoon' | 'valid' {
  if (doc.isExpired) return 'expired';
  if (doc.isExpiringSoon) return 'expiringSoon';
  return 'valid';
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string;
  isWireframe: boolean;
  colors: ReturnType<typeof useDesignMode>['colors'];
  font: ReturnType<typeof useDesignMode>['font'];
}

function InfoRow({
  icon,
  value,
  isWireframe,
  colors,
  font,
}: InfoRowProps) {
  const iconColor = isWireframe ? colors.inkLight : '#F97316';

  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIconWrap,
          {
            backgroundColor: isWireframe
              ? colors.ashDark
              : '#FFF7ED',
          },
        ]}
      >
        <Feather name={icon} size={16} color={iconColor} />
      </View>

      <Text
        style={[
          styles.infoValue,
          {
            color: colors.charcoalInk,
            fontFamily: font('body'),
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

interface DocumentCardProps {
  doc: DriverDocument;
  isWireframe: boolean;
  colors: ReturnType<typeof useDesignMode>['colors'];
  font: ReturnType<typeof useDesignMode>['font'];
}

function DocumentCard({
  doc,
  isWireframe,
  colors,
  font,
}: DocumentCardProps) {
  const status = docStatus(doc);

  const iconCircleColor = isWireframe
    ? colors.ashDark
    : status === 'expired'
      ? '#EF4444'
      : status === 'expiringSoon'
        ? '#FACC15'
        : '#22C55E';

  const iconColor = isWireframe
    ? colors.inkLight
    : status === 'expired'
      ? '#FFFFFF'
      : status === 'expiringSoon'
        ? '#78350F'
        : '#FFFFFF';

  const badgeBg = isWireframe
    ? colors.ashDark
    : status === 'expired'
      ? '#FEE2E2'
      : status === 'expiringSoon'
        ? '#FEF9C3'
        : '#DCFCE7';

  const badgeText = isWireframe
    ? colors.inkLight
    : status === 'expired'
      ? '#DC2626'
      : status === 'expiringSoon'
        ? '#854D0E'
        : '#16A34A';

  const badgeLabel =
    status === 'expired'
      ? 'Expired'
      : status === 'expiringSoon'
        ? 'Expiring Soon'
        : 'Valid';

  return (
    <View
      style={[
        styles.docCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.divider,
          borderWidth: isWireframe ? 1.5 : 0,
        },
        !isWireframe && {
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      <View
        style={[
          styles.docIconCircle,
          { backgroundColor: iconCircleColor },
        ]}
      >
        <Feather name="file-text" size={18} color={iconColor} />
      </View>

      <View style={styles.docCenter}>
        <Text
          style={[
            styles.docType,
            {
              color: colors.charcoalInk,
              fontFamily: font('bodyBold'),
            },
          ]}
        >
          {doc.type}
        </Text>

        <Text
          style={[
            styles.docNumber,
            {
              color: colors.inkLight,
              fontFamily: font('body'),
            },
          ]}
        >
          {doc.number}
        </Text>

        <Text
          style={[
            styles.docExpiry,
            {
              color:
                status === 'expired'
                  ? '#EF4444'
                  : colors.inkFaint,
              fontFamily: font('body'),
            },
          ]}
        >
          Expires: {formatExpiry(doc.expiryDate)}
        </Text>
      </View>

      <View
        style={[
          styles.docBadge,
          { backgroundColor: badgeBg },
        ]}
      >
        <Text
          style={[
            styles.docBadgeText,
            {
              color: badgeText,
              fontFamily: font('bodyMedium'),
            },
          ]}
        >
          {badgeLabel}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

interface Props {
  navigation: any;
}

export default function DriverProfileScreen({
  navigation,
}: Props) {
  const { colors, font, isWireframe } = useDesignMode();

  const [driver, setDriver] = useState<DriverModel | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [driverData, docs] = await Promise.all([
          driverRepository.getActiveDriver().catch(() => null),
          driverRepository.getDriverDocuments(),
        ]);

        setDriver(driverData);
        setDocuments(docs);
      } catch (_) {
        // fall back silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const orangeColor = isWireframe
    ? colors.charcoalInk
    : '#F97316';

  const headerBg = isWireframe
    ? '#3A3A3A'
    : '#F97316';

  const headerText = '#FFFFFF';

  const headerSub = isWireframe
    ? 'rgba(255,255,255,0.75)'
    : 'rgba(255,255,255,0.82)';

  const driverName = driver?.name || 'Driver';
  const driverPhone = driver?.phone || 'Not available';
  const driverStation = driver?.stationName || 'Not assigned';
  const driverEmail = 'Account email';

  const initials = driverName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'DR';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.warmAsh },
      ]}
      edges={['top', 'left', 'right']}
    >
      <View
        style={[
          styles.root,
          { backgroundColor: colors.warmAsh },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header */}
          <View
            style={[
              styles.profileHeader,
              { backgroundColor: headerBg },
              !isWireframe && {
                shadowColor: '#F97316',
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              },
            ]}
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: '#FFFFFF',
                  borderWidth: isWireframe ? 2 : 0,
                  borderColor: 'rgba(255,255,255,0.5)',
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitials,
                  {
                    color: orangeColor,
                    fontFamily: font('displayBold'),
                  },
                ]}
              >
                {initials}
              </Text>
            </View>

            <Text
              style={[
                styles.profileName,
                {
                  color: headerText,
                  fontFamily: font('displayBold'),
                },
              ]}
            >
              {driverName}
            </Text>

            <Text
              style={[
                styles.profileMeta,
                {
                  color: headerSub,
                  fontFamily: font('body'),
                },
              ]}
            >
              ⭐ {driver?.rating ?? '—'} Rating
              {'  •  '}
              {(driver?.totalDeliveries ?? 0).toLocaleString()}
              {' Deliveries'}
            </Text>

            <View
              style={[
                styles.vehicleChip,
                {
                  backgroundColor:
                    'rgba(255,255,255,0.2)',
                },
              ]}
            >
              <Feather
                name="truck"
                size={12}
                color={headerText}
                style={{ marginRight: 5 }}
              />

              <Text
                style={[
                  styles.vehicleChipText,
                  {
                    color: headerText,
                    fontFamily: font('bodyMedium'),
                  },
                ]}
              >
                {driver?.vehicleModel || 'Vehicle'}
                {'  ·  '}
                {driver?.vehicleReg || 'Not assigned'}
              </Text>
            </View>
          </View>

          {/* Personal Info */}
          <View style={styles.sectionBlock}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.charcoalInk,
                  fontFamily: font('displayBold'),
                },
              ]}
            >
              Personal Info
            </Text>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.divider,
                  borderWidth: isWireframe ? 1.5 : 0,
                },
                !isWireframe && {
                  shadowColor: '#111827',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 3,
                },
              ]}
            >
              <InfoRow
                icon="phone"
                value={driverPhone}
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />

              <View
                style={[
                  styles.infoSeparator,
                  { backgroundColor: colors.divider },
                ]}
              />

              <InfoRow
                icon="mail"
                value={driverEmail}
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />

              <View
                style={[
                  styles.infoSeparator,
                  { backgroundColor: colors.divider },
                ]}
              />

              <InfoRow
                icon="map-pin"
                value={driverStation}
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />
            </View>
          </View>

          {/* Compliance Documents */}
          <View style={styles.sectionBlock}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.charcoalInk,
                  fontFamily: font('displayBold'),
                },
              ]}
            >
              Compliance Documents
            </Text>

            {loading ? (
              <View style={styles.docsLoading}>
                <ActivityIndicator
                  size="small"
                  color={
                    isWireframe
                      ? colors.inkLight
                      : '#F97316'
                  }
                />

                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: colors.inkLight,
                      fontFamily: font('body'),
                    },
                  ]}
                >
                  Loading documents…
                </Text>
              </View>
            ) : documents.length === 0 ? (
              <View style={styles.docsLoading}>
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: colors.inkLight,
                      fontFamily: font('body'),
                    },
                  ]}
                >
                  No compliance documents found.
                </Text>
              </View>
            ) : (
              <View style={styles.docsContainer}>
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isWireframe={isWireframe}
                    colors={colors}
                    font={font}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsBlock}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SOS')}
              style={[
                styles.sosButton,
                {
                  backgroundColor: isWireframe
                    ? '#4A4A4A'
                    : '#EF4444',
                },
                !isWireframe && {
                  shadowColor: '#EF4444',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}
            >
              <Feather
                name="alert-triangle"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />

              <Text
                style={[
                  styles.sosButtonText,
                  {
                    color: '#FFFFFF',
                    fontFamily: font('bodyBold'),
                  },
                ]}
              >
                SOS / Emergency
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={async () => {
                try {
                  await navigation.getParent()?.goBack?.();
                } catch (_) {
                  // Navigation fallback handled by the auth flow.
                }
              }}
              style={[
                styles.signOutButton,
                {
                  borderColor: isWireframe
                    ? colors.inkLight
                    : colors.divider,
                  backgroundColor: colors.cardBg,
                },
              ]}
            >
              <Feather
                name="log-out"
                size={16}
                color={colors.inkLight}
                style={{ marginRight: 8 }}
              />

              <Text
                style={[
                  styles.signOutText,
                  {
                    color: colors.inkLight,
                    fontFamily: font('bodyMedium'),
                  },
                ]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  root: {
    flex: 1,
    height:
      Platform.OS === 'web'
        ? ('100vh' as any)
        : '100%',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 8,
    marginBottom: 4,
  },

  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
  },

  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },

  profileMeta: {
    fontSize: 14,
  },

  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },

  vehicleChipText: {
    fontSize: 12,
  },

  sectionBlock: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  infoValue: {
    fontSize: 14,
    flex: 1,
  },

  infoSeparator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  docsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 14,
  },

  docsContainer: {
    gap: 10,
  },

  docCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  docCenter: {
    flex: 1,
    gap: 2,
  },

  docType: {
    fontSize: 13,
    fontWeight: '700',
  },

  docNumber: {
    fontSize: 12,
  },

  docExpiry: {
    fontSize: 11,
  },

  docBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
    alignSelf: 'center',
  },

  docBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  actionsBlock: {
    paddingHorizontal: 16,
    marginTop: 28,
    gap: 12,
  },

  sosButton: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  signOutButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signOutText: {
    fontSize: 15,
  },
});