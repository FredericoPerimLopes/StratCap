# Claude Code Configuration - SPARC Development Environment

<<<<<<< HEAD
## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message
=======
## 🚨 CRITICAL: PARALLEL EXECUTION AFTER SWARM INIT

**MANDATORY RULE**: Once swarm is initialized with memory, ALL subsequent operations MUST be parallel:
1. **TodoWrite** → Always batch 5-10+ todos in ONE call
2. **Task spawning** → Spawn ALL agents in ONE message  
3. **File operations** → Batch ALL reads/writes together
4. **NEVER** operate sequentially after swarm init

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
```javascript
// ✅ CORRECT: Everything in ONE message
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Task("Agent 3 with full instructions and hooks")
  - Read("file1.js")
  - Read("file2.js")
  - Read("file3.js")
  - Write("output1.js", content)
  - Write("output2.js", content)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
```

**Examples of WRONG sequential execution:**
```javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?

If ANY answer is "No", you MUST combine operations into a single message!

## 🚀 CRITICAL: Claude Code Does ALL Real Work

### 🎯 CLAUDE CODE IS THE ONLY EXECUTOR

**ABSOLUTE RULE**: Claude Code performs ALL actual work:

### ✅ Claude Code ALWAYS Handles:
- 🔧 **ALL file operations** (Read, Write, Edit, MultiEdit, Glob, Grep)
- 💻 **ALL code generation** and programming tasks
- 🖥️ **ALL bash commands** and system operations
- 🏗️ **ALL actual implementation** work
- 🔍 **ALL project navigation** and code analysis
- 📝 **ALL TodoWrite** and task management
- 🔄 **ALL git operations** (commit, push, merge)
- 📦 **ALL package management** (npm, pip, etc.)
- 🧪 **ALL testing** and validation
- 🔧 **ALL debugging** and troubleshooting

### 🧠 Claude Flow MCP Tools ONLY Handle:
- 🎯 **Coordination only** - Planning Claude Code's actions
- 💾 **Memory management** - Storing decisions and context
- 🤖 **Neural features** - Learning from Claude Code's work
- 📊 **Performance tracking** - Monitoring Claude Code's efficiency
- 🐝 **Swarm orchestration** - Coordinating multiple Claude Code instances
- 🔗 **GitHub integration** - Advanced repository coordination

### 🚨 CRITICAL SEPARATION OF CONCERNS:

**❌ MCP Tools NEVER:**
- Write files or create content
- Execute bash commands
- Generate code
- Perform file operations
- Handle TodoWrite operations
- Execute system commands
- Do actual implementation work

**✅ MCP Tools ONLY:**
- Coordinate and plan
- Store memory and context
- Track performance
- Orchestrate workflows
- Provide intelligence insights

### ⚠️ Key Principle:
**MCP tools coordinate, Claude Code executes.** Think of MCP tools as the "brain" that plans and coordinates, while Claude Code is the "hands" that do all the actual work.

### 🔄 WORKFLOW EXECUTION PATTERN:

**✅ CORRECT Workflow:**
1. **MCP**: `mcp__claude-flow__swarm_init` (coordination setup)
2. **MCP**: `mcp__claude-flow__agent_spawn` (planning agents)
3. **MCP**: `mcp__claude-flow__task_orchestrate` (task coordination)
4. **Claude Code**: `Task` tool to spawn agents with coordination instructions
5. **Claude Code**: `TodoWrite` with ALL todos batched (5-10+ in ONE call)
6. **Claude Code**: `Read`, `Write`, `Edit`, `Bash` (actual work)
7. **MCP**: `mcp__claude-flow__memory_usage` (store results)

**❌ WRONG Workflow:**
1. **MCP**: `mcp__claude-flow__terminal_execute` (DON'T DO THIS)
2. **MCP**: File creation via MCP (DON'T DO THIS)
3. **MCP**: Code generation via MCP (DON'T DO THIS)
4. **Claude Code**: Sequential Task calls (DON'T DO THIS)
5. **Claude Code**: Individual TodoWrite calls (DON'T DO THIS)

### 🚨 REMEMBER:
- **MCP tools** = Coordination, planning, memory, intelligence
- **Claude Code** = All actual execution, coding, file operations
>>>>>>> 80a95e2 (fix backedn frontend mismatch)

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL:
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY:
- Coordination and planning
- Memory management
- Neural features
- Performance tracking
- Swarm orchestration
- GitHub integration

**KEY**: MCP coordinates, Claude Code executes.

## 🚀 Quick Setup

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

<<<<<<< HEAD
## MCP Tool Categories
=======
### 🚨 MANDATORY TODO AND TASK BATCHING

**CRITICAL RULE FOR TODOS AND TASKS:**
1. **TodoWrite** MUST ALWAYS include ALL todos in ONE call (5-10+ todos)
2. **Task** tool calls MUST be batched - spawn multiple agents in ONE message
3. **NEVER** update todos one by one - this breaks parallel coordination
4. **NEVER** spawn agents sequentially - ALL agents spawn together

### 📦 BATCH TOOL EXAMPLES
>>>>>>> 80a95e2 (fix backedn frontend mismatch)

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

## 📋 Agent Coordination Protocol

### Every Agent MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT (Single Message):
```javascript
<<<<<<< HEAD
[BatchTool]:
  // Initialize swarm
