import { execSync } from 'node:child_process';

const rangeFrom = process.env.COMMIT_RANGE_FROM;
const rangeTo = process.env.COMMIT_RANGE_TO || 'HEAD';
const range = rangeFrom ? `${rangeFrom}..${rangeTo}` : 'HEAD~1..HEAD';

const commitsOutput = execSync(`git log --format=%s ${range}`, { encoding: 'utf8' }).trim();

if (!commitsOutput) {
  console.log('Nenhum commit encontrado para validação.');
  process.exit(0);
}

const messages = commitsOutput.split('\n').filter(Boolean);
const conventionalCommitPattern =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([\w\-.\/]+\))?!?: .+/;

const invalidMessages = messages.filter((message) => {
  const isMergeCommit = message.startsWith('Merge ');
  return !isMergeCommit && !conventionalCommitPattern.test(message);
});

if (invalidMessages.length > 0) {
  console.error('Commits fora do padrão Conventional Commits:');
  for (const message of invalidMessages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log(`Conventional Commits validados com sucesso (${messages.length} commit(s)).`);
