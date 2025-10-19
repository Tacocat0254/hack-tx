export interface ParsedGuidance {
  selectionGuidance: string
  setterNotes: string
}

interface RuleMapping {
  keywords: string[]
  guidance?: string
  notes?: string
  priority: number
}

interface MatchedRule {
  rule: RuleMapping
  keyword: string
  confidence: number
}

const GRADE_RULES: Record<string, RuleMapping> = {
  'V0': { keywords: ['v0', 'beginner'], guidance: 'Select jugs and large holds, minimal technical moves', notes: 'Grade V0 - Beginner friendly', priority: 10 },
  'V1': { keywords: ['v1'], guidance: 'Select jugs and large holds, minimal technical moves', notes: 'Grade V1 - Beginner friendly', priority: 10 },
  'V2': { keywords: ['v2'], guidance: 'Select jugs and large holds, minimal technical moves', notes: 'Grade V2 - Beginner friendly', priority: 10 },
  'V3': { keywords: ['v3'], guidance: 'Select medium holds with some technical elements', notes: 'Grade V3 - Intermediate', priority: 10 },
  'V4': { keywords: ['v4'], guidance: 'Select medium holds with technical footwork', notes: 'Grade V4 - Intermediate', priority: 10 },
  'V5': { keywords: ['v5'], guidance: 'Select smaller holds requiring precise technique', notes: 'Grade V5 - Advanced intermediate', priority: 10 },
  'V6': { keywords: ['v6'], guidance: 'Select crimps and small edges, require precise footwork and body tension', notes: 'Grade V6 - Advanced', priority: 10 },
  'V7': { keywords: ['v7'], guidance: 'Select small crimps and technical holds', notes: 'Grade V7 - Advanced', priority: 10 },
  'V8': { keywords: ['v8'], guidance: 'Select very small holds requiring maximum finger strength', notes: 'Grade V8 - Expert', priority: 10 },
  'V9': { keywords: ['v9'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V9 - Expert', priority: 10 },
  'V10': { keywords: ['v10'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V10 - Elite', priority: 10 },
  'V11': { keywords: ['v11'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V11 - Elite', priority: 10 },
  'V12': { keywords: ['v12'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V12 - Elite', priority: 10 },
  'V13': { keywords: ['v13'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V13 - Elite', priority: 10 },
  'V14': { keywords: ['v14'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V14 - Elite', priority: 10 },
  'V15': { keywords: ['v15'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V15 - Elite', priority: 10 },
  'V16': { keywords: ['v16'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V16 - Elite', priority: 10 },
  'V17': { keywords: ['v17'], guidance: 'Select micro crimps and extremely technical holds', notes: 'Grade V17 - Elite', priority: 10 }
}

const MOVE_TYPE_RULES: Record<string, RuleMapping> = {
  'dyno': { keywords: ['dyno', 'dynos', 'dynamic', 'dynamically', 'jump', 'jumping'], guidance: 'Space holds 3+ positions apart requiring dynamic movement', notes: 'Include dynamic moves', priority: 8 },
  'crimp': { keywords: ['crimp', 'crimps', 'crimpy', 'edge', 'edges'], guidance: 'Select small edges and crimps requiring finger strength', notes: 'Focus on crimp holds', priority: 7 },
  'pinch': { keywords: ['pinch', 'pinches', 'pinchy'], guidance: 'Select pinch holds requiring thumb engagement', notes: 'Include pinch holds', priority: 7 },
  'sloper': { keywords: ['sloper', 'slopers', 'slope', 'slopes', 'slopey', 'open hand'], guidance: 'Select sloper holds requiring open hand strength', notes: 'Include sloper holds', priority: 7 },
  'jug': { keywords: ['jug', 'jugs', 'juggy'], guidance: 'Select large jug holds for easier gripping', notes: 'Include jug holds', priority: 6 },
  'compression': { keywords: ['compression', 'compress', 'squeeze', 'squeezing'], guidance: 'Select opposing holds requiring squeezing force', notes: 'Include compression moves', priority: 7 },
  'tension': { keywords: ['tension', 'tensiony', 'tense'], guidance: 'Select holds requiring sustained body tension', notes: 'Include tension moves', priority: 7 },
  'heel': { keywords: ['heel', 'heels', 'heel hook', 'heel hooks'], guidance: 'Include holds suitable for heel hooking', notes: 'Include heel hook opportunities', priority: 6 },
  'toe': { keywords: ['toe', 'toes', 'toe hook', 'toe hooks'], guidance: 'Include holds suitable for toe hooking', notes: 'Include toe hook opportunities', priority: 6 }
}

const STYLE_RULES: Record<string, RuleMapping> = {
  'powerful': { keywords: ['powerful', 'power', 'strong', 'strength'], guidance: 'Select holds requiring powerful movements', notes: 'Focus on powerful climbing', priority: 5 },
  'technical': { keywords: ['technical', 'technique', 'precise', 'precision'], guidance: 'Select holds requiring precise technique and footwork', notes: 'Focus on technical climbing', priority: 5 },
  'balanced': { keywords: ['balanced', 'balance', 'equilibrium'], guidance: 'Select holds requiring good balance and body positioning', notes: 'Focus on balanced climbing', priority: 5 },
  'flowing': { keywords: ['flowing', 'flow', 'smooth', 'fluid'], guidance: 'Select holds that create smooth, flowing movement', notes: 'Focus on flowing movement', priority: 5 },
  'crimpy': { keywords: ['crimpy', 'crimp heavy'], guidance: 'Heavy emphasis on small crimp holds', notes: 'Crimp-focused route', priority: 6 },
  'slopey': { keywords: ['slopey', 'sloper heavy'], guidance: 'Heavy emphasis on sloper holds', notes: 'Sloper-focused route', priority: 6 }
}

const CONSTRAINT_RULES: Record<string, RuleMapping> = {
  'avoid_spans': { keywords: ['avoid spans', 'no spans', 'small spans', 'short spans'], notes: 'Avoid large spans between holds', priority: 9 },
  'left_start': { keywords: ['left hand start', 'left start', 'start left'], notes: 'Left hand start required', priority: 9 },
  'right_start': { keywords: ['right hand start', 'right start', 'start right'], notes: 'Right hand start required', priority: 9 },
  'sit_start': { keywords: ['sit start', 'seated start'], notes: 'Sit start required', priority: 9 },
  'stand_start': { keywords: ['stand start', 'standing start'], notes: 'Stand start required', priority: 9 },
  'top_out': { keywords: ['top out', 'topout', 'finish on top'], notes: 'Include top out finish', priority: 8 },
  'match_finish': { keywords: ['match finish', 'match the finish'], notes: 'Match finish required', priority: 8 }
}

function fuzzyMatch(text: string, keywords: string[]): MatchedRule[] {
  const matches: MatchedRule[] = []
  const lowerText = text.toLowerCase()
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase()
    
    if (lowerText.includes(lowerKeyword)) {
      matches.push({
        rule: { keywords: [keyword], priority: 0 },
        keyword: lowerKeyword,
        confidence: 1.0
      })
      continue
    }
    
    const words = lowerText.split(/\s+/)
    for (const word of words) {
      if (word.includes(lowerKeyword) || lowerKeyword.includes(word)) {
        const similarity = Math.min(word.length, lowerKeyword.length) / Math.max(word.length, lowerKeyword.length)
        if (similarity > 0.6) {
          matches.push({
            rule: { keywords: [keyword], priority: 0 },
            keyword: word,
            confidence: similarity
          })
        }
      }
    }
  }
  
  return matches
}

function resolveConflicts(matches: MatchedRule[]): MatchedRule[] {
  const resolved: MatchedRule[] = []
  const seenRules = new Set<string>()
  
  matches.sort((a, b) => {
    if (a.rule.priority !== b.rule.priority) {
      return b.rule.priority - a.rule.priority
    }
    return b.confidence - a.confidence
  })
  
  for (const match of matches) {
    const ruleKey = Object.keys(GRADE_RULES).find(key => GRADE_RULES[key] === match.rule) ||
                   Object.keys(MOVE_TYPE_RULES).find(key => MOVE_TYPE_RULES[key] === match.rule) ||
                   Object.keys(STYLE_RULES).find(key => STYLE_RULES[key] === match.rule) ||
                   Object.keys(CONSTRAINT_RULES).find(key => CONSTRAINT_RULES[key] === match.rule)
    
    if (ruleKey && !seenRules.has(ruleKey)) {
      seenRules.add(ruleKey)
      resolved.push(match)
    }
  }
  
  return resolved
}

function combineGuidance(matches: MatchedRule[]): string {
  const guidanceParts: string[] = []
  
  for (const match of matches) {
    if (match.rule.guidance) {
      guidanceParts.push(match.rule.guidance)
    }
  }
  
  return guidanceParts.join('. ')
}

export function parsePromptToGuidance(prompt: string): ParsedGuidance {
  const allMatches: MatchedRule[] = []
  
  for (const rule of Object.values(GRADE_RULES)) {
    const matches = fuzzyMatch(prompt, rule.keywords)
    for (const match of matches) {
      match.rule = rule
      allMatches.push(match)
    }
  }
  
  for (const rule of Object.values(MOVE_TYPE_RULES)) {
    const matches = fuzzyMatch(prompt, rule.keywords)
    for (const match of matches) {
      match.rule = rule
      allMatches.push(match)
    }
  }
  
  for (const rule of Object.values(STYLE_RULES)) {
    const matches = fuzzyMatch(prompt, rule.keywords)
    for (const match of matches) {
      match.rule = rule
      allMatches.push(match)
    }
  }
  
  for (const rule of Object.values(CONSTRAINT_RULES)) {
    const matches = fuzzyMatch(prompt, rule.keywords)
    for (const match of matches) {
      match.rule = rule
      allMatches.push(match)
    }
  }
  
  const resolvedMatches = resolveConflicts(allMatches)
  
  return {
    selectionGuidance:
      combineGuidance(resolvedMatches) ||
      'Create a well-balanced route with varied hold types',
    setterNotes: prompt,
  }
}