=======
[Single Message with BatchTool]:
  // MCP coordination setup
>>>>>>> 80a95e2 (fix backedn frontend mismatch)
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
<<<<<<< HEAD
  
  // Spawn agents with Task tool
  Task("Research agent: Analyze requirements...")
  Task("Coder agent: Implement features...")
  Task("Tester agent: Create test suite...")
  
  // Batch todos
  TodoWrite { todos: [
    {id: "1", content: "Research", status: "in_progress", priority: "high"},
    {id: "2", content: "Design", status: "pending", priority: "high"},
    {id: "3", content: "Implement", status: "pending", priority: "high"},
    {id: "4", content: "Test", status: "pending", priority: "medium"},
    {id: "5", content: "Document", status: "pending", priority: "low"}
  ]}
  
  // File operations
=======
  mcp__claude-flow__agent_spawn { type: "coordinator" }
  
  // Claude Code execution - ALL in parallel
  Task("You are researcher agent. MUST coordinate via hooks...")
  Task("You are coder agent. MUST coordinate via hooks...")
  Task("You are analyst agent. MUST coordinate via hooks...")
  Task("You are tester agent. MUST coordinate via hooks...")
  TodoWrite { todos: [5-10 todos with all priorities and statuses] }
  
  // File operations in parallel
>>>>>>> 80a95e2 (fix backedn frontend mismatch)
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/src/index.js"
  Write "app/tests/index.test.js"
  Write "app/docs/README.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
<<<<<<< HEAD
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

=======
Message 2: Task("researcher agent")
Message 3: Task("coder agent")
Message 4: TodoWrite({ todo: "single todo" })
Message 5: Bash "mkdir src"
Message 6: Write "package.json"
// This is 6x slower and breaks parallel coordination!
```

### 🎯 BATCH OPERATIONS BY TYPE

**Todo and Task Operations (Single Message):**
- **TodoWrite** → ALWAYS include 5-10+ todos in ONE call
- **Task agents** → Spawn ALL agents with full instructions in ONE message
- **Agent coordination** → ALL Task calls must include coordination hooks
- **Status updates** → Update ALL todo statuses together
- **NEVER** split todos or Task calls across messages!

**File Operations (Single Message):**
- Read 10 files? → One message with 10 Read calls
- Write 5 files? → One message with 5 Write calls
- Edit 1 file many times? → One MultiEdit call

**Swarm Operations (Single Message):**
- Need 8 agents? → One message with swarm_init + 8 agent_spawn calls
- Multiple memories? → One message with all memory_usage calls
- Task + monitoring? → One message with task_orchestrate + swarm_monitor

**Command Operations (Single Message):**
- Multiple directories? → One message with all mkdir commands
- Install + test + lint? → One message with all npm commands
- Git operations? → One message with all git commands

## 🚀 Quick Setup (Stdio MCP - Recommended)

### 1. Add MCP Server (Stdio - No Port Needed)
```bash
# Add Claude Flow MCP server to Claude Code using stdio
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### 2. Use MCP Tools for Coordination in Claude Code
Once configured, Claude Flow MCP tools enhance Claude Code's coordination:

