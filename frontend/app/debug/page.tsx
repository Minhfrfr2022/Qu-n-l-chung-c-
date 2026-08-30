"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState<any>({
    connection: 'Checking...',
    session: null,
    profilesTable: 'Checking...',
    error: null
  });

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    try {
      // 1. Check connection
      const connectionTest = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      // 2. Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // 3. Try to query profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      setStatus({
        connection: connectionTest.error ? 'Failed' : 'Connected',
        connectionError: connectionTest.error,
        session: session ? {
          user_id: session.user.id,
          email: session.user.email
        } : null,
        profilesTable: profileError ? 'Error' : 'OK',
        profilesCount: connectionTest.count,
        profilesSample: profiles,
        profileError: profileError ? {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        } : null
      });
    } catch (error: any) {
      setStatus({
        connection: 'Failed',
        error: error.message
      });
    }
  };

  const createTestProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Please login first');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        username: 'testuser',
        full_name: 'Test User',
        email: session.user.email,
        role: 'user'
      })
      .select();

    if (error) {
      alert(`Error creating profile: ${error.message}`);
    } else {
      alert('Profile created successfully!');
      checkSupabaseStatus();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Debug Page</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
          </div>
          <div>
            <strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-10) : 'Not set'}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-4">Status</h2>
        <pre className="bg-white p-4 rounded overflow-auto text-xs">
          {JSON.stringify(status, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <button
          onClick={checkSupabaseStatus}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        >
          Refresh Status
        </button>
        
        <button
          onClick={createTestProfile}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Create Test Profile for Current User
        </button>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-semibold mb-2">Setup Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure you've run the SQL from SUPABASE_SETUP.md in your Supabase SQL Editor</li>
          <li>Create a test user in Supabase Auth (or sign up through the app)</li>
          <li>The profile should be created automatically via trigger, or use the button above</li>
          <li>Check the status above to verify everything is working</li>
        </ol>
      </div>
    </div>
  );
}
