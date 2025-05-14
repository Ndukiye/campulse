import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AuthScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth Screen</Text>
      <Text>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default AuthScreen; 