**Initialize a swarm:**
- Use the `mcp__claude-flow__swarm_init` tool to set up coordination topology
- Choose: mesh, hierarchical, ring, or star
- This creates a coordination framework for Claude Code's work

**Spawn agents:**
- Use `mcp__claude-flow__agent_spawn` tool to create specialized coordinators
- Agent types represent different thinking patterns, not actual coders
- They help Claude Code approach problems from different angles

**Orchestrate tasks:**
- Use `mcp__claude-flow__task_orchestrate` tool to coordinate complex workflows
- This breaks down tasks for Claude Code to execute systematically
- The agents don't write code - they coordinate Claude Code's actions

## Available MCP Tools for Coordination

### Coordination Tools:
- `mcp__claude-flow__swarm_init` - Set up coordination topology for Claude Code
- `mcp__claude-flow__agent_spawn` - Create cognitive patterns to guide Claude Code
- `mcp__claude-flow__task_orchestrate` - Break down and coordinate complex tasks

### Monitoring Tools:
- `mcp__claude-flow__swarm_status` - Monitor coordination effectiveness
- `mcp__claude-flow__agent_list` - View active cognitive patterns
- `mcp__claude-flow__agent_metrics` - Track coordination performance
- `mcp__claude-flow__task_status` - Check workflow progress
- `mcp__claude-flow__task_results` - Review coordination outcomes

### Memory & Neural Tools:
- `mcp__claude-flow__memory_usage` - Persistent memory across sessions
- `mcp__claude-flow__neural_status` - Neural pattern effectiveness
- `mcp__claude-flow__neural_train` - Improve coordination patterns
- `mcp__claude-flow__neural_patterns` - Analyze thinking approaches

### GitHub Integration Tools (NEW!):
- `mcp__claude-flow__github_swarm` - Create specialized GitHub management swarms
- `mcp__claude-flow__repo_analyze` - Deep repository analysis with AI
- `mcp__claude-flow__pr_enhance` - AI-powered pull request improvements
- `mcp__claude-flow__issue_triage` - Intelligent issue classification
- `mcp__claude-flow__code_review` - Automated code review with swarms

### System Tools:
- `mcp__claude-flow__benchmark_run` - Measure coordination efficiency
- `mcp__claude-flow__features_detect` - Available capabilities
- `mcp__claude-flow__swarm_monitor` - Real-time coordination tracking

## Workflow Examples (Coordination-Focused)

### Research Coordination Example
**Context:** Claude Code needs to research a complex topic systematically

**Step 1:** Set up research coordination
- Tool: `mcp__claude-flow__swarm_init`
- Parameters: `{"topology": "mesh", "maxAgents": 5, "strategy": "balanced"}`
- Result: Creates a mesh topology for comprehensive exploration

**Step 2:** Define research perspectives
- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "researcher", "name": "Literature Review"}`
- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "analyst", "name": "Data Analysis"}`
- Result: Different cognitive patterns for Claude Code to use

**Step 3:** Coordinate research execution
- Tool: `mcp__claude-flow__task_orchestrate`
- Parameters: `{"task": "Research neural architecture search papers", "strategy": "adaptive"}`
- Result: Claude Code systematically searches, reads, and analyzes papers

