import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewsDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>News Detail Screen - To be implemented</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { fontSize: 16, color: '#666' },
});

export default NewsDetailScreen; 
