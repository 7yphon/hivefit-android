import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0900', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  msg: { color: '#a09060', fontSize: 13, textAlign: 'center' },
});
