import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { ReactNode, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Pagination } from './pagination';
import { TableRowSkeleton } from './skeleton';

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: number | string;
  flex?: number;
  render?: (item: T) => ReactNode;
}

export interface TableAction<T> {
  icon: string;
  color: string;
  onPress: (item: T) => void;
  label?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  // Actions can now be a static array (applied to every row) or a function returning actions per row
  actions?: TableAction<T>[] | ((item: T) => TableAction<T>[]);
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  keyExtractor: (item: T) => string;
  itemsPerPage?: number;
  onSearch?: (searchTerm: string) => T[];
  onDateFilter?: (startDate: Date | null, endDate: Date | null) => T[];
  enableSearch?: boolean;
  enableDateFilter?: boolean;
  searchPlaceholder?: string;
  minWidth?: number;
  headerComponent?: ReactNode;
}

export function Table<T>({
  columns,
  data,
  actions,
  loading = false,
  error,
  emptyMessage = 'Tidak ada data',
  emptyIcon = 'document-outline',
  keyExtractor,
  itemsPerPage = 10,
  onSearch,
  onDateFilter,
  enableSearch = false,
  enableDateFilter = false,
  searchPlaceholder = 'Cari...',
  minWidth,
  headerComponent,
}: TableProps<T>) {
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const tintColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Apply filters
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (enableSearch && searchTerm && onSearch) {
      result = onSearch(searchTerm);
    }

    // Apply date filter
    if (enableDateFilter && (startDate || endDate) && onDateFilter) {
      result = onDateFilter(startDate, endDate);
    }

    return result;
  }, [data, searchTerm, startDate, endDate, onSearch, onDateFilter, enableSearch, enableDateFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleResetFilter = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const formatDateInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const hasActiveFilters = searchTerm !== '' || startDate !== null || endDate !== null;

  const renderItem = ({ item }: { item: T }) => {
    const rowActions = typeof actions === 'function' ? actions(item) : actions;

    return (
    <View style={[styles.tableRow, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      {columns.map((column) => {
        const width = column.width;
        const flex = column.flex;
        const cellStyle = [
          styles.tableCell,
          width ? { width: typeof width === 'number' ? width : undefined } : {},
          flex ? { flex } : {},
        ];

        return (
          <View key={column.key} style={cellStyle}>
            {column.render ? (
              column.render(item)
            ) : (
              <ThemedText style={styles.cellText}>
                {String((item as any)[column.key] ?? '-')}
              </ThemedText>
            )}
          </View>
        );
      })}
      {rowActions && rowActions.length > 0 && (
        <View style={styles.actionCell}>
          <View style={styles.actionButtons}>
            {rowActions.map((action, index) => (
              <Pressable
                key={index}
                style={styles.actionButton}
                onPress={() => action.onPress(item)}
              >
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      {columns.map((column) => {
        const width = column.width;
        const flex = column.flex;
        const cellStyle = [
          styles.tableCell,
          width ? { width: typeof width === 'number' ? width : undefined } : {},
          flex ? { flex } : {},
        ];

        return (
          <View key={column.key} style={cellStyle}>
            <ThemedText style={styles.headerText}>{column.label}</ThemedText>
          </View>
        );
      })}
      {(typeof actions === 'function' || (Array.isArray(actions) && actions.length > 0)) && (
        <View style={styles.actionCell}>
          <ThemedText style={styles.headerText}>Aksi</ThemedText>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {headerComponent}
        <View style={styles.tableContainer}>
          {minWidth ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.tableWrapper, minWidth ? { minWidth } : {}]}>
                {renderHeader()}
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </View>
            </ScrollView>
          ) : (
            <>
              {renderHeader()}
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} />
              ))}
            </>
          )}
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={{ color: '#f44336' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with Filter Button */}
      {(headerComponent || enableSearch || enableDateFilter) && (
        <View style={styles.headerRow}>
          {/* Filter Toggle Button */}
          {(enableSearch || enableDateFilter) && (
            <Pressable
              style={[
                styles.filterToggleButton,
                { backgroundColor: showFilter ? tintColor : cardBg, borderColor },
              ]}
              onPress={() => setShowFilter(!showFilter)}
            >
              <Ionicons
                name="filter"
                size={20}
                color={showFilter ? '#fff' : tintColor}
              />
              <ThemedText
                style={[
                  styles.filterToggleText,
                  { color: showFilter ? '#fff' : tintColor },
                ]}
              >
                Filter
              </ThemedText>
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <ThemedText style={styles.filterBadgeText}>
                    {[searchTerm, startDate, endDate].filter(Boolean).length}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          )}
          
          {/* Header Component (e.g., Add Button) */}
          {headerComponent}
        </View>
      )}

      {/* Filter Panel */}
      {showFilter && (enableSearch || enableDateFilter) && (
        <View style={[styles.filterContainer, { backgroundColor: cardBg, borderColor }]}>
          {/* Search Filter */}
          {enableSearch && (
            <View style={styles.searchContainer}>
              <ThemedText style={styles.filterLabel}>Pencarian:</ThemedText>
              <View style={[styles.searchInputWrapper, { borderColor }]}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#999"
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm !== '' && (
                  <Pressable onPress={() => setSearchTerm('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Date Range Filter */}
          {enableDateFilter && (
            <View style={styles.dateFilterContainer}>
              <View style={styles.dateInputContainer}>
                <ThemedText style={styles.filterLabel}>Dari:</ThemedText>
                <Pressable
                  style={[styles.dateInput, { borderColor }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <ThemedText style={styles.dateText}>
                    {startDate ? formatDateInput(startDate) : 'Pilih tanggal'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={20} color={tintColor} />
                </Pressable>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartPicker(false);
                      if (selectedDate) {
                        setStartDate(selectedDate);
                        setCurrentPage(1);
                      }
                    }}
                  />
                )}
              </View>
              <View style={styles.dateInputContainer}>
                <ThemedText style={styles.filterLabel}>Sampai:</ThemedText>
                <Pressable
                  style={[styles.dateInput, { borderColor }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <ThemedText style={styles.dateText}>
                    {endDate ? formatDateInput(endDate) : 'Pilih tanggal'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={20} color={tintColor} />
                </Pressable>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndPicker(false);
                      if (selectedDate) {
                        setEndDate(selectedDate);
                        setCurrentPage(1);
                      }
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <Pressable style={[styles.resetButton, { borderColor }]} onPress={handleResetFilter}>
              <Ionicons name="refresh" size={18} color="#f44336" />
              <ThemedText style={[styles.resetButtonText, { color: '#f44336' }]}>
                Reset Filter
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {/* Table */}
      <View style={[styles.tableContainer, { backgroundColor: cardBg }]}>
        {minWidth ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.tableWrapper, { minWidth }]}>
              {renderHeader()}
              <FlatList
                data={paginatedData}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name={emptyIcon as any} size={64} color="#ccc" />
                    <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
                  </View>
                }
              />
            </View>
          </ScrollView>
        ) : (
          <>
            {renderHeader()}
            <FlatList
              data={paginatedData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name={emptyIcon as any} size={64} color="#ccc" />
                  <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
                </View>
              }
            />
          </>
        )}

        {filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
  },
  searchContainer: {
    gap: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 14,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  tableWrapper: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionCell: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cellText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
