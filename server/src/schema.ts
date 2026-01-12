import gql from 'graphql-tag';

export const typeDefs = gql`
  type Poll {
    id: ID!
    title: String!
    creatorName: String
    isAnonymousCreator: Boolean!
    createdAt: String!
    options: [PollOption!]!
    voteCount: Int!
    userHasVoted: Boolean!
    results: [PollResult!]!
  }

  type PollOption {
    id: ID!
    text: String!
  }

  type PollResult {
    optionId: ID!
    optionText: String!
    voteCount: Int!
    percentage: Float!
  }

  input CreatePollInput {
    title: String!
    options: [String!]!
    creatorName: String
    isAnonymousCreator: Boolean!
    allowAnonymousVoting: Boolean!
  }

  input VoteInput {
    pollId: ID!
    optionId: ID!
    isAnonymous: Boolean!
    anonymousUserId: String
  }

  type Mutation {
    createPoll(input: CreatePollInput!): Poll!
    vote(input: VoteInput!): VoteResponse!
  }

  type VoteResponse {
    success: Boolean!
    message: String!
    poll: Poll
  }

  type Query {
    polls: [Poll!]!
    poll(id: ID!): Poll
  }
`;

