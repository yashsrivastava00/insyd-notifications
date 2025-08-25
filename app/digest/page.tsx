
"use client";
import { useState } from 'react';
import * as db from '@/lib/localStorageDB';

export default function DigestPage() {
  const [digest, setDigest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return 'never';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }

  function generateDigest() {
    setLoading(true);
    setError('');
    setDigest('');
    const userId = typeof window !== 'undefined' ? localStorage.getItem('insyd_user') : null;
    if (!userId) {
      setError('Select a user first.');
      setLoading(false);
      return;
    }

    // Get notifications and activities from localStorage
    const notifications = db.getNotifications(userId, { sort: 'ai', unreadOnly: true });

    // Get posts, likes and follows from the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const posts = db.getPosts().filter(p => p.authorId === userId && new Date(p.createdAt) >= sevenDaysAgo);
    const reactions = db.getReactions().filter(r => r.userId === userId && r.type === 'like');
    const follows = db.getFollows().filter(f => f.followerId === userId);

    // Get latest timestamps
    const lastPost = posts.length > 0 ? Math.max(...posts.map(p => new Date(p.createdAt).getTime())) : null;
    const lastLike = reactions.length > 0 ? Math.max(...reactions.map(r => new Date(r.createdAt || '').getTime())) : null;
    const lastFollow = follows.length > 0 ? Math.max(...follows.map(f => new Date(f.createdAt || '').getTime())) : null;

    // Group notifications by type
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }

    const summary = `Today: ${counts['new_follow'] || 0} new follows, ${counts['new_like'] || 0} likes, ${counts['new_comment'] || 0} comments, ${counts['new_post'] || 0} new posts.`
      + `\nActions performed (last 7 days): ${posts.length} posts made (last: ${formatRelativeTime(lastPost ? new Date(lastPost).toISOString() : null)}), ${reactions.length} likes given (last: ${formatRelativeTime(lastLike ? new Date(lastLike).toISOString() : null)}), ${follows.length} follows made (last: ${formatRelativeTime(lastFollow ? new Date(lastFollow).toISOString() : null)}).`;
    
    setDigest(summary);
    setLoading(false);
  }

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold mb-4">Digest</h1>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={generateDigest} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Digest'}
      </button>
      {digest && <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-line">{digest}</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </main>
  );
}
