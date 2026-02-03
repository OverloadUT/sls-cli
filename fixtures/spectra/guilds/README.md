---
description: Collection of AI agent guilds
sls:schema:
  children:
    - pattern: "*"
      type: directory
      children:
        - name: agents
          type: directory
          required: true
          description: Guild member agent workspaces
          children:
            - pattern: "*"
              type: directory
              sls:height: 2
              children:
                - name: agent.md
                  required: true
                  description: Agent identity, personality, and core directives
                - name: tools.md
                  required: true
                  description: Available tools and usage patterns
                - name: memories
                  type: directory
                  description: Persistent memories across sessions
                  sls:depth: 0
                - name: ideas
                  type: directory
                  description: Ideas and concepts being developed
                  sls:depth: 0
---

# Guilds

Each guild is a specialized team of AI agents focused on a particular domain.
