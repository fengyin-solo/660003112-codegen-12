export interface NFAState {
  id: number
  isStart: boolean
  isAccept: boolean
  x: number
  y: number
}

export interface NFATransition {
  from: number
  to: number
  symbol: string | null // null = epsilon
  label: string
}

export interface NFA {
  states: NFAState[]
  transitions: NFATransition[]
  startState: number
  acceptStates: number[]
}

export interface MatchStep {
  stepIndex: number
  charIndex: number
  char: string
  currentState: number
  nextState: number
  transition: string
  isBacktrack: boolean
  isMatch: boolean
}

export interface MatchResult {
  matched: boolean
  matchText: string
  groups: string[]
  steps: MatchStep[]
  backtracks: number
  totalSteps: number
  duration: number
}

export interface RegexTemplate {
  name: string
  pattern: string
  description: string
  testString: string
  category: string
}

export interface ASTNode {
  type: 'char' | 'star' | 'plus' | 'question' | 'or' | 'concat' | 'group' | 'dot' | 'anchor' | 'charclass' | 'digit' | 'word' | 'space'
  value?: string
  children?: ASTNode[]
  groupIndex?: number
}

export interface BatchTestItem {
  id: number
  text: string
  expected: boolean | null
  matched: boolean
  matchText: string
  groups: string[]
  duration: number
}

export interface BatchGroupStat {
  label: string
  count: number
  percent: number
  color: string
}

export interface DetailedGroupStats {
  matchedExpected: BatchTestItem[]
  matchedUnexpected: BatchTestItem[]
  unmatchedExpected: BatchTestItem[]
  unmatchedUnexpected: BatchTestItem[]
  noExpectationMatched: BatchTestItem[]
  noExpectationUnmatched: BatchTestItem[]
}

export interface BatchTestResult {
  items: BatchTestItem[]
  total: number
  matchedCount: number
  unmatchedCount: number
  hitRate: number
  groups: BatchGroupStat[]
  detailedGroups: BatchGroupStat[]
  anomalies: BatchTestItem[]
  falsePositives: BatchTestItem[]
  falseNegatives: BatchTestItem[]
  hasExpectations: boolean
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  truePositives: number
  trueNegatives: number
  falsePositiveCount: number
  falseNegativeCount: number
  detailedStats: DetailedGroupStats
}
