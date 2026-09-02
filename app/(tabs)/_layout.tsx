import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          display: isDesktop ? 'none' : 'flex',
          backgroundColor: '#FFFFFF',
          borderTopColor: '#BAE6FD',
          borderTopWidth: 1.5,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#0369A1',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Banks & Cash',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans & Debts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Paper Assets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
