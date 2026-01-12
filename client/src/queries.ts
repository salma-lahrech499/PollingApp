import { gql } from '@apollo/client'

export const GET_POLLS = gql`
  query GetPolls {
    polls {
      id
      title
      creatorName
      isAnonymousCreator
      createdAt
      voteCount
      userHasVoted
      options {
        id
        text
      }
    }
  }
`

export const GET_POLL = gql`
  query GetPoll($id: ID!) {
    poll(id: $id) {
      id
      title
      creatorName
      isAnonymousCreator
      createdAt
      voteCount
      userHasVoted
      options {
        id
        text
      }
      results {
        optionId
        optionText
        voteCount
        percentage
      }
    }
  }
`

export const CREATE_POLL = gql`
  mutation CreatePoll($input: CreatePollInput!) {
    createPoll(input: $input) {
      id
      title
      creatorName
      isAnonymousCreator
      createdAt
      options {
        id
        text
      }
    }
  }
`

export const VOTE = gql`
  mutation Vote($input: VoteInput!) {
    vote(input: $input) {
      success
      message
      poll {
        id
        userHasVoted
        voteCount
        results {
          optionId
          optionText
          voteCount
          percentage
        }
      }
    }
  }
`

