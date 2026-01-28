import { useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useAddresses, useCreateAddress } from '@/hooks/use-addresses';
import { useCities, useCountries, useRegions } from '@/hooks/use-locations';
import { AddressCard } from '@/components/address-card';

type Country = { id: string; name_es: string };
type Region = { id: string; name: string };
type City = { id: string; name: string };

export default function AddressesScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [label, setLabel] = useState('');
  const [countryId, setCountryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [cityId, setCityId] = useState('');

  const addressesQuery = useAddresses(accessToken);
  const createAddress = useCreateAddress(accessToken);
  const countriesQuery = useCountries();
  const regionsQuery = useRegions(countryId);
  const citiesQuery = useCities(regionId);

  const countryOptions = countriesQuery.data?.countries ?? [];
  const regionOptions = regionsQuery.data?.regions ?? [];
  const cityOptions = citiesQuery.data?.cities ?? [];

  const isFormValid = useMemo(() => line1 && countryId && regionId && cityId, [line1, countryId, regionId, cityId]);

  const renderAddress = ({ item }: { item: NonNullable<typeof addressesQuery.data>['addresses'][0] }) => (
    <AddressCard address={item} />
  );

  const renderCountry = ({ item }: { item: Country }) => (
    <Pressable
      key={item.id}
      style={[styles.optionRow, { borderColor: colors.cardBorder }]}
      onPress={() => {
        setCountryId(item.id);
        setRegionId('');
        setCityId('');
      }}
    >
      {({ pressed }) => (
        <>
          <ThemedText>{item.name_es}</ThemedText>
          {countryId === item.id ? (
            <IconSymbol name="checkmark" size={18} color={colors.primary} />
          ) : null}
        </>
      )}
    </Pressable>
  );

  const renderRegion = ({ item }: { item: Region }) => (
    <Pressable
      key={item.id}
      style={[styles.optionRow, { borderColor: colors.cardBorder }]}
      onPress={() => {
        setRegionId(item.id);
        setCityId('');
      }}
    >
      {({ pressed }) => (
        <>
          <ThemedText>{item.name}</ThemedText>
          {regionId === item.id ? (
            <IconSymbol name="checkmark" size={18} color={colors.primary} />
          ) : null}
        </>
      )}
    </Pressable>
  );

  const renderCity = ({ item }: { item: City }) => (
    <Pressable
      key={item.id}
      style={[styles.optionRow, { borderColor: colors.cardBorder }]}
      onPress={() => setCityId(item.id)}
    >
      {({ pressed }) => (
        <>
          <ThemedText>{item.name}</ThemedText>
          {cityId === item.id ? (
            <IconSymbol name="checkmark" size={18} color={colors.primary} />
          ) : null}
        </>
      )}
    </Pressable>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{t('addresses.title')}</ThemedText>
      </View>

      <FlashList
        data={addressesQuery.data?.addresses ?? []}
        renderItem={renderAddress}
        estimatedItemSize={100}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ThemedText style={styles.sectionTitle}>{t('addresses.addNew')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={t('addresses.line1')}
              placeholderTextColor={colors.icon}
              value={line1}
              onChangeText={setLine1}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={t('addresses.line2')}
              placeholderTextColor={colors.icon}
              value={line2}
              onChangeText={setLine2}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={t('addresses.label')}
              placeholderTextColor={colors.icon}
              value={label}
              onChangeText={setLabel}
            />

            <ThemedText style={styles.optionLabel}>{t('addresses.country')}</ThemedText>
            <FlashList
              data={countryOptions}
              renderItem={renderCountry}
              estimatedItemSize={48}
              scrollEnabled={false}
              ListEmptyComponent={<ThemedText style={[styles.subText, { color: colors.icon }]}>Loading...</ThemedText>}
            />

            {countryId ? (
              <>
                <ThemedText style={styles.optionLabel}>{t('addresses.region')}</ThemedText>
                <FlashList
                  data={regionOptions}
                  renderItem={renderRegion}
                  estimatedItemSize={48}
                  scrollEnabled={false}
                  ListEmptyComponent={<ThemedText style={[styles.subText, { color: colors.icon }]}>Loading...</ThemedText>}
                />
              </>
            ) : null}

            {regionId ? (
              <>
                <ThemedText style={styles.optionLabel}>{t('addresses.city')}</ThemedText>
                <FlashList
                  data={cityOptions}
                  renderItem={renderCity}
                  estimatedItemSize={48}
                  scrollEnabled={false}
                  ListEmptyComponent={<ThemedText style={[styles.subText, { color: colors.icon }]}>Loading...</ThemedText>}
                />
              </>
            ) : null}

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                !isFormValid && styles.disabledButton,
              ]}
              onPress={() =>
                createAddress.mutate({
                  label,
                  line1,
                  line2: line2 || undefined,
                  cityId,
                  regionId,
                  countryId,
                })
              }
              disabled={!isFormValid}
            >
              {({ pressed }) => (
                <ThemedText
                  style={[
                    styles.primaryButtonText,
                    { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  {t('common.save')}
                </ThemedText>
              )}
            </Pressable>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  subText: { fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  optionLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  primaryButton: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});
