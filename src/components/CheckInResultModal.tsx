import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { lightTheme, darkTheme } from '../theme/colors';

interface CheckInTicketDetail {
  ticketCode: string;
  ticketType: string;
  status: 'success' | 'already_checked_in' | 'failed';
  message: string;
  previousCheckIn?: {
    checkedInAt: string;
    checkedInBy: string;
    checkerName: string;
    checkInMethod: 'QrCode' | 'FaceRecognition' | 'Other';
  };
}

interface CheckInResultData {
  orderId: string;
  eventId: string;
  customerName: string;
  totalTickets: number;
  successfulCheckins: number;
  alreadyCheckedIn: number;
  checkinDetails: CheckInTicketDetail[];
}

interface CheckInResultModalProps {
  visible: boolean;
  data: CheckInResultData | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onContinue: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const CheckInResultModal: React.FC<CheckInResultModalProps> = ({
  visible,
  data,
  theme,
  onClose,
  onContinue,
}) => {
  const { t } = useTranslation();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  if (!data) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return 'check-circle';
      case 'already_checked_in':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return currentTheme.success;
      case 'already_checked_in':
        return '#FF9500';
      case 'failed':
        return currentTheme.error;
      default:
        return currentTheme.textSecondary;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getCheckInMethodText = (method: string) => {
    switch (method) {
      case 'QrCode':
        return t('checkIn.method.qrCode');
      case 'FaceRecognition':
        return t('checkIn.method.faceRecognition');
      case 'Other':
        return t('checkIn.method.other');
      default:
        return method;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
            <View style={styles.headerLeft}>
              <Icon
                name="face"
                size={28}
                color={currentTheme.primary}
                style={styles.headerIcon}
              />
              <Text style={[styles.title, { color: currentTheme.text }]}>
                {t('checkIn.faceCheckInResult')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.card }]}
              onPress={onClose}
            >
              <Icon name="close" size={20} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.customerName, { color: currentTheme.text }]}>
              {data.customerName}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: currentTheme.success }]}>
                  {data.successfulCheckins}
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                  {t('checkIn.successful')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                  {data.alreadyCheckedIn}
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                  {t('checkIn.alreadyCheckedIn')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: currentTheme.text }]}>
                  {data.totalTickets}
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                  {t('checkIn.totalTickets')}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Details */}
          <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              {t('checkIn.ticketDetails')}
            </Text>
            
            {data.checkinDetails.map((ticket, index) => (
              <View
                key={index}
                style={[styles.ticketItem, { 
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border 
                }]}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketInfo}>
                    <Text style={[styles.ticketCode, { color: currentTheme.text }]}>
                      {ticket.ticketCode}
                    </Text>
                    <Text style={[styles.ticketType, { color: currentTheme.textSecondary }]}>
                      {ticket.ticketType}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: getStatusColor(ticket.status) + '20' 
                  }]}>
                    <Icon
                      name={getStatusIcon(ticket.status)}
                      size={16}
                      color={getStatusColor(ticket.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {t(`checkIn.status.${ticket.status}`)}
                    </Text>
                  </View>
                </View>

                                 {ticket.previousCheckIn && (
                   <View style={[styles.previousCheckIn, { 
                     backgroundColor: currentTheme.card,
                     borderColor: currentTheme.border 
                   }]}>
                     <Text style={[styles.previousLabel, { color: currentTheme.textSecondary }]}>
                       {t('checkIn.previousCheckIn')}:
                     </Text>
                     <Text style={[styles.previousInfo, { color: currentTheme.text }]}>
                       {formatDateTime(ticket.previousCheckIn.checkedInAt)}
                     </Text>
                     <Text style={[styles.previousInfo, { color: currentTheme.text }]}>
                       {t('checkIn.by')} {ticket.previousCheckIn.checkerName}
                     </Text>
                     <Text style={[styles.previousMethod, { color: currentTheme.textSecondary }]}>
                       {getCheckInMethodText(ticket.previousCheckIn.checkInMethod)}
                     </Text>
                   </View>
                 )}
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: currentTheme.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.continueButton, { backgroundColor: currentTheme.primary }]}
              onPress={onContinue}
            >
              <Icon name="camera-alt" size={20} color="#FFFFFF" />
              <Text style={styles.continueButtonText}>
                {t('checkIn.continueScanning')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.backButton, { 
                backgroundColor: currentTheme.card,
                borderColor: currentTheme.border 
              }]}
              onPress={onClose}
            >
              <Icon name="arrow-back" size={20} color={currentTheme.text} />
              <Text style={[styles.backButtonText, { color: currentTheme.text }]}>
                {t('common.goBack')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ticketItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketType: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  previousCheckIn: {
    padding: 16,
    borderTopWidth: 1,
  },
  previousLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  previousInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  previousMethod: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButton: {
    backgroundColor: '#007AFF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckInResultModal; 