---
id: TASK_2026_010_6e8e
status: backlog
type: DEVOPS
title: Add the CI guards for recording leaks and layout-ignore attributes
depends_on: [TASK_2026_005_74c2, TASK_2026_009_4b9a]
created: "2026-10-06T00:00:00.000Z"
updated: "2026-10-06T00:00:00.000Z"
description: "Fail CI on any self-shot slug that is not on the SELFSHOT_KIT_SLUGS allowlist, and on data-layout-ignore or data-layout-allow-* attributes in project sources."
executor: devops-engineer
labels:
  - nx-video
relates_to:
  - ptah-extension:TASK_2026_582_a7db
---

<!-- Ptah carrier: machine-owned metadata. Ptah rewrites the frontmatter above. Do NOT write prose here — prose belongs in ./context.md. -->

Fail CI on any self-shot slug that is not on the SELFSHOT_KIT_SLUGS allowlist, and on data-layout-ignore or data-layout-allow-* attributes in project sources.

Full context, plan and discussion live in [./context.md](./context.md).
