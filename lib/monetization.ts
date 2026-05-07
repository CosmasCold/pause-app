// lib/monetization.ts
export const PREMIUM_FEATURES = {
  basic: {
    analyses_per_day: 3,
    max_text_length: 1000,
    features: ['basic_bias_detection', 'regret_score', 'reflective_questions']
  },
  pro: {
    price: '$8/month',
    analyses_per_day: Infinity,
    max_text_length: 5000,
    features: [
      'advanced_bias_detection',
      'tone_shift_analysis',
      'suggested_rephrases',
      'saved_analyses',
      'export_reports',
      'custom_reflection_prompts'
    ]
  },
  team: {
    price: '$19/user/month',
    analyses_per_day: Infinity,
    max_text_length: 10000,
    features: [
      'all_pro_features',
      'team_analytics',
      'admin_dashboard',
      'api_access',
      'slack_integration',
      'priority_support'
    ]
  }
};