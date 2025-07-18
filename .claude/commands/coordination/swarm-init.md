# swarm init

Initialize a Claude Flow swarm with specified topology and configuration.

## Usage

```bash
npx claude-flow swarm init [options]
```

## Options

- `--topology, -t <type>` - Swarm topology: mesh, hierarchical, ring, star (default: hierarchical)
- `--max-agents, -m <number>` - Maximum number of agents (default: 8)
- `--strategy, -s <type>` - Execution strategy: balanced, parallel, sequential (default: parallel)
- `--auto-spawn` - Automatically spawn agents based on task complexity
- `--memory` - Enable cross-session memory persistence
- `--github` - Enable GitHub integration features

## Examples

### Basic initialization
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow swarm init
```

### Mesh topology for research
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow swarm init --topology mesh --max-agents 5 --strategy balanced
```

### Hierarchical for development
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow swarm init --topology hierarchical --max-agents 10 --strategy parallel --auto-spawn
```

### GitHub-focused swarm
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow swarm init --topology star --github --memory
```

## Topologies

### Mesh
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- All agents connect to all others
- Best for: Research, exploration, brainstorming
- Communication: High overhead, maximum information sharing

### Hierarchical
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Tree structure with clear command chain
- Best for: Development, structured tasks, large projects
- Communication: Efficient, clear responsibilities

### Ring
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Agents connect in a circle
- Best for: Pipeline processing, sequential workflows
- Communication: Low overhead, ordered processing

### Star
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Central coordinator with satellite agents
- Best for: Simple tasks, centralized control
- Communication: Minimal overhead, clear coordination

## Integration with Claude Code

Once initialized, use MCP tools in Claude Code:
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```javascript
mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8 }
```

## See Also

- `agent spawn` - Create swarm agents
- `task orchestrate` - Coordinate task execution
- `swarm status` - Check swarm state
<<<<<<< HEAD
- `swarm monitor` - Real-time monitoring
=======
- `swarm monitor` - Real-time monitoring
>>>>>>> 000b3fd (updates)
