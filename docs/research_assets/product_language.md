# Product Language Guide

## Purpose

Keep Work Mode copy accurate, safe, and consistent.

## Core Language Rule

Work Mode shows an editable external plan. It does not expose the model's hidden reasoning.

## Preferred Terms

- Work Mode
- Work Plan
- Answer Roadmap
- Blueprint
- Approved plan
- Detected role
- Artifact
- Recommended skill
- Suggested modules
- Source mode
- Validation criteria
- Generate answer
- Validation summary
- Source needed

## Avoid Terms

- Raw thought process
- Chain-of-thought
- CoT
- Hidden reasoning
- Model thoughts
- Secret reasoning
- Internal monologue

## UI Copy Examples

### Empty State

```text
Start with a prompt. Work Mode will create an editable plan before generating.
```

### Detection Summary

```text
Detected role
Artifact
Recommended skill
Source mode
```

### Low Confidence

```text
This detection is uncertain. Review the role, artifact, and skill before continuing.
```

### Suggestions

```text
Choose the modules this Work Plan should include.
```

### Source Needed

```text
This task may need current evidence. Claims will be marked source-needed unless sources are provided.
```

### Work Plan

```text
Edit the roadmap the assistant will follow.
```

### Approval

```text
Approve this Work Plan before generating.
```

```text
Approved. The final answer will use this snapshot.
```

### Edit After Approval

```text
Edits reset approval. Approve again before generating.
```

### Generation

```text
Generating from the approved Work Plan.
```

### Validation

```text
Validation summary
```

```text
The answer follows the approved Work Plan.
```

```text
Some claims need sources before use.
```

## Error Copy

### Backend Unavailable

```text
The backend is unavailable. You can keep editing locally and retry when it reconnects.
```

### Stale Version

```text
This Work Plan changed elsewhere. Reload the latest version before saving.
```

### Generate Before Approval

```text
Approve the Work Plan before generating.
```

### OpenAI Unavailable

```text
Model generation is unavailable. Retry or use the template fallback.
```

## Tone

- Clear
- Calm
- Direct
- Professional
- Not cute
- Not mystical
- Not overly technical

## Writing Rules

- Prefer short labels.
- Put explanations near the relevant control.
- Do not use long tutorial paragraphs in the interface.
- Do not imply facts are verified when source mode is `source_needed_only`.
- Do not imply model reasoning is exposed.
