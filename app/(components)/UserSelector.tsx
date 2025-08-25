"use client";
import { useUser } from '../context/UserContext';

export default function UserSelector() {
  const { 
    users, 
    selectedUser, 
    setSelectedUser, 
    loading, 
    error, 
    reseedData 
  } = useUser();

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Demo User</h3>
        <div className="text-sm text-gray-500">
          {loading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading users...
            </span>
          ) : (
            `${users.length} users available`
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <label className="block mb-2 font-medium text-gray-700">Select Demo User</label>
          <div className="relative">
            <select
              className={`w-full sm:w-64 px-4 py-2 pr-8 rounded-lg border bg-white
                transition-shadow duration-200 appearance-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${error ? 'border-red-300' : 'border-gray-300'}
                ${loading ? 'animate-pulse' : ''}`}
              value={selectedUser || ''}
              onChange={async (e) => {
                const newUserId = e.target.value || null;
                setSelectedUser(newUserId);
              }}
              disabled={loading}
            >
              <option value="">Choose a user...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {!error && !loading && users.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">No users yet — click "Reseed Data" to populate demo users.</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium text-white shadow-sm 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-indigo-500'}`}
            onClick={reseedData}
            disabled={loading}
            title="Populate demo users, posts and notifications"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Seeding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reseed Data
              </span>
            )}
          </button>
          <a href="/notifications" className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">View Notifications</a>
        </div>
      </div>
      
      {selectedUser && (
        <div className="mt-4 text-sm text-gray-500">
          <p>You can now create and interact with notifications as this user.</p>
        </div>
      )}
    </div>
  );
}
