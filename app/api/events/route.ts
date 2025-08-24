import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export const runtime = 'nodejs';

function truncate(str: string | undefined, n = 120) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const type = event.type;
  const actorId: string = event.actorId;
  const notifyUserId: string | undefined = event.notifyUserId;

  if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 });
  // ensure actor exists
  const actorExists = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } });
  if (!actorExists) return NextResponse.json({ error: 'actorId not found' }, { status: 400 });

    // new_post: create a post and notify followers
    if (type === 'new_post') {
      const content = event.text || `New post from user ${actorId}`;
      const now = new Date();
      const post = await prisma.post.create({ 
        data: { 
          authorId: actorId, 
          content,
          createdAt: now 
        } 
      });

      // notify followers
      const followers = await prisma.follow.findMany({ where: { followeeId: actorId } });
      const validFollowerIds = followers.map((f: any) => f.followerId).filter(Boolean);
      if (validFollowerIds.length) {
        const existing = await prisma.user.findMany({ where: { id: { in: validFollowerIds } }, select: { id: true } });
        const existingIds = new Set(existing.map((e: any) => e.id));
        const notifs = followers
          .map((f: { followerId: string }) => ({
            userId: f.followerId,
            type: 'new_post',
            actorId,
            objectType: 'post',
            objectId: post.id,
            text: truncate(content, 140)
          }))
          .filter((n: any) => existingIds.has(n.userId));
        if (notifs.length) await prisma.notification.createMany({ data: notifs });
      }
      // optionally notify a specific user (demo helper)
      if (notifyUserId) {
        // only create if the target exists
        const notifyExists = await prisma.user.findUnique({ where: { id: notifyUserId }, select: { id: true } });
        if (notifyExists) {
          await prisma.notification.create({ data: { userId: notifyUserId, type: 'new_post', actorId, objectType: 'post', objectId: post.id, text: truncate(content, 140) } });
        }
      }
      return NextResponse.json({ ok: true, createdPost: post.id });
    }

    // new_like: like a recent post from targetUserId (if provided), notify post author
    if (type === 'new_like') {
      const targetUserId: string | undefined = event.targetUserId || event.objectId;
      // find a recent post by targetUserId or any recent post
      let post;
      if (targetUserId) {
        // ensure target user exists before searching posts
        const targetExists = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
        if (targetExists) {
          post = await prisma.post.findFirst({ where: { authorId: targetUserId }, orderBy: { createdAt: 'desc' } });
        }
      }
      if (!post) {
        post = await prisma.post.findFirst({ orderBy: { createdAt: 'desc' } });
      }
      if (!post) return NextResponse.json({ error: 'No post available to like' }, { status: 400 });

  // ensure user still exists before creating reaction
  const reactorExists = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } });
  if (!reactorExists) return NextResponse.json({ error: 'actorId not found' }, { status: 400 });
  await prisma.reaction.create({ data: { postId: post.id, userId: actorId, type: 'like' } });
      if (post.authorId !== actorId) {
        await prisma.notification.create({ data: {
          userId: post.authorId,
          type: 'new_like',
          actorId,
          objectType: 'post',
          objectId: post.id,
          text: 'Someone liked your post'
        }});
        // optionally notify a specific user (demo)
        if (notifyUserId && notifyUserId !== post.authorId) {
          await prisma.notification.create({ data: { userId: notifyUserId, type: 'new_like', actorId, objectType: 'post', objectId: post.id, text: event.text || 'Someone liked your post' } });
        }
      }
      return NextResponse.json({ ok: true, likedPost: post.id });
    }

    // new_follow: create follow and notify followee
    if (type === 'new_follow') {
  const followeeId: string | undefined = event.objectId || event.followeeId;
  if (!followeeId) return NextResponse.json({ error: 'followeeId required' }, { status: 400 });
  // ensure followee exists
  const followeeExists = await prisma.user.findUnique({ where: { id: followeeId }, select: { id: true } });
  if (!followeeExists) return NextResponse.json({ error: 'followeeId not found' }, { status: 400 });
      // create follow if not exists
  await prisma.follow.createMany({ data: [{ followerId: actorId, followeeId }], skipDuplicates: true });
      await prisma.notification.create({ data: {
        userId: followeeId,
        type: 'new_follow',
        actorId,
        objectType: 'user',
        objectId: followeeId,
        text: `Started following you`
      }});
      // optionally notify another user as well
      if (notifyUserId && notifyUserId !== followeeId) {
        await prisma.notification.create({ data: { userId: notifyUserId, type: 'new_follow', actorId, objectType: 'user', objectId: followeeId, text: `Started following you` } });
      }
      return NextResponse.json({ ok: true });
    }

    // fallback: store diagnostic event
    await prisma.notification.create({ data: {
      userId: event.userId || actorId,
      type: type || 'unknown',
      actorId,
      objectType: event.objectType || null,
      objectId: event.objectId || null,
      text: event.text || 'event'
    }});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Event error' }, { status: 400 });
  }
}