**What Actually Happens:**
1. The swarm sets up a coordination framework
2. Each agent MUST use Claude Flow hooks for coordination:
   - `npx claude-flow@alpha hooks pre-task` before starting
   - `npx claude-flow@alpha hooks post-edit` after each file operation
   - `npx claude-flow@alpha hooks notification` to share decisions
3. Claude Code uses its native Read, WebSearch, and Task tools
4. The swarm coordinates through shared memory and hooks
5. Results are synthesized by Claude Code with full coordination history

### Development Coordination Example
**Context:** Claude Code needs to build a complex system with multiple components

**Step 1:** Set up development coordination
- Tool: `mcp__claude-flow__swarm_init`
- Parameters: `{"topology": "hierarchical", "maxAgents": 8, "strategy": "specialized"}`
- Result: Hierarchical structure for organized development

**Step 2:** Define development perspectives
- Tool: `mcp__claude-flow__agent_spawn`
- Parameters: `{"type": "architect", "name": "System Design"}`
- Result: Architectural thinking pattern for Claude Code

**Step 3:** Coordinate implementation
- Tool: `mcp__claude-flow__task_orchestrate`
- Parameters: `{"task": "Implement user authentication with JWT", "strategy": "parallel"}`
- Result: Claude Code implements features using its native tools

**What Actually Happens:**
1. The swarm creates a development coordination plan
2. Each agent coordinates using mandatory hooks:
   - Pre-task hooks for context loading
   - Post-edit hooks for progress tracking
   - Memory storage for cross-agent coordination
3. Claude Code uses Write, Edit, Bash tools for implementation
4. Agents share progress through Claude Flow memory
5. All code is written by Claude Code with full coordination

### GitHub Repository Management Example (NEW!)
**Context:** Claude Code needs to manage a complex GitHub repository

**Step 1:** Initialize GitHub swarm
- Tool: `mcp__claude-flow__github_swarm`
- Parameters: `{"repository": "owner/repo", "agents": 5, "focus": "maintenance"}`
- Result: Specialized swarm for repository management

**Step 2:** Analyze repository health
- Tool: `mcp__claude-flow__repo_analyze`
- Parameters: `{"deep": true, "include": ["issues", "prs", "code"]}`
- Result: Comprehensive repository analysis

**Step 3:** Enhance pull requests
- Tool: `mcp__claude-flow__pr_enhance`
- Parameters: `{"pr_number": 123, "add_tests": true, "improve_docs": true}`
- Result: AI-powered PR improvements

## Best Practices for Coordination

### ✅ DO:
- Use MCP tools to coordinate Claude Code's approach to complex tasks
- Let the swarm break down problems into manageable pieces
- Use memory tools to maintain context across sessions
- Monitor coordination effectiveness with status tools
- Train neural patterns for better coordination over time
- Leverage GitHub tools for repository management

