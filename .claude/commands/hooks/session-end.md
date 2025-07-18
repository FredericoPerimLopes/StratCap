# hook session-end

Cleanup and persist session state before ending work.

## Usage

```bash
npx claude-flow hook session-end [options]
```

## Options

- `--session-id, -s <id>` - Session identifier to end
- `--save-state` - Save current session state (default: true)
- `--export-metrics` - Export session metrics
- `--generate-summary` - Create session summary
- `--cleanup-temp` - Remove temporary files

## Examples

### Basic session end
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow hook session-end --session-id "dev-session-2024"
```

### With full export
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow hook session-end -s "feature-auth" --export-metrics --generate-summary
```

### Quick close
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow hook session-end -s "quick-fix" --save-state false --cleanup-temp
```

### Complete persistence
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
npx claude-flow hook session-end -s "major-refactor" --save-state --export-metrics --generate-summary
```

## Features

### State Persistence
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Saves current context
- Stores open files
- Preserves task progress
- Maintains decisions

### Metric Export
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Session duration
- Commands executed
- Files modified
- Tokens consumed
- Performance data

### Summary Generation
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Work accomplished
- Key decisions made
- Problems solved
- Next steps identified

### Cleanup Operations
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Removes temp files
- Clears caches
- Frees resources
- Optimizes storage

## Integration

This hook is automatically called by Claude Code when:
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
- Ending a conversation
- Closing work session
- Before shutdown
- Switching contexts

Manual usage in agents:
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```bash
# At session end
npx claude-flow hook session-end --session-id "your-session" --generate-summary
```

## Output

Returns JSON with:
<<<<<<< HEAD
=======

>>>>>>> 000b3fd (updates)
```json
{
  "sessionId": "dev-session-2024",
  "duration": 7200000,
  "saved": true,
  "metrics": {
    "commandsRun": 145,
    "filesModified": 23,
    "tokensUsed": 85000,
    "tasksCompleted": 8
  },
  "summaryPath": "/sessions/dev-session-2024-summary.md",
  "cleanedUp": true,
  "nextSession": "dev-session-2025"
}
```

## See Also

- `hook session-start` - Session initialization
- `hook session-restore` - Session restoration
- `performance report` - Detailed metrics
<<<<<<< HEAD
- `memory backup` - State backup
=======
- `memory backup` - State backup
>>>>>>> 000b3fd (updates)
