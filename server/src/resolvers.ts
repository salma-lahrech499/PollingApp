import { PollModel, VoteModel } from './models';
import { generateUserId, generateAnonymousUserId } from './database';
import db from './database';

// Simple user session storage (in production, use proper session management)
const userSessions = new Map<string, string>();

function getOrCreateUserId(context: any): string {
  const sessionId = context.sessionId || 'default';
  
  if (!userSessions.has(sessionId)) {
    userSessions.set(sessionId, generateUserId());
  }
  
  return userSessions.get(sessionId)!;
}

export const resolvers = {
  Query: {
    polls: async () => {
      return PollModel.findAll();
    },

    poll: async (_: any, { id }: { id: string }, context: any) => {
      const poll = PollModel.findById(id);
      if (!poll) {
        return null;
      }

      const userId = getOrCreateUserId(context);
      const userHasVoted = PollModel.checkUserVoted(id, userId);

      const results = VoteModel.getPollResults(id);

      return {
        ...poll,
        userHasVoted,
        results
      };
    }
  },

  Mutation: {
    createPoll: async (_: any, { input }: { input: any }, context: any) => {
      const { title, options, creatorName, isAnonymousCreator } = input;
      
      if (!title || !options || options.length < 2) {
        throw new Error('Poll must have a title and at least 2 options');
      }

      const userId = getOrCreateUserId(context);
      const creator = isAnonymousCreator ? undefined : (creatorName || 'Anonymous');

      const poll = PollModel.create(
        title,
        options,
        isAnonymousCreator ? null : userId,
        creator,
        isAnonymousCreator
      );

      const pollWithData = PollModel.findById(poll.id);
      if (!pollWithData) {
        throw new Error('Failed to create poll');
      }

      const results = VoteModel.getPollResults(poll.id);

      return {
        ...pollWithData,
        userHasVoted: false,
        results
      };
    },

    vote: async (_: any, { input }: { input: any }, context: any) => {
      const { pollId, optionId, isAnonymous, anonymousUserId } = input;

      // For anonymous votes, use client-provided anonymousUserId (can't be traced)
      // If not provided, fall back to server-side generation (still can't be traced)
      let userId: string;
      
      if (isAnonymous) {
        if (anonymousUserId) {
          // Use client-provided anonymous ID (truly untraceable)
          userId = anonymousUserId;
        } else {
          // Fallback: create a one-way hash (still can't be traced back)
          const userAgent = context.req?.headers['user-agent'] || '';
          const ip = context.req?.ip || context.req?.connection?.remoteAddress || '';
          userId = generateAnonymousUserId(pollId, userAgent, ip);
        }
      } else {
        userId = getOrCreateUserId(context);
      }

      try {
        await VoteModel.create(pollId, optionId, userId, isAnonymous);

        // Return updated poll
        const poll = PollModel.findById(pollId);
        if (!poll) {
          throw new Error('Poll not found');
        }

        const userHasVoted = PollModel.checkUserVoted(pollId, userId);
        const results = VoteModel.getPollResults(pollId);

        return {
          success: true,
          message: 'Vote recorded successfully',
          poll: {
            ...poll,
            userHasVoted,
            results
          }
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Failed to record vote',
          poll: null
        };
      }
    }
  }
};

