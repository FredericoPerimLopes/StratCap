# github swarm

Create a specialized swarm for GitHub repository management.

## Usage

```bash
npx claude-flow github swarm [options]
```

## Options

- `--repository, -r <owner/repo>` - Target GitHub repository
- `--agents, -a <number>` - Number of specialized agents (default: 5)
- `--focus, -f <type>` - Focus area: maintenance, development, review, triage
- `--auto-pr` - Enable automatic pull request enhancements
- `--issue-labels` - Auto-categorize and label issues
- `--code-review` - Enable AI-powered code reviews

## Examples

### Basic GitHub swarm
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow github swarm --repository owner/repo
```

### Maintenance-focused swarm
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow github swarm -r owner/repo -f maintenance --issue-labels
```

### Development swarm with PR automation
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow github swarm -r owner/repo -f development --auto-pr --code-review
```

### Full-featured triage swarm
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow github swarm -r owner/repo -a 8 -f triage --issue-labels --auto-pr
```

## Agent Types

### Issue Triager
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Analyzes and categorizes issues
- Suggests labels and priorities
- Identifies duplicates and related issues

### PR Reviewer
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Reviews code changes
- Suggests improvements
- Checks for best practices

### Documentation Agent
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Updates README files
- Creates API documentation
- Maintains changelog

### Test Agent
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Identifies missing tests
- Suggests test cases
- Validates test coverage

### Security Agent
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Scans for vulnerabilities
- Reviews dependencies
- Suggests security improvements

## Workflows

### Issue Triage Workflow
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
1. Scan all open issues
2. Categorize by type and priority
3. Apply appropriate labels
4. Suggest assignees
5. Link related issues

### PR Enhancement Workflow
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
1. Analyze PR changes
2. Suggest missing tests
3. Improve documentation
4. Format code consistently
5. Add helpful comments

### Repository Health Check
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
1. Analyze code quality metrics
2. Review dependency status
3. Check test coverage
4. Assess documentation completeness
5. Generate health report

## Integration with Claude Code

Use in Claude Code with MCP tools:
<<<<<<< HEAD
```javascript
mcp__claude-flow__github_swarm { 
  repository: "owner/repo", 
  agents: 6, 
  focus: "maintenance" 
=======

```javascript
mcp__claude-flow__github_swarm {
  repository: "owner/repo",
  agents: 6,
  focus: "maintenance"
>>>>>>> 000b3fd (updates)
}
```

## See Also

- `repo analyze` - Deep repository analysis
- `pr enhance` - Enhance pull requests
- `issue triage` - Intelligent issue management
<<<<<<< HEAD
- `code review` - Automated reviews
=======
- `code review` - Automated reviews
>>>>>>> 000b3fd (updates)
