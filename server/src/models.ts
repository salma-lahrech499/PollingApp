import db from './database';
import { v4 as uuidv4 } from 'uuid';

export interface Poll {
  id: string;
  title: string;
  creatorId: string | null;
  creatorName: string | null;
  isAnonymousCreator: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
  voteCount: number;
  userHasVoted: boolean;
}

export const PollModel = {
  create: (title: string, options: string[], creatorId?: string, creatorName?: string, isAnonymousCreator: boolean = false): Poll => {
    const pollId = uuidv4();
    const now = new Date().toISOString();

    // Insert poll
    db.prepare(`
      INSERT INTO polls (id, title, creator_id, creator_name, is_anonymous_creator, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(pollId, title, creatorId || null, creatorName || null, isAnonymousCreator ? 1 : 0, now);

    // Insert options
    const insertOption = db.prepare(`
      INSERT INTO poll_options (id, poll_id, text)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((options: string[]) => {
      for (const optionText of options) {
        insertOption.run(uuidv4(), pollId, optionText);
      }
    });

    insertMany(options);

    return {
      id: pollId,
      title,
      creatorId: creatorId || null,
      creatorName: creatorName || null,
      isAnonymousCreator,
      createdAt: now
    };
  },

  findById: (id: string): PollWithOptions | null => {
    const pollRow = db.prepare('SELECT * FROM polls WHERE id = ?').get(id) as any;
    
    if (!pollRow) return null;

    // Map database row (snake_case) to interface (camelCase) and convert boolean
    const poll: Poll = {
      id: pollRow.id,
      title: pollRow.title,
      creatorId: pollRow.creator_id,
      creatorName: pollRow.creator_name,
      isAnonymousCreator: Boolean(pollRow.is_anonymous_creator),
      createdAt: pollRow.created_at
    };

    const options = db.prepare('SELECT * FROM poll_options WHERE poll_id = ?').all(poll.id) as PollOption[];
    
    const voteCount = db.prepare(`
      SELECT COUNT(*) as count FROM votes WHERE poll_id = ?
    `).get(poll.id) as { count: number } | undefined;

    return {
      ...poll,
      options,
      voteCount: voteCount?.count || 0,
      userHasVoted: false
    };
  },

  findAll: (): PollWithOptions[] => {
    const pollRows = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all() as any[];
    
    return pollRows.map(pollRow => {
      // Map database row (snake_case) to interface (camelCase) and convert boolean
      const poll: Poll = {
        id: pollRow.id,
        title: pollRow.title,
        creatorId: pollRow.creator_id,
        creatorName: pollRow.creator_name,
        isAnonymousCreator: Boolean(pollRow.is_anonymous_creator),
        createdAt: pollRow.created_at
      };

      const options = db.prepare('SELECT * FROM poll_options WHERE poll_id = ?').all(poll.id) as PollOption[];
      const voteCount = db.prepare(`
        SELECT COUNT(*) as count FROM votes WHERE poll_id = ?
      `).get(poll.id) as { count: number } | undefined;

      return {
        ...poll,
        options,
        voteCount: voteCount?.count || 0,
        userHasVoted: false
      };
    });
  },

  checkUserVoted: (pollId: string, userId: string): boolean => {
    const vote = db.prepare('SELECT id FROM votes WHERE poll_id = ? AND user_id = ?').get(pollId, userId);
    return !!vote;
  },

  getUserVote: (pollId: string, userId: string): Vote | null => {
    return db.prepare('SELECT * FROM votes WHERE poll_id = ? AND user_id = ?').get(pollId, userId) as Vote | null;
  }
};

export const VoteModel = {
  create: (pollId: string, optionId: string, userId: string, isAnonymous: boolean): Vote => {
    // Check if user already voted
    const existingVote = PollModel.checkUserVoted(pollId, userId);
    if (existingVote) {
      throw new Error('User has already voted on this poll');
    }

    // Verify option belongs to poll
    const option = db.prepare('SELECT * FROM poll_options WHERE id = ? AND poll_id = ?').get(optionId, pollId);
    if (!option) {
      throw new Error('Invalid option for this poll');
    }

    const voteId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO votes (id, poll_id, option_id, user_id, is_anonymous, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(voteId, pollId, optionId, userId, isAnonymous ? 1 : 0, now);

    return {
      id: voteId,
      pollId,
      optionId,
      userId,
      isAnonymous,
      createdAt: now
    };
  },

  getPollResults: (pollId: string): { optionId: string; optionText: string; voteCount: number; percentage: number }[] => {
    const totalVotes = db.prepare(`
      SELECT COUNT(*) as count FROM votes WHERE poll_id = ?
    `).get(pollId) as { count: number } | undefined;

    const total = totalVotes?.count || 0;

    const results = db.prepare(`
      SELECT 
        po.id as optionId,
        po.text as optionText,
        COUNT(v.id) as voteCount
      FROM poll_options po
      LEFT JOIN votes v ON po.id = v.option_id AND v.poll_id = ?
      WHERE po.poll_id = ?
      GROUP BY po.id, po.text
      ORDER BY voteCount DESC
    `).all(pollId, pollId) as { optionId: string; optionText: string; voteCount: number }[];

    return results.map(result => ({
      ...result,
      voteCount: result.voteCount || 0,
      percentage: total > 0 ? Math.round((result.voteCount / total) * 100) : 0
    }));
  }
};

