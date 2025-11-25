import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const disabledColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'text');

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          Menampilkan {startItem}-{endItem} dari {totalItems} data
        </ThemedText>
      </View>

      <View style={styles.paginationContainer}>
        <Pressable
          style={[
            styles.navButton,
            { borderColor },
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon
            name="chevron-left"
            size={20}
            color={currentPage === 1 ? disabledColor : textColor}
          />
        </Pressable>

        <View style={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <View key={`ellipsis-${index}`} style={styles.ellipsis}>
                  <ThemedText style={styles.ellipsisText}>...</ThemedText>
                </View>
              );
            }

            const isActive = page === currentPage;

            return (
              <Pressable
                key={page}
                style={[
                  styles.pageButton,
                  { borderColor },
                  isActive && { backgroundColor: primaryColor, borderColor: primaryColor },
                ]}
                onPress={() => onPageChange(page as number)}
              >
                <ThemedText
                  style={[
                    styles.pageButtonText,
                    isActive && { color: '#fff' },
                  ]}
                >
                  {page}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.navButton,
            { borderColor },
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Icon
            name="chevron-right"
            size={20}
            color={currentPage === totalPages ? disabledColor : textColor}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 6,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ellipsis: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ellipsisText: {
    fontSize: 14,
  },
});
