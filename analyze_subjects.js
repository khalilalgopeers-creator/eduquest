import { subjects } from './src/data/subjects';

subjects.forEach(s => {
  console.log(`${s.name}:`);
  console.log(`  Syllabus: ${s.syllabus.length}`);
  console.log(`  Concepts: ${s.concepts.length}`);
  console.log(`  Questions: ${s.questions.length}`);
  console.log(`  Advanced Concepts: ${s.advancedConcepts?.length || 0}`);
  console.log(`  Advanced Questions: ${s.advancedQuestions?.length || 0}`);
  console.log(`  Total: ${s.syllabus.length + s.concepts.length + s.questions.length + (s.advancedConcepts?.length || 0) + (s.advancedQuestions?.length || 0)}`);
});
