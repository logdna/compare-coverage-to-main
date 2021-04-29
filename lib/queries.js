'use strict'

const GET_ISSUES_QUERY = `
query getIssues($owner: String!, $repo: String!, $issue_id: Int!) {
  repository(owner:$owner, name:$repo) {
    id
    pullRequest(number: $issue_id) {
      comments(last: 100) {
        pageInfo {
          startCursor
          hasNextPage
        }
        totalCount
        nodes {
          id
          body
          isMinimized
        }
      }
    }
  }
}
`

const HIDE_COMMENTS_QUERY = `
mutation hideComment($id: ID, $classifier:ReportedContentClassifiers) {
  minimizeComment(input: {classifier: $classifier, subjectId: $id}) {
    minimizedComment {
      isMinimized
      minimizedReason
      ... on IssueComment {
        body
      }
    }
  }
}
`

module.exports = {
  GET_ISSUES_QUERY
, HIDE_COMMENTS_QUERY
}
