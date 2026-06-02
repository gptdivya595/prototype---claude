# Roadmap And System Identification Taxonomy

## Purpose

This document defines how Work Mode decides what the user is asking for and how detailed the editable Work Plan should be.

Work Mode should not expose hidden model reasoning. It should expose an editable external planning structure:

```text
Prompt -> system identification -> roadmap type -> roadmap depth -> suggested modules -> editable Work Plan
```

## System Identification Fields

The detector should identify these fields from every prompt.

| Field | Meaning | Example Values | Required For MVP |
|---|---|---|---|
| `detectedRole` | Who is likely asking or framing the task | Product Manager, Developer, Researcher, Founder, Executive, Designer, Marketer, Business Analyst, Unknown | Yes |
| `detectedArtifact` | What output the user wants | PRD, PPT, Code, Research Report, Strategy Memo, Technical Design, Data Analysis, Email, Unknown | Yes |
| `intentCategory` | What type of work is being requested | planning, drafting, debugging, research, analysis, decision_support, implementation | Yes |
| `recommendedWorkflowId` | Best roadmap template | prd_generation, slide_deck, debugging_bug_fix | Yes |
| `recommendedSkillId` | Best user-visible capability | prd_builder, investor_deck_builder, bug_fix_planner | Yes |
| `confidence` | How certain the detector is | 0.0-1.0 | Yes |
| `sourceMode` | Whether external evidence is needed | none, source_needed_only, user_uploaded, web_search | Yes |
| `riskLevel` | How sensitive the final output is | low, medium, high, restricted | Phase 8+ |
| `domain` | Work domain | product, engineering, research, business, marketing, legal, finance, medical, education | Phase 8+ |
| `audience` | Intended reader | customers, investors, executives, developers, internal team | Phase 8+ |
| `entities` | Named products, companies, tools, or people | Perplexity, OpenAI, Salesforce | Phase 8+ |
| `timeSensitivity` | Whether current data is required | stable, recent, latest, real_time | Phase 8+ |
| `complexity` | Expected planning depth | simple, standard, complex, enterprise | Phase 8+ |

## Confidence Bands

| Band | Range | Behavior |
|---|---:|---|
| High | `>= 0.80` | Auto-select workflow, skill, modules, and source mode. User can still override. |
| Medium | `0.65-0.79` | Show recommended route plus alternatives. Continue allowed. |
| Low | `< 0.65` | Show warning, questions, and alternatives. Continue allowed only after visible confirmation/override. |

## Roadmap Detail Levels

Work Mode should vary detail by prompt complexity and selected mode.

| Level | Name | When Used | Typical Sections | User Experience |
|---|---|---|---:|---|
| L1 | Light Roadmap | simple drafting or quick structure | 3-5 | Fast editable outline |
| L2 | Standard Work Plan | normal PRD, deck, research, debugging | 6-10 | Default MVP depth |
| L3 | Deep Work Plan | competitor, investor, technical, source-heavy, risky tasks | 10-16 | More assumptions, validation, risks, sources |
| L4 | Enterprise Roadmap | cross-functional, compliance, high-stakes, multi-team tasks | 16-25 | Large-plan warning, stronger validation |

MVP should support L2 and L3 well. L1 and L4 can be represented in the architecture and backend schemas but do not need full UI polish yet.

## Supported Roadmap Types

### MVP Roadmaps

These are implemented first and should be polished end to end.

| Roadmap Type | Workflow ID | Skill ID | Primary Artifacts | Default Detail |
|---|---|---|---|---|
| Product Requirements Roadmap | `prd_generation` | `prd_builder` | PRD, BRD, Technical Design | L2 |
| Investor / Slide Deck Roadmap | `slide_deck` | `investor_deck_builder` | PPT, Strategy Memo, Competitive Analysis | L2-L3 |
| Debugging / Bug Fix Roadmap | `debugging_bug_fix` | `bug_fix_planner` | Code, Test Plan, Technical Design | L2 |

### Near-Term Roadmaps

These should be in the backend registry before the product grows beyond the prototype.

| Roadmap Type | Workflow ID | Main Role | Main Artifact | Notes |
|---|---|---|---|---|
| Technical Architecture | `technical_architecture` | Developer, Architect | Technical Design | Services, APIs, data, tradeoffs, scaling |
| Competitive Analysis | `competitive_analysis` | Researcher, Founder, PM | Competitive Analysis | Sources, competitors, positioning, risks |
| Research Report | `research_report` | Researcher | Research Report | Questions, source plan, evidence, limitations |
| Strategy Memo | `strategy_memo` | Founder, Executive | Strategy Memo | Options, tradeoffs, recommendation |
| Data Analysis Plan | `data_analysis_plan` | Analyst | Data Analysis | Dataset, hypotheses, methods, charts |
| Go-To-Market Plan | `gtm_plan` | Marketer, Founder | GTM Plan | Audience, channels, messaging, launch |
| UX Research Plan | `ux_research_plan` | Designer, Researcher | Research Plan | Participants, methods, scripts, synthesis |
| Test Plan | `test_plan` | Developer, QA | Test Plan | Scope, cases, automation, regression |
| API Design | `api_design` | Developer | Technical Design | Endpoints, schemas, errors, examples |

