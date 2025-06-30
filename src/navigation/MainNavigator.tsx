import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme } from '../theme';
import { 
  MainTabParamList, 
  EventStackParamList, 
  NewsStackParamList, 
  ProfileStackParamList 
} from '../types';

// Import screen components
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const EventStack = createNativeStackNavigator<EventStackParamList>();
const NewsStack = createNativeStackNavigator<NewsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Event Stack Navigator
const EventsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  
  return (
    // @ts-ignore
    <EventStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <EventStack.Screen
        name="EventsList"
        component={EventsScreen}
        options={{ title: t('navigation.events') }}
      />
      <EventStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: t('events.eventDetails') }}
      />
    </EventStack.Navigator>
  );
};

// News Stack Navigator
const NewsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  
  return (
    // @ts-ignore
    <NewsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <NewsStack.Screen
        name="NewsList"
        component={NewsScreen}
        options={{ title: t('navigation.news') }}
      />
      <NewsStack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ title: t('news.title') }}
      />
    </NewsStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  
  return (
    // @ts-ignore
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: t('navigation.profile') }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('editProfile.title') }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: t('changePassword.title') }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    // @ts-ignore
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Events':
              iconName = 'event';
              break;
            case 'News':
              iconName = 'article';
              break;
            case 'Notifications':
              iconName = 'notifications';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: currentTheme.textSecondary,
        tabBarStyle: {
          backgroundColor: currentTheme.card,
          borderTopColor: currentTheme.border,
        },
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('navigation.home'),
          headerTitle: t('home.title'),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsNavigator}
        options={{
          title: t('navigation.events'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsNavigator}
        options={{
          title: t('navigation.news'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: t('navigation.notifications'),
          headerTitle: t('notifications.title'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: t('navigation.profile'),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 
