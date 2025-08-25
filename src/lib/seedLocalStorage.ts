import * as db from './dataStore';

const demoUsers = [
  { name: 'Alice Cooper', bio: 'Tech enthusiast & coffee lover' },
  { name: 'Bob Smith', bio: 'Software engineer by day' },
  { name: 'Carol Davis', bio: 'Digital artist & gamer' },
  { name: 'David Lee', bio: 'Full-stack developer' },
  { name: 'Eva Green', bio: 'UI/UX designer' },
  { name: 'Frank Wilson', bio: 'Backend architect & system designer' },
  { name: 'Grace Chen', bio: 'Mobile app developer & AWS expert' },
  { name: 'Henry Wright', bio: 'DevOps engineer & container specialist' },
  { name: 'Isabel Kim', bio: 'Data scientist & ML researcher' },
  { name: 'Jack Thompson', bio: 'Security expert & blockchain developer' }
];

const demoPostContents = [
  'Just launched my new project! Check it out!',
  'Learning TypeScript has been amazing.',
  'Who else is excited about the new Next.js features?',
  'Working on some cool AI integrations today.',
  'Finally fixed that tricky bug! 🎉'
];

export const seedLocalStorage = () => {
  // Clear existing data
  db.clearDB();

  // Create users
  const users = demoUsers.map(user => db.createUser(user));

  // Create posts
  users.forEach(user => {
    const randomContent = demoPostContents[Math.floor(Math.random() * demoPostContents.length)];
    db.createPost({
      authorId: user.id,
      content: randomContent
    });
  });

  // Create some follows
  users.forEach((user, i) => {
    const nextUser = users[(i + 1) % users.length]; // Follow next user in circle
    db.createFollow(user.id, nextUser.id);
  });

  // Create some reactions
  const posts = db.getPosts();
  users.forEach(user => {
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    db.createReaction({
      userId: user.id,
      postId: randomPost.id,
      type: 'like'
    });
  });

  // Create notifications for follows and likes
  const follows = db.getFollows();
  const reactions = db.getReactions();

  follows.forEach(follow => {
    const actor = users.find(u => u.id === follow.followerId);
    if (actor) {
      db.createNotification({
        userId: follow.followeeId,
        type: 'follow',
        actorId: actor.id,
        text: `${actor.name} started following you`
      });
    }
  });

  reactions.forEach(reaction => {
    const post = posts.find(p => p.id === reaction.postId);
    const actor = users.find(u => u.id === reaction.userId);
    if (post && actor) {
      db.createNotification({
        userId: post.authorId,
        type: 'like',
        actorId: actor.id,
        text: `${actor.name} liked your post`,
        objectType: 'post',
        objectId: post.id
      });
    }
  });

  return {
    users: users.length,
    posts: posts.length,
    follows: follows.length,
    reactions: reactions.length,
    notifications: db.getNotifications('').length
  };
};
