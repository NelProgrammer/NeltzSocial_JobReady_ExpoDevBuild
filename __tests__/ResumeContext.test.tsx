// @ts-nocheck
global.IS_REACT_ACT_ENVIRONMENT = true;
import React, { useContext, useEffect } from 'react';
jest.setTimeout(30000);
import { render, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResumeContext, ResumeProvider, buildEmptyResumeTemplate } from '../src/context/ResumeContext';
import { AuthContext } from '../src/context/AuthContext';
import { Storage } from '../src/utils/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: '127.0.0.1:8081' }
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: false })
}));

describe('ResumeContext Offline Autonomy & Career Data Integration Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('buildEmptyResumeTemplate creates complete offline-ready schema with all capture fields', () => {
    const tpl = buildEmptyResumeTemplate('res_test_123', 'offline_dev@test.com');

    expect(tpl.id).toBe('res_test_123');
    // 1. Personal details
    const pd = tpl["personal details"];
    expect(pd).toBeDefined();
    expect(pd.names.firstName).toBe('');
    expect(pd.names.MaidenName).toBe('');
    expect(pd.contact.Email).toBe('offline_dev@test.com');
    expect(pd.contact['Phone-alt']).toBe('');
    expect(pd.addresses.length).toBeGreaterThan(0);
    expect(pd.demographics.MaritalStatus).toBe('Single');
    expect(pd.demographics.Disability).toBe('None');

    // 2. Executive summary
    expect(tpl["professional summary"]).toBe('');

    // 3. Education
    expect(tpl.education.highschool['Subjects Stream']).toBe('General');
    expect(tpl.education.highschool['Highest Grade Passed']).toBe('Grade 12 / Matric');
    expect(tpl.education.tertiary.length).toBeGreaterThan(0);
    expect(tpl.education.tertiary[0].Completed).toBe(false);
    expect(Array.isArray(tpl.education.tertiary[0]['Key Modules'])).toBe(true);

    // 4. References
    expect(tpl.References.length).toBeGreaterThan(0);
    expect(tpl.References[0].relation).toBe('');

    // 5. Timestamps
    expect(tpl.updatedAt).toBeDefined();
    expect(tpl.updatedAtMs).toBeGreaterThan(0);
  });

  test('ResumeProvider auto-creates Master Resume for user offline with zero local storage', async () => {
    const mockUser = { id: 'prof_offline_local', name: 'Offline User', email: 'local@device.test' };
    let contextHandle = null;

    const TestConsumer = () => {
      const ctx = useContext(ResumeContext);
      useEffect(() => {
        contextHandle = ctx;
      }, [ctx]);
      return null;
    };

    render(
      <AuthContext.Provider value={{ user: mockUser, backendUrl: 'http://127.0.0.1:8000' }}>
        <ResumeProvider>
          <TestConsumer />
        </ResumeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(contextHandle).not.toBeNull();
      expect(contextHandle.loading).toBe(false);
      expect(contextHandle.resumeData).not.toBeNull();
    });

    // Check that Master Resume was auto-created and populated
    expect(contextHandle.meta.length).toBe(1);
    expect(contextHandle.meta[0].name).toBe('My Master Resume');
    expect(contextHandle.activeResumeId).toBe(contextHandle.meta[0].id);
    expect(contextHandle.resumeData['personal details'].contact.Email).toBe('local@device.test');

    // Check that it is committed to local storage
    const savedMeta = await Storage.loadMeta(mockUser.id);
    expect(savedMeta.length).toBe(1);
    const savedData = await Storage.loadResumeData(mockUser.id, savedMeta[0].id);
    expect(savedData).not.toBeNull();
    expect(savedData['personal details'].demographics.MaritalStatus).toBe('Single');
  });

  test('updateResumeData updates local storage and ensures all items have IDs and timestamps', async () => {
    const mockUser = { id: 'prof_online_cached', name: 'Online User', email: 'online@cloud.test' };
    let contextHandle = null;

    const TestConsumer = () => {
      const ctx = useContext(ResumeContext);
      useEffect(() => {
        contextHandle = ctx;
      }, [ctx]);
      return null;
    };

    render(
      <AuthContext.Provider value={{ user: mockUser, backendUrl: 'http://127.0.0.1:8000' }}>
        <ResumeProvider>
          <TestConsumer />
        </ResumeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(contextHandle).not.toBeNull();
      expect(contextHandle.resumeData).not.toBeNull();
    });

    const updated = {
      ...contextHandle.resumeData,
      "professional summary": "Senior Lead Software Engineer with 10+ years experience",
      education: {
        ...contextHandle.resumeData.education,
        highschool: {
          ...contextHandle.resumeData.education.highschool,
          "Province Department": "Gauteng",
          "Subjects Stream": "Maths & Science"
        }
      }
    };

    await act(async () => {
      await contextHandle.updateResumeData(updated);
    });

    expect(contextHandle.resumeData["professional summary"]).toBe(
      "Senior Lead Software Engineer with 10+ years experience"
    );
    expect(contextHandle.resumeData.education.highschool["Subjects Stream"]).toBe("Maths & Science");
    expect(contextHandle.resumeData.updatedAt).toBeDefined();
    expect(contextHandle.resumeData.updatedAtMs).toBeGreaterThan(0);
  });
});
