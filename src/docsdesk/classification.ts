/**
 * Pure classification module for auto-classifying incidents and recommending resources
 * No external dependencies, no network calls, no filesystem access
 */

import { CLASSIFICATION_RULES, ClassificationResource } from './classification-rules';

export interface ClassificationInput {
  client: string;
  category: string;
  errorCode?: string;
  shortDescription: string;
  detailedDescription: string;
}

export interface ClassificationResult {
  topic: string;
  recommendedResources: ClassificationResource[];
}

/**
 * Classify an incident and recommend resources based on category, keywords, and error codes
 * Pure function with no side effects
 */
export function classifyAndRecommend(input: ClassificationInput): ClassificationResult {
  // Combine all text for keyword matching
  const text = `${input.shortDescription} ${input.detailedDescription}`.toLowerCase();
  const errorCode = input.errorCode?.toLowerCase();
  const category = input.category;

  // Filter rules by category
  const candidates = CLASSIFICATION_RULES.filter(
    (rule) => rule.category === category,
  );

  // First pass: category match + any keyword or errorCode match
  for (const rule of candidates) {
    const hasKeyword =
      rule.matchKeywords?.some((kw) => text.includes(kw.toLowerCase())) ?? false;
    const hasErrorCode =
      errorCode &&
      rule.matchErrorCodes?.some((ec) => errorCode.includes(ec.toLowerCase()));

    if (hasKeyword || hasErrorCode) {
      return {
        topic: rule.topic,
        recommendedResources: rule.resources,
      };
    }
  }

  // Second pass: fallback rule per category (no matchKeywords/matchErrorCodes)
  const fallback = candidates.find(
    (rule) => !rule.matchKeywords && !rule.matchErrorCodes,
  );

  if (fallback) {
    return {
      topic: fallback.topic,
      recommendedResources: fallback.resources,
    };
  }

  // Last resort: generic "unclassified"
  return {
    topic: 'Unclassified / Manual Review',
    recommendedResources: [],
  };
}

