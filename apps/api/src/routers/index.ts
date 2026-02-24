import { router } from '../trpc';
import { authRouter } from './auth';
import { usersRouter } from './users';
import { uploadRouter } from './upload';
import { postsRouter } from './posts';
import { followsRouter } from './follows';
import { likesRouter } from './likes';
import { commentsRouter } from './comments';
import { notificationsRouter } from './notifications';
import { conversationsRouter } from './conversations';
import { messagesRouter } from './messages';

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  upload: uploadRouter,
  posts: postsRouter,
  follows: followsRouter,
  likes: likesRouter,
  comments: commentsRouter,
  notifications: notificationsRouter,
  conversations: conversationsRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