### Later Roadmaps

These should stay planned until the MVP proves the loop.

| Roadmap Type | Workflow ID | Why Later |
|---|---|---|
| Legal/Policy Review | `policy_review` | Requires high-stakes disclaimers and domain-specific guardrails |
| Financial Analysis | `financial_analysis` | Requires stronger source and calculation validation |
| Medical/Clinical Summary | `clinical_summary` | High-stakes safety constraints |
| Hiring Interview Kit | `interview_kit` | Bias and compliance concerns |
| Board Deck | `board_deck` | More complex executive/storytelling templates |
| Incident Postmortem | `incident_postmortem` | Useful after debugging workflow is stable |

## Detection Rules For MVP

### Role Signals

| Role | Strong Signals |
|---|---|
| Product Manager | PRD, feature, requirements, users, MVP, success metrics |
| Developer | bug, error, code, API, database, fix, stack trace, test |
| Researcher | research, report, compare, sources, evidence, market |
| Founder | investor, pitch, fundraising, moat, strategy, growth |
| Designer | UX, wireframe, usability, user journey, prototype |
| Marketer | campaign, messaging, launch, channels, positioning |
| Business Analyst | BRD, process, stakeholders, requirements, operations |
| Executive | strategy, board, decision, priorities, tradeoffs |

### Artifact Signals

| Artifact | Strong Signals |
|---|---|
| PRD | PRD, product requirements, feature spec, user stories |
| PPT | PPT, deck, slides, presentation |
| Code | code, bug, fix, function, API, repo, error |
| Research Report | research report, sources, findings, literature, evidence |
| Competitive Analysis | competitors, alternatives, versus, positioning |
| Technical Design | architecture, system design, data model, API design |
| Strategy Memo | strategy, memo, recommendation, options |
| Data Analysis | dataset, metrics, analysis, SQL, dashboard |

### Source Mode Signals

| Source Mode | Signals |
|---|---|
| `none` | User asks for structure, internal plan, code fix, or drafting from supplied context |
| `source_needed_only` | latest, recent, market, pricing, competitors, statistics, claims, evidence |
| `user_uploaded` | attached file, document, spreadsheet, PDF, contract, notes |
| `web_search` | live search, browse, current news, today's, real-time |

For MVP, `user_uploaded` and `web_search` should be visible as future modes or disabled unless actually implemented.

## Roadmap Depth Rules

Choose roadmap depth using these rules.

```text
if prompt is short or ambiguous:
  depth = L1
  confidence = low

if prompt asks for a normal PRD, deck, or bug fix:
  depth = L2

if prompt mentions competitors, investors, architecture, technical feasibility, risk, source-heavy claims, or multiple stakeholders:
  depth = L3

if prompt spans multiple teams, compliance, budget, legal, medical, financial, security, or enterprise rollout:
  depth = L4
  require stronger validation and warnings
```

## Example Identification Outputs

### PPT Competitor Prompt

Prompt:

```text
Make a PPT on competitors of Perplexity for investors.
```

Expected:

```json
{
  "detectedRole": "Founder",
  "detectedArtifact": "PPT",
  "intentCategory": "presentation_planning",
  "recommendedWorkflowId": "slide_deck",
  "recommendedSkillId": "investor_deck_builder",
  "confidence": 0.88,
  "sourceMode": "source_needed_only",
  "roadmapDepth": "L3",
  "recommendedModuleIds": [
    "assumptions",
    "validation_checklist",
    "competitor_analysis",
    "investor_framing",
    "sources_required"
  ]
}
```

### PRD Prompt

Prompt:

```text
Create a PRD for an AI meeting summarizer.
```

Expected:

```json
{
  "detectedRole": "Product Manager",
  "detectedArtifact": "PRD",
  "intentCategory": "product_planning",
  "recommendedWorkflowId": "prd_generation",
  "recommendedSkillId": "prd_builder",
  "confidence": 0.84,
  "sourceMode": "none",
  "roadmapDepth": "L2",
  "recommendedModuleIds": [
    "assumptions",
    "user_personas",
    "metrics",
    "risk_analysis",
    "validation_checklist"
  ]
}
```

### Debugging Prompt

Prompt:

```text
Fix the session bug in login redirect.
```

Expected:

```json
{
  "detectedRole": "Developer",
  "detectedArtifact": "Code",
  "intentCategory": "debugging",
  "recommendedWorkflowId": "debugging_bug_fix",
  "recommendedSkillId": "bug_fix_planner",
  "confidence": 0.82,
  "sourceMode": "none",
  "roadmapDepth": "L2",
  "recommendedModuleIds": [
    "root_cause_analysis",
    "test_cases",
    "validation_checklist",
    "risk_analysis",
    "database_schema"
  ]
}
```

## Product Decision

For the current prototype:

```text
Implemented polished roadmap types: 3
Documented near-term roadmap types: 9
Documented later roadmap types: 6
Total planned roadmap types: 18
Detection fields MVP: 7
Detection fields planned: 12
Roadmap detail levels: 4
```

This is enough for a convincing prototype while leaving a clear path to a broader workflow platform.