### ❌ DON'T:
- Expect agents to write code (Claude Code does all implementation)
- Use MCP tools for file operations (use Claude Code's native tools)
- Try to make agents execute bash commands (Claude Code handles this)
- Confuse coordination with execution (MCP coordinates, Claude executes)

## Memory and Persistence

The swarm provides persistent memory that helps Claude Code:
- Remember project context across sessions
- Track decisions and rationale
- Maintain consistency in large projects
- Learn from previous coordination patterns
- Store GitHub workflow preferences

>>>>>>> 80a95e2 (fix backedn frontend mismatch)
## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

<<<<<<< HEAD
1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first
=======
1. **Start Simple**: Begin with basic swarm init and single agent
2. **Scale Gradually**: Add more agents as task complexity increases
3. **Use Memory**: Store important decisions and context
4. **Monitor Progress**: Regular status checks ensure effective coordination
5. **Train Patterns**: Let neural agents learn from successful coordinations
6. **Enable Hooks**: Use the pre-configured hooks for automation
7. **GitHub First**: Use GitHub tools for repository management

## 🧠 SWARM ORCHESTRATION PATTERN

### You are the SWARM ORCHESTRATOR. **IMMEDIATELY SPAWN AGENTS IN PARALLEL** to execute tasks

### 🚨 CRITICAL INSTRUCTION: You are the SWARM ORCHESTRATOR

**MANDATORY**: When using swarms, you MUST:
1. **SPAWN ALL AGENTS IN ONE BATCH** - Use multiple tool calls in a SINGLE message
2. **EXECUTE TASKS IN PARALLEL** - Never wait for one task before starting another
3. **USE BATCHTOOL FOR EVERYTHING** - Multiple operations = Single message with multiple tools
4. **ALL AGENTS MUST USE COORDINATION TOOLS** - Every spawned agent MUST use claude-flow hooks and memory

### 🎯 AGENT COUNT CONFIGURATION

**CRITICAL: Dynamic Agent Count Rules**
1. **Check CLI Arguments First**: If user runs `npx claude-flow@alpha --agents 5`, use 5 agents
2. **Auto-Decide if No Args**: Without CLI args, analyze task complexity:
   - Simple tasks (1-3 components): 3-4 agents
   - Medium tasks (4-6 components): 5-7 agents  
   - Complex tasks (7+ components): 8-12 agents
3. **Agent Type Distribution**: Balance agent types based on task:
   - Always include 1 coordinator
   - For code-heavy tasks: more coders
   - For design tasks: more architects/analysts
   - For quality tasks: more testers/reviewers

**Example Auto-Decision Logic:**
```javascript
// If CLI args provided: npx claude-flow@alpha --agents 6
maxAgents = CLI_ARGS.agents || determineAgentCount(task)

function determineAgentCount(task) {
  // Analyze task complexity
  if (task.includes(['API', 'database', 'auth', 'tests'])) return 8
  if (task.includes(['frontend', 'backend'])) return 6
  if (task.includes(['simple', 'script'])) return 3
  return 5 // default
}
```

## 📋 MANDATORY AGENT COORDINATION PROTOCOL

### 🔴 CRITICAL: Every Agent MUST Follow This Protocol

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**
```bash
# Check previous work and load context
npx claude-flow@alpha hooks pre-task --description "[agent task]" --auto-spawn-agents false
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]" --load-memory true
```

**2️⃣ DURING Work (After EVERY Major Step):**
```bash
# Store progress in memory after each file operation
npx claude-flow@alpha hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"

# Store decisions and findings
npx claude-flow@alpha hooks notification --message "[what was done]" --telemetry true

# Check coordination with other agents
npx claude-flow@alpha hooks pre-search --query "[what to check]" --cache-results true
```

**3️⃣ AFTER Completing Work:**
```bash
# Save all results and learnings
npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true
npx claude-flow@alpha hooks session-end --export-metrics true --generate-summary true
```

### 🎯 AGENT PROMPT TEMPLATE

When spawning agents, ALWAYS include these coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run `npx claude-flow@alpha hooks pre-task --description "[your task]"`
2. DURING: After EVERY file operation, run `npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "agent/[step]"`
3. MEMORY: Store ALL decisions using `npx claude-flow@alpha hooks notification --message "[decision]"`
4. END: Run `npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true`

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

### ⚡ PARALLEL EXECUTION IS MANDATORY

**THIS IS WRONG ❌ (Sequential - NEVER DO THIS):**
```
Message 1: Initialize swarm
Message 2: Spawn agent 1
Message 3: Spawn agent 2
Message 4: TodoWrite (single todo)
Message 5: Create file 1
Message 6: TodoWrite (another single todo)
```

**THIS IS CORRECT ✅ (Parallel - ALWAYS DO THIS):**
```
Message 1: [BatchTool]
  // MCP coordination setup
  - mcp__claude-flow__swarm_init
  - mcp__claude-flow__agent_spawn (researcher)
  - mcp__claude-flow__agent_spawn (coder)  
  - mcp__claude-flow__agent_spawn (analyst)
  - mcp__claude-flow__agent_spawn (tester)
  - mcp__claude-flow__agent_spawn (coordinator)

Message 2: [BatchTool - Claude Code execution]
  // Task agents with full coordination instructions
  - Task("You are researcher agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Research API patterns")
  - Task("You are coder agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Implement REST endpoints")
  - Task("You are analyst agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Analyze performance")
  - Task("You are tester agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Write comprehensive tests")
  
  // TodoWrite with ALL todos batched
  - TodoWrite { todos: [
      {id: "research", content: "Research API patterns", status: "in_progress", priority: "high"},
      {id: "design", content: "Design database schema", status: "pending", priority: "high"},
      {id: "implement", content: "Build REST endpoints", status: "pending", priority: "high"},
      {id: "test", content: "Write unit tests", status: "pending", priority: "medium"},
      {id: "docs", content: "Create API documentation", status: "pending", priority: "low"},
      {id: "deploy", content: "Setup deployment", status: "pending", priority: "medium"}
    ]}
  
  // File operations in parallel
  - Write "api/package.json"
  - Write "api/server.js"
  - Write "api/routes/users.js"
  - Bash "mkdir -p api/{routes,models,tests}"
```

### 🎯 MANDATORY SWARM PATTERN

When given ANY complex task with swarms:

```
STEP 1: IMMEDIATE PARALLEL SPAWN (Single Message!)
[BatchTool]:
  // IMPORTANT: Check CLI args for agent count, otherwise auto-decide based on task complexity
  - mcp__claude-flow__swarm_init { 
      topology: "hierarchical", 
      maxAgents: CLI_ARGS.agents || AUTO_DECIDE(task_complexity), // Use CLI args or auto-decide
      strategy: "parallel" 
    }
  
  // Spawn agents based on maxAgents count and task requirements
  // If CLI specifies 3 agents, spawn 3. If no args, auto-decide optimal count (3-12)
  - mcp__claude-flow__agent_spawn { type: "architect", name: "System Designer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "Frontend Dev" }
  - mcp__claude-flow__agent_spawn { type: "analyst", name: "DB Designer" }
  - mcp__claude-flow__agent_spawn { type: "tester", name: "QA Engineer" }
  - mcp__claude-flow__agent_spawn { type: "researcher", name: "Tech Lead" }
  - mcp__claude-flow__agent_spawn { type: "coordinator", name: "PM" }
  - TodoWrite { todos: [multiple todos at once] }

STEP 2: PARALLEL TASK EXECUTION (Single Message!)
[BatchTool]:
  - mcp__claude-flow__task_orchestrate { task: "main task", strategy: "parallel" }
  - mcp__claude-flow__memory_usage { action: "store", key: "init", value: {...} }
  - Multiple Read operations
  - Multiple Write operations
  - Multiple Bash commands

STEP 3: CONTINUE PARALLEL WORK (Never Sequential!)
```

### 📊 VISUAL TASK TRACKING FORMAT

Use this format when displaying task progress:

```
📊 Progress Overview
   ├── Total Tasks: X
   ├── ✅ Completed: X (X%)
   ├── 🔄 In Progress: X (X%)
   ├── ⭕ Todo: X (X%)
   └── ❌ Blocked: X (X%)

📋 Todo (X)
   └── 🔴 001: [Task description] [PRIORITY] ▶

🔄 In progress (X)
   ├── 🟡 002: [Task description] ↳ X deps ▶
   └── 🔴 003: [Task description] [PRIORITY] ▶

✅ Completed (X)
   ├── ✅ 004: [Task description]
   └── ... (more completed tasks)

Priority indicators: 🔴 HIGH/CRITICAL, 🟡 MEDIUM, 🟢 LOW
Dependencies: ↳ X deps | Actionable: ▶
```

### 🎯 REAL EXAMPLE: Full-Stack App Development

**Task**: "Build a complete REST API with authentication, database, and tests"

**🚨 MANDATORY APPROACH - Everything in Parallel:**

```javascript
// ✅ CORRECT: SINGLE MESSAGE with ALL operations
[BatchTool - Message 1]:
  // Initialize and spawn ALL agents at once
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
  mcp__claude-flow__agent_spawn { type: "architect", name: "System Designer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "Auth Expert" }
  mcp__claude-flow__agent_spawn { type: "analyst", name: "DB Designer" }
  mcp__claude-flow__agent_spawn { type: "tester", name: "Test Engineer" }
  mcp__claude-flow__agent_spawn { type: "coordinator", name: "Lead" }
  
  // Update ALL todos at once - NEVER split todos!
  TodoWrite { todos: [
    { id: "design", content: "Design API architecture", status: "in_progress", priority: "high" },
    { id: "auth", content: "Implement authentication", status: "pending", priority: "high" },
    { id: "db", content: "Design database schema", status: "pending", priority: "high" },
    { id: "api", content: "Build REST endpoints", status: "pending", priority: "high" },
    { id: "tests", content: "Write comprehensive tests", status: "pending", priority: "medium" },
    { id: "docs", content: "Document API endpoints", status: "pending", priority: "low" },
    { id: "deploy", content: "Setup deployment pipeline", status: "pending", priority: "medium" },
    { id: "monitor", content: "Add monitoring", status: "pending", priority: "medium" }
  ]}
  
  // Start orchestration
  mcp__claude-flow__task_orchestrate { task: "Build REST API", strategy: "parallel" }
  
  // Store initial memory
  mcp__claude-flow__memory_usage { action: "store", key: "project/init", value: { started: Date.now() } }

[BatchTool - Message 2]:
  // Create ALL directories at once
  Bash("mkdir -p test-app/{src,tests,docs,config}")
  Bash("mkdir -p test-app/src/{models,routes,middleware,services}")
  Bash("mkdir -p test-app/tests/{unit,integration}")
  
  // Write ALL base files at once
  Write("test-app/package.json", packageJsonContent)
  Write("test-app/.env.example", envContent)
  Write("test-app/README.md", readmeContent)
  Write("test-app/src/server.js", serverContent)
  Write("test-app/src/config/database.js", dbConfigContent)

[BatchTool - Message 3]:
  // Read multiple files for context
  Read("test-app/package.json")
  Read("test-app/src/server.js")
  Read("test-app/.env.example")
  
  // Run multiple commands
  Bash("cd test-app && npm install")
  Bash("cd test-app && npm run lint")
  Bash("cd test-app && npm test")
```

### 🚫 NEVER DO THIS (Sequential = WRONG):
```javascript
// ❌ WRONG: Multiple messages, one operation each
Message 1: mcp__claude-flow__swarm_init
Message 2: mcp__claude-flow__agent_spawn (just one agent)
Message 3: mcp__claude-flow__agent_spawn (another agent)
Message 4: TodoWrite (single todo)
Message 5: Write (single file)
// This is 5x slower and wastes swarm coordination!
```

### 🔄 MEMORY COORDINATION PATTERN

Every agent coordination step MUST use memory:

```
// After each major decision or implementation
mcp__claude-flow__memory_usage
  action: "store"
  key: "swarm-{id}/agent-{name}/{step}"
  value: {
    timestamp: Date.now(),
    decision: "what was decided",
    implementation: "what was built",
    nextSteps: ["step1", "step2"],
    dependencies: ["dep1", "dep2"]
  }

// To retrieve coordination data
mcp__claude-flow__memory_usage
  action: "retrieve"
  key: "swarm-{id}/agent-{name}/{step}"

// To check all swarm progress
mcp__claude-flow__memory_usage
  action: "list"
  pattern: "swarm-{id}/*"
```

### ⚡ PERFORMANCE TIPS

1. **Batch Everything**: Never operate on single files when multiple are needed
2. **Parallel First**: Always think "what can run simultaneously?"
3. **Memory is Key**: Use memory for ALL cross-agent coordination
4. **Monitor Progress**: Use mcp__claude-flow__swarm_monitor for real-time tracking
5. **Auto-Optimize**: Let hooks handle topology and agent selection

### 🎨 VISUAL SWARM STATUS

When showing swarm status, use this format:

```
🐝 Swarm Status: ACTIVE
├── 🏗️ Topology: hierarchical
├── 👥 Agents: 6/8 active
├── ⚡ Mode: parallel execution
├── 📊 Tasks: 12 total (4 complete, 6 in-progress, 2 pending)
└── 🧠 Memory: 15 coordination points stored

Agent Activity:
├── 🟢 architect: Designing database schema...
├── 🟢 coder-1: Implementing auth endpoints...
├── 🟢 coder-2: Building user CRUD operations...
├── 🟢 analyst: Optimizing query performance...
├── 🟡 tester: Waiting for auth completion...
└── 🟢 coordinator: Monitoring progress...
```

## 📝 CRITICAL: TODOWRITE AND TASK TOOL BATCHING

### 🚨 MANDATORY BATCHING RULES FOR TODOS AND TASKS

**TodoWrite Tool Requirements:**
1. **ALWAYS** include 5-10+ todos in a SINGLE TodoWrite call
2. **NEVER** call TodoWrite multiple times in sequence
3. **BATCH** all todo updates together - status changes, new todos, completions
4. **INCLUDE** all priority levels (high, medium, low) in one call

**Task Tool Requirements:**
1. **SPAWN** all agents using Task tool in ONE message
2. **NEVER** spawn agents one by one across multiple messages
3. **INCLUDE** full task descriptions and coordination instructions
4. **BATCH** related Task calls together for parallel execution

**Example of CORRECT TodoWrite usage:**
```javascript
// ✅ CORRECT - All todos in ONE call
TodoWrite { todos: [
  { id: "1", content: "Initialize system", status: "completed", priority: "high" },
  { id: "2", content: "Analyze requirements", status: "in_progress", priority: "high" },
  { id: "3", content: "Design architecture", status: "pending", priority: "high" },
  { id: "4", content: "Implement core", status: "pending", priority: "high" },
  { id: "5", content: "Build features", status: "pending", priority: "medium" },
  { id: "6", content: "Write tests", status: "pending", priority: "medium" },
  { id: "7", content: "Add monitoring", status: "pending", priority: "medium" },
  { id: "8", content: "Documentation", status: "pending", priority: "low" },
  { id: "9", content: "Performance tuning", status: "pending", priority: "low" },
  { id: "10", content: "Deploy to production", status: "pending", priority: "high" }
]}
```

**Example of WRONG TodoWrite usage:**
```javascript
// ❌ WRONG - Multiple TodoWrite calls
Message 1: TodoWrite { todos: [{ id: "1", content: "Task 1", ... }] }
Message 2: TodoWrite { todos: [{ id: "2", content: "Task 2", ... }] }
Message 3: TodoWrite { todos: [{ id: "3", content: "Task 3", ... }] }
// This breaks parallel coordination!
```

## Claude Flow v2.0.0 Features

Claude Flow extends the base coordination with:
- **🔗 GitHub Integration** - Deep repository management
- **🎯 Project Templates** - Quick-start for common projects
- **📊 Advanced Analytics** - Detailed performance insights
- **🤖 Custom Agent Types** - Domain-specific coordinators
- **🔄 Workflow Automation** - Reusable task sequences
- **🛡️ Enhanced Security** - Safer command execution
>>>>>>> 80a95e2 (fix backedn frontend mismatch)

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
<<<<<<< HEAD
=======
- Examples: https://github.com/ruvnet/claude-flow/tree/main/examples
>>>>>>> 80a95e2 (fix backedn frontend mismatch)

---

Remember: **Claude Flow coordinates, Claude Code creates!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
