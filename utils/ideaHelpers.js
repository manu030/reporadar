// Utility functions for idea card functionality

// Star threshold constants
export const STAR_THRESHOLDS = {
  HIGH: 50000,
  MEDIUM: 10000
};

// Difficulty badge configuration
export const getDifficultyBadge = (difficulty, locale, t) => {
  const normalizedDifficulty = difficulty?.toLowerCase() || '';
  
  // Check for easy difficulty
  if (normalizedDifficulty.includes('fácil') || normalizedDifficulty.includes('easy')) {
    return { 
      emoji: '⚡', 
      text: t.easy, 
      bgColor: 'bg-success', 
      level: 'easy' 
    };
  }
  
  // Check for hard difficulty
  if (normalizedDifficulty.includes('difícil') || normalizedDifficulty.includes('hard')) {
    return { 
      emoji: '🔥', 
      text: t.hard, 
      bgColor: 'bg-accent', 
      level: 'hard' 
    };
  }
  
  // Default to medium
  return { 
    emoji: '⭐', 
    text: t.medium, 
    bgColor: 'bg-warning', 
    level: 'medium' 
  };
};

// Normalize idea data handling both old and new formats
export const normalizeIdeaData = (idea, t) => {
  if (typeof idea === 'string') {
    return {
      idea_oneliner: idea,
      idea_problem: t.problemTbd || 'Problem to be defined',
      idea_solution: t.solutionTbd || 'Solution to be defined',
      idea_business_model: t.modelTbd || 'Model to be defined',
      idea_difficulty: t.medium || 'Medium - Legacy data'
    };
  }
  
  if (!idea || typeof idea !== 'object') {
    return {
      idea_oneliner: t.noIdea || 'No idea available',
      idea_problem: t.problemTbd || 'Problem to be defined',
      idea_solution: t.solutionTbd || 'Solution to be defined',
      idea_business_model: t.modelTbd || 'Model to be defined',
      idea_difficulty: t.medium || 'Medium'
    };
  }
  
  return {
    // Support both old format (idea_*) and new format (*)
    idea_oneliner: idea.idea_oneliner || idea.oneliner || t.noIdea || 'No idea available',
    idea_description: idea.idea_description || idea.description,
    idea_problem: idea.idea_problem || idea.problem || t.problemTbd || 'Problem to be defined',
    idea_solution: idea.idea_solution || idea.solution || t.solutionTbd || 'Solution to be defined',
    idea_business_model: idea.idea_business_model || idea.business_model || t.modelTbd || 'Model to be defined',
    idea_difficulty: idea.idea_difficulty || idea.difficulty || t.medium || 'Medium'
  };
};

// Star context helper
export const getStarContext = (stars, locale) => {
  if (stars > STAR_THRESHOLDS.HIGH) {
    return locale === 'en' ? '⭐ Very popular in the community' : '⭐ Muy popular en la comunidad';
  }
  if (stars > STAR_THRESHOLDS.MEDIUM) {
    return locale === 'en' ? '🌟 Popular among developers' : '🌟 Popular entre desarrolladores';
  }
  return locale === 'en' ? '🚀 Emerging project' : '🚀 Proyecto emergente';
};