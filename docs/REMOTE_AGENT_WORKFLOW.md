# Remote Agent Collaboration Workflow

## Task Assignment Strategy

### High-Risk Areas (Single Agent Only)
- `lib/supabase/types.ts` - Database type definitions
- `lib/auth/` - Authentication system
- `supabase/migrations/` - Database schema changes
- `app/layout.tsx` - Root layout and providers
- `lib/supabase/server.ts` & `client.ts` - Core database clients

### Medium-Risk Areas (Coordinated Multi-Agent)
- `app/api/` - API endpoints (can be parallelized by endpoint)
- `components/ui/` - Shared UI components
- `lib/api/` - API utilities and validation
- `lib/utils.ts` - Shared utilities

### Low-Risk Areas (Parallel Development Safe)
- `app/dashboard/` - Page components
- `components/task/` - Feature-specific components
- `docs/` - Documentation
- `README.md` - Project documentation
- Individual feature directories

## Branch Naming Convention

```
Type/Scope/Description
├── feature/auth/oauth-integration
├── feature/api/task-reordering
├── feature/ui/drag-drop-enhancement
├── bugfix/task-deletion-cascade
├── docs/api-documentation-update
├── refactor/database-client-optimization
└── hotfix/critical-auth-vulnerability
```

## Agent Coordination Rules

### 1. File Ownership Protocol
- **Primary Owner**: Agent assigned to modify core logic
- **Secondary Contributors**: Agents making related changes
- **Conflict Resolution**: Primary owner has merge priority

### 2. Communication Patterns
- **Pre-work**: Declare intended file modifications
- **During work**: Update shared status (in-progress files)
- **Pre-merge**: Cross-agent review for overlapping changes

### 3. Merge Order Priority
1. Database migrations (highest priority)
2. Type definitions and interfaces
3. Core API changes
4. UI component updates
5. Documentation (lowest priority)

## Conflict Prevention Mechanisms

### Automated Checks
- **File Lock Detection**: Prevent simultaneous edits to critical files
- **Dependency Analysis**: Check for breaking changes in shared modules
- **Type Safety**: Ensure TypeScript compilation across all branches
- **Test Coverage**: Require passing tests before merge

### Manual Coordination
- **Daily Sync**: Agent status updates on active branches
- **Conflict Alerts**: Notification system for overlapping work
- **Review Assignments**: Cross-agent code review requirements

## Testing Strategy for Multi-Agent Changes

### Pre-Merge Testing
```bash
# Each agent runs before creating PR
npm run build          # TypeScript compilation
npm run lint          # Code quality checks
npm run test          # Unit tests
npm run test:integration  # Integration tests
```

### Integration Testing
```bash
# After merging multiple agent branches
npm run test:e2e      # End-to-end tests
npm run test:db       # Database integrity tests
supabase test db      # Supabase-specific tests
```

## Example Multi-Agent Scenarios

### Scenario 1: Parallel API Development
**Agent A**: Implements `/api/tasks/reorder`
**Agent B**: Implements `/api/projects/archive`
**Coordination**: Shared `lib/api/validation.ts` requires merge coordination

### Scenario 2: UI Component Enhancement
**Agent A**: Updates `TaskCard` component
**Agent B**: Updates `TaskList` component  
**Coordination**: Both use shared `task-types.ts` - requires type sync

### Scenario 3: Database Schema Evolution
**Agent A**: Adds new migration for task priorities
**Agent B**: Adds new migration for project templates
**Coordination**: Sequential migration numbering required

## Review & Merge Protocol

### Pull Request Requirements
- [ ] Descriptive title with agent identifier
- [ ] Detailed change summary
- [ ] Test coverage report
- [ ] Breaking change documentation
- [ ] Cross-agent impact assessment

### Review Process
1. **Automated Checks**: CI/CD pipeline validation
2. **Peer Review**: Other agents review for conflicts
3. **Integration Review**: Human oversight for complex changes
4. **Merge Strategy**: Squash for features, merge for hotfixes

## Emergency Procedures

### Conflict Resolution
1. **Immediate**: Stop conflicting work
2. **Assessment**: Identify overlap scope
3. **Coordination**: Primary agent leads resolution
4. **Testing**: Comprehensive integration testing
5. **Documentation**: Record resolution for future reference

### Rollback Strategy
- **Feature Flags**: Toggle new functionality
- **Database Rollback**: Migration reversal procedures
- **Code Rollback**: Git revert with impact analysis
- **Communication**: Immediate stakeholder notification

## Agent Performance Metrics

### Success Indicators
- **Merge Success Rate**: % of PRs merged without conflicts
- **Code Quality Score**: Automated linting/testing results
- **Review Efficiency**: Time from PR creation to merge
- **Cross-Agent Collaboration**: Successful coordination instances

### Monitoring Dashboard
- Active branches per agent
- File lock status
- Pending review queue
- Integration test results

## Best Practices Summary

1. **Plan Before Code**: Always declare file intentions
2. **Communicate Early**: Share progress and blockers
3. **Test Thoroughly**: Never skip integration testing
4. **Review Carefully**: Cross-agent reviews prevent conflicts
5. **Document Everything**: Maintain clear change logs
