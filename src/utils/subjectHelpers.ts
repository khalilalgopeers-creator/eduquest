import { Subject } from '../types';

/**
 * Determines whether a subject is JHS (BECE), SHS (WASSCE), or Both.
 */
export function getSubjectLevel(subjectId: string): 'JHS' | 'SHS' | 'Both' {
  // Subjects that are uniquely JHS
  const jhsOnly = ['career', 'fante'];
  
  // Subjects that are core or taken at both levels
  const both = ['math', 'english', 'science', 'social', 'ict', 'french', 'music', 'arts', 'pe'];
  
  if (jhsOnly.includes(subjectId)) {
    return 'JHS';
  } else if (both.includes(subjectId)) {
    return 'Both';
  } else {
    return 'SHS';
  }
}

/**
 * Checks if a subject belongs to JHS filter.
 */
export function isJHSSubject(subjectId: string): boolean {
  const level = getSubjectLevel(subjectId);
  return level === 'JHS' || level === 'Both';
}

/**
 * Checks if a subject belongs to SHS filter.
 */
export function isSHSSubject(subjectId: string): boolean {
  const level = getSubjectLevel(subjectId);
  return level === 'SHS' || level === 'Both';
}
